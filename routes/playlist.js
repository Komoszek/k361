var express = require('express');
var router = express.Router();

var shortid = require('shortid');
var player = require('play-sound')(opts={});

var db = require('../db.js'); // PLT-XXX-XXX
var auth = require('../auth.js');

router.get( '/', function( req, res ) {

    if ( !auth.validate(req) ) {

        res.status(401).send('Unauthorized'); return; }

    var Audio = db.dread( 'PLT-AUDIO' );

    if ( !Audio.valid ) {

        res.status(500).send('Audio stream is inaccessible!'); return; }

    var Schedule = db.sread('PLT-SCHEDULE');

    if ( !Schedule.valid ) {

        res.status(500).send('Playlist schedule is inaccessible!'); return; }

    res.json( { audio: { playing: Audio.obj.playing, track: Audio.obj.track }, schedule: Schedule.obj.schedule, timestamp: Schedule.obj.timestamp } );

    } );

router.post( '/play', function( req, res ) {

    if ( !auth.validate(req) ) {

        res.status(401).send('Unauthorized'); return; }

    if ( req.app.locals.GetAudioAccessPermission( db ) ) {

        res.status(409).send('Track must not be played during reserved time intervals.'); return; }

    var Track = db.sread( 'LIB-TRACK-' + req.body.id );

    if ( !Track.valid ) {

        res.status(400).send('Track has not been found.'); return; }

    if ( Track.obj.state == 'ERROR' ) {

        res.status(400).send('Track is corrupted.'); return; }

    else if ( Track.obj.state == 'REMOVED' ) {

        res.status(400).send('Track was removed.'); return; }

    else if ( Track.obj.state != 'READY' ) {

        res.status(400).send('Track is not ready.'); return; }

    var Audio = db.dread( 'PLT-AUDIO' );

    if ( !Audio.valid ) {

        res.status(500).send('Audio stream is inaccessible!'); return; }

    if ( Audio.obj.playing ) {
      console.log("aaaa");

        Audio.obj.stream.kill(); }
	console.log(Track.obj.begin);
    Audio.obj.stream = player.play( 'tracks/' + Track.obj.path, { mplayer: [ '-ss', Track.obj.begin, '−volume', Track.obj.volume, '-really-quiet' ] }, function( err ) {


                    if ( err && err !== 1  && !err.killed ) {

            var Audio = db.dread( 'PLT-AUDIO' );

            if ( !Audio.valid ) {

                Audio.obj.playing = false;
                Audio.obj.track = '';

                db.dwrite( 'PLT-AUDIO', Audio.obj ); }

            console.log( 'While playing track an error occurred: ' + err + Track.obj); }

        } );

    Audio.obj.playing = true;
    Audio.obj.track = Track.obj.id;

    db.dwrite( 'PLT-AUDIO', Audio.obj );
    clearTimeout( req.app.locals.PlaylistManagerTimeout );

    req.app.locals.PlaylistManagerTimeout = setTimeout( function ( ) {

        var Audio = db.dread( 'PLT-AUDIO' );

        if ( Audio.valid ) {
console.log("kuku");
            Audio.obj.stream.kill();

            Audio.obj.playing = false;
            Audio.obj.track = '';

            db.dwrite( 'PLT-AUDIO', Audio.obj ); }

        req.app.locals.PlaylistManager( req.app, db, player );

        }, ( Track.obj.end - Track.obj.begin ) * 1000 );

    res.sendStatus(200);

    } );

router.get( '/stop', function( req, res ) {

    if ( !auth.validate(req) ) {

        res.status(401).send('Unauthorized'); return; }

    var Audio = db.dread( 'PLT-AUDIO' );

    if ( !Audio.valid ) {

        res.status(500).send('Audio stream is inaccessible!'); return; }

    if ( Audio.obj.playing ) {

        Audio.obj.stream.kill();

        Audio.obj.playing = false;
        Audio.obj.track = '';

        db.dwrite( 'PLT-AUDIO', Audio.obj ); }

    req.app.locals.PlaylistManager( req.app, db, player );

    res.sendStatus(200);

    } );

