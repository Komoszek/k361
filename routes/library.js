var express = require('express');
var router = express.Router();

var fs = require('fs');
var shortid = require('shortid');
var youtube = require('youtube-mp3-downloader');
var youtubeInfo = require('youtube-info');
var sox = require('sox');

var db = require('../db.js'); // LIB-XXX-XXX
var auth = require('../auth.js');
var config = require('../config.js');

var child_process = require('child_process');

router.get( '/', function( req, res ) {

    if ( !auth.validate(req) ) {

        res.status(401).send('Unauthorized'); return; }

    var Catalog = db.sread('LIB-CATALOG');

    if ( !Catalog.valid ) {

        res.status(500).send('Library catalog is inaccessible!');
return; }

    res.json( { catalog: Catalog.obj.catalog, timestamp: Catalog.obj.timestamp } );

    } );

router.get( '/tracks', function( req, res ) {

    if ( !auth.validate(req) ) {

        res.status(401).send('Unauthorized'); return; }

    var Catalog = db.sread('LIB-CATALOG');

    if ( !Catalog.valid ) {

        res.status(500).send('Library catalog is inaccessible!');
return; }

    var Tracks = [];

    for ( var i = 0; i < Catalog.obj.tracks.length; i++ ) {

        var Track = db.sread( 'LIB-TRACK-' + Catalog.obj.tracks[i] );

        if ( Track.valid ) {

            Tracks.push( Track.obj ); } }

    res.json( Tracks );

    } );

router.get( '/track', function( req, res ) { // { id: STRING }

    if ( !auth.validate(req) ) {

        res.status(401).send('Unauthorized'); return; }

    var Track = db.sread( 'LIB-TRACK-' + req.query.id );

    if ( !Track.valid ) {

        res.status(400).send('Track has not been found.'); return; }

    res.json( Track.obj );

    } );

router.post( '/track', function( req, res ) { // { id: STRING, title: STRING, album: STRING, author: STRING, begin: NUMBER, end: NUMBER, volume: NUMBER, rate: NUMBER }

    if ( !auth.validate(req) ) {

        res.status(401).send('Unauthorized'); return; }

    var Catalog = db.sread('LIB-CATALOG');

    if ( !Catalog.valid ) {

        res.status(500).send('Library catalog is inaccessible!');
return; }

    var Track = db.sread( 'LIB-TRACK-' + req.body.id );

    if ( !Track.valid ) {

        res.status(400).send('Track has not been found.'); return; }

    if ( Track.obj.state === 'ERROR' ) {

        res.status(400).send('Track is corrupted.'); return; }

    else if ( Track.obj.state === 'REMOVED' ) {

        res.status(400).send('Track was removed.'); return; }

    else if ( Track.obj.state !== 'READY' ) {

        res.status(400).send('Track is not ready.'); return; }

    if ( typeof( req.body.title ) == 'string' ) {

        Track.obj.title = req.body.title.substr( 0, 256 ); }

    if ( typeof( req.body.album ) == 'string' ) {

        Track.obj.album = req.body.album.substr( 0, 256 ); }

    if ( typeof( req.body.tags ) == 'object' ) {

        Track.obj.tags = req.body.tags; }

    if ( typeof( req.body.author ) == 'string' ) {

        Track.obj.author = req.body.author.substr( 0, 256 ); }

    if ( typeof( req.body.begin ) == 'number' ) {

        Track.obj.begin = Math.floor( req.body.begin ); }

    if ( typeof( req.body.end ) == 'number' ) {

        Track.obj.end = Math.floor( req.body.end ); }

    if ( typeof( req.body.volume ) == 'number' ) {

        Track.obj.volume = Math.floor( req.body.volume ); }

    if ( typeof( req.body.rate ) == 'number' ) {

        Track.obj.rate = Math.floor( req.body.rate ); }

    if ( Track.obj.begin < 0 ) {

        Track.obj.begin = 0; }

    if ( Track.obj.end > Track.obj.length ) {

        Track.obj.end = Track.obj.length; }

    if ( Track.obj.end < Track.obj.begin ) {

        var Temporary = Track.obj.end;

        Track.obj.end = Track.obj.begin;
        Track.obj.begin = Temporary; }

    if ( Track.obj.volume < 0 || Track.obj.volume > 100 ) {

        Track.obj.volume = 100; }

    if ( Track.obj.rate < 0 || Track.obj.rate > 10 ) {

        Track.obj.rate = 5; }

    if ( Track.obj.rate !== Math.floor( Track.obj.rate ) ) {

        Track.obj.rate = Math.floor( Track.obj.rate ); }

    for ( var i = 0; i < Catalog.obj.catalog.length; i++ ) {

        if ( Catalog.obj.catalog[i].id === Track.obj.id ) {

            var Timestamp = Date.now();

            Catalog.obj.timestamp = Timestamp;
            Catalog.obj.catalog[i].timestamp = Timestamp;

            Catalog.obj.catalog[i].title = Track.obj.title;
            Catalog.obj.catalog[i].album = Track.obj.album;
            Catalog.obj.catalog[i].author = Track.obj.author;
            Catalog.obj.catalog[i].length = Track.obj.end - Track.obj.begin;
            Catalog.obj.catalog[i].tags = Track.obj.tags;

            break; } }

    db.swrite( 'LIB-TRACK-' + Track.obj.id, Track.obj, function ( ) {

        db.swrite( 'LIB-CATALOG', Catalog.obj );

        } );

    res.sendStatus(200);

    } );