router.post( '/add', function( req, res ) { // { track: STRING, begin: DATE, direction: NUMBER }

    if ( !auth.validate(req) ) {

        res.status(401).send('Unauthorized'); return; }

    var Audio = db.dread( 'PLT-AUDIO' );

    if ( !Audio.valid ) {

        res.status(500).send('Audio stream is inaccessible!'); return; }

    var Schedule = db.sread('PLT-SCHEDULE');

    if ( !Schedule.valid ) {

        res.status(500).send('Playlist schedule is inaccessible!'); return; }

    var Track = db.sread( 'LIB-TRACK-' + req.body.track );

    if ( !Track.valid ) {

        res.status(400).send('Track has not been found.'); return; }

    var Entry = {

        id: shortid.generate(),
        track: req.body.track,

        begin: req.body.begin,
        end: req.body.begin + 1000 * ( Track.obj.end -  Track.obj.begin )

        };

    if ( req.body.direction < 0 ) {

        Entry.end = req.body.begin;
        Entry.begin = req.body.begin - 1000 * ( Track.obj.end -  Track.obj.begin ); }

    if ( Schedule.obj.schedule.length > 0 ) {

        var l = 0;
        var r = Schedule.obj.schedule.length - 1;

        while ( l < r ) {

            var m = Math.floor( ( l + r ) / 2 );

            if ( Schedule.obj.schedule[m].begin < Entry.begin ) {

                l = m + 1; }

            else {

                r = m - 1; } }

        if ( l > 0 || ( l == 0 && Schedule.obj.schedule[l].begin < Entry.begin ) ) {

            if ( Schedule.obj.schedule[l].begin > Entry.begin ) {

                l--; }

            if ( Schedule.obj.schedule[r].begin < Entry.begin ) {

                r++; }

            if ( Schedule.obj.schedule[l].end > Entry.begin ) {

                res.status(409).send('The track is in conflict with other track.'); return; }

            if ( r < Schedule.obj.schedule.length ) {

                if ( Schedule.obj.schedule[r].begin < Entry.end ) {

                    res.status(409).send('The track is in conflict with other track.'); return; } } }

        else {

            if ( Schedule.obj.schedule[0].begin < Entry.end ) {

                res.status(409).send('The track is in conflict with other track.'); return; } } }

    Schedule.obj.timestamp = Date.now();

    //TESTING BINARY INSERTION

    var x = 0;
    var y = Schedule.obj.schedule.length-1;

    var k = 0;

    if(Schedule.obj.schedule.length > 0){
      if ( Schedule.obj.schedule[0].begin > Entry.begin ) {
          k = 0;
        } else if(Schedule.obj.schedule[y].begin < Entry.begin){
          k = y + 1;
        }
      else {
        k = Math.floor((x + y)/2);
         while (!(Schedule.obj.schedule[k].begin >= Entry.begin && Schedule.obj.schedule[k-1].begin < Entry.begin)) {
        if(Schedule.obj.schedule[k].begin < Entry.begin)
        x = k + 1;
        else
        y = k-1;
        k = Math.floor((x + y)/2);
      }
    }
    }


    Schedule.obj.schedule.splice(k, 0, Entry);

    db.swrite( 'PLT-SCHEDULE', Schedule.obj );

    if ( !Audio.obj.playing ) {

        req.app.locals.PlaylistManager( req.app, db, player ); }

    res.sendStatus(200);

    } );