router.post( '/upload', function( req, res ) {

    if ( !auth.validate(req) ) {

        res.status(401).send('Unauthorized'); return; }

    // TODO: UPLOAD TRACK

    } );

router.post( '/download', function( req, res ) { // { service: STRING, code: STRING }
    if ( !auth.validate(req) ) {

        res.status(401).send('Unauthorized'); return; }

    if ( req.body.service === 'YOUTUBE' ) {

        var Catalog = db.sread('LIB-CATALOG');

        if ( !Catalog.valid ) {

            res.status(500).send('Library catalog is inaccessible!');
return; }

        var Track = {

            id: shortid.generate(),

            title: '',
            album: '',
            author: '',
            tags: [{"text":"new"}],


            length: 0,
            begin: 0,
            end: 0,

            volume: 100,
            rate: 5,
            views: 0,

            path: '',
            state: 'DOWNLOAD'

            };

        Catalog.obj.tracks.push( Track.id );

        db.swrite( 'LIB-CATALOG', Catalog.obj );
        db.swrite( 'LIB-TRACK-' + Track.id, Track, function ( ) {

            var File = new youtube( {

                'ffmpegPath': config.ffmpeg_path,
                'outputPath': './tracks',
                'youtubeVideoQuality': 'highest',
                'queueParallelism': 10,
                'progressTimeout': 5000

                } );
                
            File.download( req.body.code, Track.id + '.mp3' );

            File.on( 'finished', function( data ) {
                var Catalog = db.sread('LIB-CATALOG');

                if ( !Catalog.valid ) {

                    console.log( 'While downloading track #' + Track.id + ' an error occurred: Library catalog is inaccessible!' ); return; }


                    var GainControl = child_process.exec('mp3gain -s r -r -c "tracks/' + Track.id + '.mp3"');
                    GainControl.on('exit',function(code, signal){

                youtubeInfo( req.body.code, function ( err, videoInfo ) {

                    Track.path = Track.id + '.mp3';
                    Track.state = 'READY';

                    if ( err ) {

                        var Timestamp = Date.now();

                        Track.title = Track.id;
                        Track.album = 'Youtube';
                        Track.author = 'Unknown';
                        Track.tags = [];
                        Track.length = 300;
                        Track.end = Track.length;

                        Catalog.obj.catalog.push( {

                            id: Track.id,
                            timestamp: Timestamp,

                            title: Track.title,
                            album: Track.album,
                            author: Track.author,
                            tags: Track.tags,
                            length: Track.length

                            } );

                        Catalog.obj.timestamp = Timestamp;

                        db.swrite( 'LIB-TRACK-' + Track.id, Track, function ( ) {

                            db.swrite( 'LIB-CATALOG', Catalog.obj );

                            } );

                        console.log( 'While obtaining track info from Youtube an error occurred: ' + err ); }

                    else {

                        var Timestamp = Date.now();

                        Track.title = videoInfo.title;
                        Track.album = 'Youtube';
                        Track.author = videoInfo.owner;
                        Track.length = videoInfo.duration;
                        Track.end = Track.length;

                        Catalog.obj.catalog.push( {

                            id: Track.id,
                            timestamp: Timestamp,

                            title: Track.title,
                            album: Track.album,
                            author: Track.author,
                            tags: Track.tags,
                            length: Track.length

                            } );


                        //KOMOSZEK TEMP FIX


                        var ViewsSum = 0, ViewsCount = 0;

                        for ( var i = 0; i < Catalog.obj.tracks.length; i++ ) {

                            var TempTrack = db.sread( 'LIB-TRACK-' + Catalog.obj.tracks[i] );

                            if ( TempTrack.valid  && TempTrack.obj.state === 'READY') {

                                ViewsSum += TempTrack.obj.views;
                                ViewsCount++;
                            }
                        }

                        if(ViewsCount)Track.views = parseInt(ViewsSum/ViewsCount)+1;

                        Catalog.obj.timestamp = Timestamp;

                        var TrackIndex = Catalog.obj.catalog.length-1;
                        var TrackId = Track.id;

                        setTimeout((function(TrackIndex,TrackId,Timestamp){
                          var Catalog = db.sread('LIB-CATALOG');
                          if(Catalog.obj.catalog.length > 0){

                        var index;

                        if(TrackIndex < Catalog.obj.catalog.length && Catalog.obj.catalog[TrackIndex].id === TrackId){
                          index = Catalog.obj.catalog[TrackIndex].tags.findIndex(x => x.text=="new");
                          if(index > -1)
                            Catalog.obj.catalog[TrackIndex].tags.splice(index, 1);

                        } else {
                          var indexa = 0;
                          var indexb = Catalog.obj.catalog.length-1;
                          var indexm = Math.floor((indexa + indexb)/2);

                          while( indexa < indexb && Catalog.obj.catalog[indexm].timestamp !== Timestamp){
                            if(Catalog.obj.catalog[indexm].timestamp < Timestamp)
                              indexa = indexm + 1;
                            else
                              indexb = indexm - 1;

                            indexm = Math.floor((indexa + indexb)/2);
                          }
                          indexm = Math.floor((indexa + indexb)/2);
                            if(Catalog.obj.catalog[indexm].timestamp !== Timestamp)
                            return;

                            index = Catalog.obj.catalog[indexm].tags.findIndex(x => x.text=="new");
                            if(index > -1)
                              Catalog.obj.catalog[indexm].tags.splice(index, 1);
                        }

                        var TimeoutTrack = db.sread( 'LIB-TRACK-' + TrackId );

                        index = TimeoutTrack.obj.tags.findIndex(x => x.text=="new");
                        if(index > -1)
                          TimeoutTrack.obj.tags.splice(index, 1);

                          db.swrite( 'LIB-TRACK-' + TrackId, TimeoutTrack.obj, function ( ) {

                              db.swrite( 'LIB-CATALOG', Catalog.obj );

                              } );
                        }
                        }),86400000,TrackIndex,TrackId,Timestamp);
//86400000
                        db.swrite( 'LIB-TRACK-' + Track.id, Track, function ( ) {

                            db.swrite( 'LIB-CATALOG', Catalog.obj );

                            } );

                        }

                    } );

                console.log( 'Track #' + Track.id + ' has been downloaded. It\'s now ready to use.' );
              });

                } );

            File.on( 'error', function( error ) {

                Track.path = Track.id + '.mp3';
                Track.state = 'ERROR';

                db.swrite( 'LIB-TRACK-' + Track.id, Track );

                console.log( 'While downloading track #' + Track.id + ' an error occurred: ' + error ); } );

            File.on( 'progress', function( progress ) {

                console.log( 'Downloading track ' + Track.id + ' - ' + progress.progress.percentage.toFixed(2) + '%' ); } );

            res.send(Track.id);

            } );

        } else if (req.body.service === 'LOCAL'){

              var Catalog = db.sread('LIB-CATALOG');

              if ( !Catalog.valid ) {

                  res.status(500).send('Library catalog is inaccessible!'); return; }

              var Track = {

                  id: shortid.generate(),

                  title: '',
                  album: '',
                  author: '',
                  tags: [{"text":"new"}],


                  length: 0,
                  begin: 0,
                  end: 0,

                  volume: 100,
                  rate: 5,
                  views: 0,

                  path: '',
                  state: 'DOWNLOAD'

                  };

              Catalog.obj.tracks.push( Track.id );

              db.swrite( 'LIB-CATALOG', Catalog.obj );
              db.swrite( 'LIB-TRACK-' + Track.id, Track, function ( ) {



                fs.writeFile('tracks/' + Track.id + '.mp3', req.files.file.data, function(err) {
                if(err) {
                return console.log(err);
                }

                console.log("The file was saved!");

                      var Catalog = db.sread('LIB-CATALOG');

                      if ( !Catalog.valid ) {

                          console.log( 'While downloading track #' + Track.id + ' an error occurred: Library catalog is inaccessible!' ); return; }

                          var GainControl = child_process.exec('mp3gain -s r -r -c "tracks/' + Track.id + '.mp3"');
                          GainControl.on('exit',function(code, signal){

                                //SOME FILE
                      sox.identify( 'tracks/' + Track.id + '.mp3', function ( err, results ) {

                          Track.path = Track.id + '.mp3';
                          Track.state = 'READY';

                          if ( err ) {

                            console.log(`Current directory: ${process.cwd()}`);

                              var Timestamp = Date.now();

                              Track.title = Track.id;
                              Track.album = 'Local';
                              Track.author = 'Unknown';
                              Track.tags = [];
                              Track.length = 300;
                              Track.end = Track.length;

                              Catalog.obj.catalog.push( {

                                  id: Track.id,
                                  timestamp: Timestamp,

                                  title: Track.title,
                                  album: Track.album,
                                  author: Track.author,
                                  tags: Track.tags,
                                  length: Track.length

                                  } );

                              Catalog.obj.timestamp = Timestamp;

                              db.swrite( 'LIB-TRACK-' + Track.id, Track, function ( ) {

                                  db.swrite( 'LIB-CATALOG', Catalog.obj );

                                  } );

                              console.log( 'While obtaining track info from Youtube an error occurred: ' + err ); }

                          else {

                              var Timestamp = Date.now();
//TITLE NAME
                              Track.title = req.files.file.name.replace(/\.[^/.]+$/, "");
                              Track.album = 'Local';
                              Track.author = 'Unknown';
                              Track.length = Math.ceil(results.duration);
                              Track.end = Track.length;

                              Catalog.obj.catalog.push( {

                                  id: Track.id,
                                  timestamp: Timestamp,

                                  title: Track.title,
                                  album: Track.album,
                                  author: Track.author,
                                  tags: Track.tags,
                                  length: Track.length

                                  } );


                              //KOMOSZEK TEMP FIX


                              var ViewsSum = 0, ViewsCount = 0;

                              for ( var i = 0; i < Catalog.obj.tracks.length; i++ ) {

                                  var TempTrack = db.sread( 'LIB-TRACK-' + Catalog.obj.tracks[i] );

                                  if ( TempTrack.valid  && TempTrack.obj.state === 'READY') {

                                      ViewsSum += TempTrack.obj.views;
                                      ViewsCount++;
                                  }
                              }

                              if(ViewsCount)Track.views = parseInt(ViewsSum/ViewsCount)+1;

                              Catalog.obj.timestamp = Timestamp;

                              var TrackIndex = Catalog.obj.catalog.length-1;
                              var TrackId = Track.id;

                              setTimeout((function(TrackIndex,TrackId,Timestamp){
                                var Catalog = db.sread('LIB-CATALOG');
                                if(Catalog.obj.catalog.length > 0){

                              var index;

                              if(TrackIndex < Catalog.obj.catalog.length && Catalog.obj.catalog[TrackIndex].id === TrackId){
                                index = Catalog.obj.catalog[TrackIndex].tags.findIndex(x => x.text=="new");
                                if(index > -1)
                                  Catalog.obj.catalog[TrackIndex].tags.splice(index, 1);

                              } else {
                                var indexa = 0;
                                var indexb = Catalog.obj.catalog.length-1;
                                var indexm = Math.floor((indexa + indexb)/2);

                                while( indexa < indexb && Catalog.obj.catalog[indexm].timestamp !== Timestamp){
                                  if(Catalog.obj.catalog[indexm].timestamp < Timestamp)
                                    indexa = indexm + 1;
                                  else
                                    indexb = indexm - 1;

                                  indexm = Math.floor((indexa + indexb)/2);
                                }
                                indexm = Math.floor((indexa + indexb)/2);
                                  if(Catalog.obj.catalog[indexm].timestamp !== Timestamp)
                                  return;

                                  index = Catalog.obj.catalog[indexm].tags.findIndex(x => x.text=="new");
                                  if(index > -1)
                                    Catalog.obj.catalog[indexm].tags.splice(index, 1);
                              }

                              var TimeoutTrack = db.sread( 'LIB-TRACK-' + TrackId );

                              index = TimeoutTrack.obj.tags.findIndex(x => x.text=="new");
                              if(index > -1)
                                TimeoutTrack.obj.tags.splice(index, 1);

                                db.swrite( 'LIB-TRACK-' + TrackId, TimeoutTrack.obj, function ( ) {

                                    db.swrite( 'LIB-CATALOG', Catalog.obj );

                                    } );
                              }
                              }),86400000,TrackIndex,TrackId,Timestamp);
          //86400000
                              db.swrite( 'LIB-TRACK-' + Track.id, Track, function ( ) {

                                  db.swrite( 'LIB-CATALOG', Catalog.obj );

                                  } );

                              }

                          } );

                          });

                      console.log( 'Track #' + Track.id + ' has been downloaded. It\'s now ready to use.' );

/*
                  File.on( 'error', function( error ) {

                      Track.path = Track.id + '.mp3';
                      Track.state = 'ERROR';

                      db.swrite( 'LIB-TRACK-' + Track.id, Track );

                      console.log( 'While downloading track #' + Track.id + ' an error occurred: ' + error ); } );

                  File.on( 'progress', function( progress ) {

                      console.log( 'Downloading track ' + Track.id + ' - ' + progress.progress.percentage.toFixed(2) + '%' ); } );
*/
                });
                res.send(Track.id);

                } );
        }

    else {

        res.status(400).send('Unknown service'); }

    } );