router.post( '/swap', function( req, res ) { // { first: STRING, second: STRING }

    if ( !auth.validate(req) ) {

        res.status(401).send('Unauthorized'); return; }

    var Audio = db.dread( 'PLT-AUDIO' );

    if ( !Audio.valid ) {

        res.status(500).send('Audio stream is inaccessible!'); return; }

    var Schedule = db.sread('PLT-SCHEDULE');

    if ( !Schedule.valid ) {

        res.status(500).send('Playlist schedule is inaccessible!'); return; }

    var a = -1;
    var b = -1;

    for ( var i = 0; i < Schedule.obj.schedule.length; i++ ) {

        if ( Schedule.obj.schedule[i].id === req.body.first ) {

            a = i;

            break; } }

    if ( a < 0 ) {

        res.status(400).send('Playlist schedule entry has not been found.'); return; }

    if ( a < ( Schedule.obj.schedule.length - 1 ) ) {

        if ( Schedule.obj.schedule[a+1].id === req.body.second ) {

            b = a + 1; } }

    if ( a > 0 ) {

        if ( Schedule.obj.schedule[a-1].id === req.body.second ) {

            b = a;
            a = a - 1; } }

    if ( b < 0 ) {

        res.status(400).send('Playlist schedule entries are not located next to each other.'); return; }

    if ( Schedule.obj.schedule[a].end != Schedule.obj.schedule[b].begin && ( Schedule.obj.schedule[b].begin - Schedule.obj.schedule[a].end ) >= 1000 ) {

        res.status(400).send('Playlist schedule entries are not connected.'); return; }

    var f = {

        id: Schedule.obj.schedule[b].id,
        track: Schedule.obj.schedule[b].track,

        begin: Schedule.obj.schedule[a].begin,
        end: Schedule.obj.schedule[a].begin + ( Schedule.obj.schedule[b].end - Schedule.obj.schedule[b].begin )

        };

    var s = {

        id: Schedule.obj.schedule[a].id,
        track: Schedule.obj.schedule[a].track,

        begin: Schedule.obj.schedule[b].end - ( Schedule.obj.schedule[a].end - Schedule.obj.schedule[a].begin ),
        end: Schedule.obj.schedule[b].end

        };

    Schedule.obj.schedule[a] = f;
    Schedule.obj.schedule[b] = s;
    Schedule.obj.timestamp = Date.now();

    db.swrite( 'PLT-SCHEDULE', Schedule.obj );

    if ( !Audio.obj.playing ) {

        req.app.locals.PlaylistManager( req.app, db, player ); }

    res.sendStatus(200);

    } );

router.post( '/remove', function( req, res ) { // { id: STRING }

    if ( !auth.validate(req) ) {

        res.status(401).send('Unauthorized'); return; }

    var Audio = db.dread( 'PLT-AUDIO' );

    if ( !Audio.valid ) {

        res.status(500).send('Audio stream is inaccessible!'); return; }

    var Schedule = db.sread('PLT-SCHEDULE');

    if ( !Schedule.valid ) {

        res.status(500).send('Playlist schedule is inaccessible!'); return; }

    var Index = -1;

    for ( var i = 0; i < Schedule.obj.schedule.length; i++ ) {

        if ( Schedule.obj.schedule[i].id === req.body.id ) {

            Index = i;

            break; } }

    if ( Index < 0 ) {

        res.status(400).send('Playlist schedule entry has not been found.'); return; }

    Schedule.obj.timestamp = Date.now();
    Schedule.obj.schedule.splice( Index, 1 );

    db.swrite( 'PLT-SCHEDULE', Schedule.obj );

    if ( !Audio.obj.playing ) {

        req.app.locals.PlaylistManager( req.app, db, player ); }

    res.sendStatus(200);

    } );

router.get( '/clean', function( req, res ) {

    if ( !auth.validate(req) ) {

        res.status(401).send('Unauthorized'); return; }

    var Audio = db.dread( 'PLT-AUDIO' );

    if ( Audio.valid ) {

        if ( Audio.obj.playing ) {

            Audio.obj.stream.kill(); } }

    var Schedule = db.sread('PLT-SCHEDULE');

    if ( !Schedule.valid ) {

        res.status(500).send('Playlist schedule is inaccessible!'); return; }

    console.log('Cleaning playlist schedule');

    var Now = Date.now();

    for ( var i = 0; i < Schedule.obj.schedule.length; i++ ) {

        if ( Schedule.obj.schedule[i].end < Now ) {

            Schedule.obj.schedule.splice( i, 1 ); i--; } }

    db.dwrite( 'PLT-AUDIO', { stream: {}, playing: false, track: '' } );
    db.swrite( 'PLT-SCHEDULE', { schedule: Schedule.obj.schedule, timestamp: Date.now() } );

    req.app.locals.PlaylistManager( req.app, db, player );

    res.sendStatus(200);

    } );

module.exports = router;