router.post( '/remove', function( req, res ) { // { id: STRING }

    if ( !auth.validate(req) ) {

        res.status(401).send('Unauthorized'); return; }

    var Catalog = db.sread('LIB-CATALOG');

    if ( !Catalog.valid ) {

        res.status(500).send('Library catalog is inaccessible!');
return; }

    var Track = db.sread( 'LIB-TRACK-' + req.body.id );

    if ( !Track.valid ) {

        res.status(400).send('Track has not been found.'); return; }

    for ( var i = 0; i < Catalog.obj.catalog.length; i++ ) {

        if ( Catalog.obj.catalog[i].id === Track.obj.id ) {

            var Timestamp = Date.now();

            Catalog.obj.timestamp = Timestamp;
            Catalog.obj.catalog[i].timestamp = Timestamp;

            Track.obj.state = 'REMOVED';
            Catalog.obj.catalog.splice( i, 1 );

            break; } }

    db.swrite( 'LIB-TRACK-' + Track.obj.id, Track.obj, function ( ) {

        db.swrite( 'LIB-CATALOG', Catalog.obj );

        } );

    res.sendStatus(200);

    } );

router.post( '/restore', function( req, res ) { // { id: STRING }

    if ( !auth.validate(req) ) {

        res.status(401).send('Unauthorized'); return; }

    var Catalog = db.sread('LIB-CATALOG');

    if ( !Catalog.valid ) {

        res.status(500).send('Library catalog is inaccessible!');
return; }

    var Track = db.sread( 'LIB-TRACK-' + req.body.id );

    if ( !Track.valid ) {

        res.status(400).send('Track has not been found.'); return; }

    if ( Track.obj.state !== 'REMOVED' ) {

        res.status(400).send('Track has not been removed.'); return; }

    for ( var i = 0; i < Catalog.obj.catalog.length; i++ ) {

        if ( Catalog.obj.catalog[i].id === Track.obj.id ) {

            var Timestamp = Date.now();

            Track.obj.state = 'READY';

            Catalog.obj.catalog.push( {

                id: Track.id,
                timestamp: Timestamp,

                title: Track.title,
                album: Track.album,
                author: Track.author,
                tags: Track.tags,
                length: Track.end - Track.begin

                } );

            Catalog.obj.timestamp = Timestamp;

            break; } }

    db.swrite( 'LIB-TRACK-' + Track.obj.id, Track.obj, function ( ) {

        db.swrite( 'LIB-CATALOG', Catalog.obj );

        } );

    res.sendStatus(200);

    } );

router.get( '/clean', function( req, res ) {

    if ( !auth.validate(req) ) {

        res.status(401).send('Unauthorized'); return; }

    var Catalog = db.sread('LIB-CATALOG');

    if ( !Catalog.valid ) {

        res.status(500).send('Library catalog is inaccessible!');
return; }

    console.log('Cleaning library');



    for ( var i = 0; i < Catalog.obj.tracks.length; i++ ) {

        var Track = db.sread( 'LIB-TRACK-' + Catalog.obj.tracks[i] );

        if ( Track.valid ) {

            if ( Track.obj.state == 'ERROR' || Track.obj.state == 'REMOVED' ) {

                if ( fs.existsSync( 'tracks/' + Track.obj.path ) && Track.obj.path != '' ) {

                    fs.unlink( 'tracks/' + Track.obj.path, function ( err ) {

                        if ( err ) {

                            console.log( 'While deleting file \'tracks/' + Track.obj.path + '\' an error occurred: ' + err ); }

                        } ); }

                // db.sremove( 'LIB-TRACK-' + Track.obj.id ); // TODO: THIS FUNCTION DAMAGES THE DATABASE - FIX IT

                Catalog.obj.timestamp = Date.now();
                // Catalog.obj.tracks.splice( i, 1 ); // TODO: UNCOMMENT WHEN UPPER BUG WILL BE FIXED

                /* i--; */ } } // TODO: UNCOMMENT WHEN UPPER BUG WILL BE FIXED

        else {

            Catalog.obj.timestamp = Date.now();
            Catalog.obj.tracks.splice( i, 1 );

            i--; } }

    db.swrite( 'LIB-CATALOG', Catalog.obj );



    res.sendStatus(200);

    } );

module.exports = router;
