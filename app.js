console.log('Launching process');
console.log( Date() );

var compression = require('compression')
var express = require('express');
var minify = require('express-minify');
var path = require('path');
var http = require('http');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var shortid = require('shortid');
var player = require('play-sound')(opts={});
var multipart = require('connect-multiparty');
var busboyBodyParser = require('busboy-body-parser');

var LoginRoute = require('./routes/login.js');
var LogoutRoute = require('./routes/logout.js');
var LibraryRoute = require('./routes/library.js');
var PlaylistRoute = require('./routes/playlist.js');
var StateRoute = require('./routes/state.js');

var app = express();
var config = require('./config.js');
var db = require('./db.js'); db.init();

app.use(compression());

//Function for shuffeling arrays
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

var SerialPort = require('serialport');

var port = new SerialPort('/dev/ttyUSB0', { autoOpen: false });

var ErrorHandled = true;

port.open(function (err) {
  if (err) {
    if(!ErrorHandled){
      ErrorHandled = true;
      return console.log('Error opening port: ', err.message);
    }
    return;
  }


});

portState='+';

portObj = {
  main: '+',
  section:{
    1: '',
    2: '',
    3: '',
    4: '',
    5: '',
    6: '',
    7: '',
    8: ''
  }
}

// The open event is always emitted
port.on('open', function() {
	if(ErrorHandled){
		port.write('s');
  		ErrorHandled = false;
	}


});

port.on('data', function(data) {

var newValue = data.toString()[0];
	if((newValue === '-' || newValue === '+') && newValue !== portState){
		portState = data.toString()[0];
}
});


portCheck = setInterval((function(){
  if(!port.isOpen){
    port.open(function (err) {
      if (err) {
        if(!ErrorHandled){
          ErrorHandled = true;
          return console.log('Error opening port: ', err.message);
        }
        return;
      }
    });
  }
}),1000);



app.locals.GetAudioAccessPermission = function ( db ) {

    var Settings = db.sread('STE-SETTINGS');

    if ( !Settings.valid ) {

        return 0; }

    var Now = new Date();
    var Today = Now.getDay();
    var Time = Now.getHours() * 3600 + Now.getMinutes() * 60 + Now.getSeconds();

    for ( var i = 0; i < Settings.obj.settings.reserved_time_intervals.length; i++ ) {

        if ( Settings.obj.settings.reserved_time_intervals[i].days[Today] == false ) {

            continue; }

        if ( Settings.obj.settings.reserved_time_intervals[i].begin <= Time && Settings.obj.settings.reserved_time_intervals[i].end >= Time ) {

            return ( Settings.obj.settings.reserved_time_intervals[i].end - Time ); } }

    return 0;

    };

app.locals.AudioAccessWatchman = function ( app, db ) {

    clearTimeout( app.locals.AudioAccessWatchmanTimeout );
    app.locals.AudioAccessWatchmanTimeout = setTimeout( function ( ) { app.locals.AudioAccessWatchman( app, db ); }, 1000 );

    var Audio = db.dread( 'PLT-AUDIO' );

    if ( !Audio.valid ) {

        return; }

    if ( Audio.obj.playing ) {
        if ( app.locals.GetAudioAccessPermission( db ) ) {

            Audio.obj.stream.kill();
            Audio.obj.playing = false;
            Audio.obj.track = '';

            db.dwrite( 'PLT-AUDIO', Audio.obj );

            clearTimeout( app.locals.PlaylistManagerTimeout );
            app.locals.PlaylistManagerTimeout = setTimeout( function ( ) { app.locals.PlaylistManager( app, db, player ); }, app.locals.GetAudioAccessPermission( db ) * 1000 ); } }

    };

    app.locals.AmplifierStateWatchman = function ( app, db ){

        clearTimeout( app.locals.AmplifierStateWatchmanTimeout );
        app.locals.AmplifierStateWatchmanTimeout = setTimeout( function ( ) { app.locals.AmplifierStateWatchman( app, db ); }, 1000 );

        var Settings = db.sread('STE-SETTINGS');

        if ( !Settings.valid ) {

            return 0; }
        if(Settings.obj.settings.amplifier_toggle === 'off'){
          port.write('-');

        } else if(Settings.obj.settings.amplifier_toggle === 'on'){
          port.write('+');
        } else if(Settings.obj.settings.amplifier_toggle === 'auto' ){

          var Now = new Date();
          var Today = Now.getDay();
          var Time = Now.getHours() * 3600 + Now.getMinutes() * 60 + Now.getSeconds();

          for ( var i = 0; i < Settings.obj.settings.reserved_time_intervals.length; i++ ) {

              if ( Settings.obj.settings.reserved_time_intervals[i].days[Today] == false ) {

                  continue; }

              if ( Settings.obj.settings.reserved_time_intervals[i].begin <= Time && Settings.obj.settings.reserved_time_intervals[i].end >= Time) {

                port.write('-');



                return;
                } }

            port.write('+');
            return;


        }};

app.locals.PlaylistManager = function ( app, db, player ) {

    clearTimeout( app.locals.PlaylistManagerTimeout );

    var Audio = db.dread( 'PLT-AUDIO' );

    if ( !Audio.valid ) {

        db.dwrite( 'PLT-AUDIO', { stream: {}, playing: false, track: '' } );

        Audio.obj = { stream: {}, playing: false, track: '' }; }

    var Schedule = db.sread('PLT-SCHEDULE');

    if ( !Schedule.valid ) {

        console.log('Resetting playlist schedule');

        Schedule.valid = true;
        Schedule.obj = { schedule: [], timestamp: Date.now() };

        db.swrite( 'PLT-SCHEDULE', Schedule.obj ); }

    if ( Schedule.obj.schedule.length > 0 ) {
        var Now = Date.now();
        var Next = -1;
        var Current = -1;

        var l = 0;
        var r = Schedule.obj.schedule.length - 1;


        while ( l < r ) {

            var m = Math.floor( ( l + r ) / 2 );

            if ( Schedule.obj.schedule[m].begin < Now ) {

                l = m + 1; }

            else {

                r = m - 1; } }

        if ( l > 0 || ( l == 0 && Schedule.obj.schedule[l].begin < Now ) ) {

            if ( Schedule.obj.schedule[l].begin > Now ) {

                l--; }

            if ( Schedule.obj.schedule[r].begin < Now ) {

                r++; }

            Next = r;

            if ( Schedule.obj.schedule[l].end >= Now ) {

                Next = l + 1;
                Current = l; }

            else if ( r < Schedule.obj.schedule.length ) {

                if ( Schedule.obj.schedule[r].begin <= Now ) {

                    Next = r + 1;
                    Current = r; } }
                  }

        else {
            Next = 0;

            if ( Schedule.obj.schedule[0].begin <= Now ) {
                Next = 1;
                Current = 0; } }

                if(Schedule.obj.schedule.length == Next  ||   Schedule.obj.schedule[Next].end <= Now || Schedule.obj.schedule[Next].end-Now >= 2400000){
                  /*portState = '-';
                  port.write('-');*/
              }

        if ( Current >= 0 ) {

            var Track = db.sread( 'LIB-TRACK-' + Schedule.obj.schedule[Current].track );

            if ( Track.valid && Track.obj.state == 'READY' ) {

                Audio.obj.stream = player.play( 'tracks/' + Track.obj.path, { mplayer: [ '-ss', ( Track.obj.begin + Math.floor( ( Now - Schedule.obj.schedule[Current].begin ) / 1000 ) ), '−volume', Track.obj.volume, '-really-quiet' ] }, function( err ) {


                    if ( err && err !== 1  && !err.killed ) {

                        var Audio = db.dread( 'PLT-AUDIO' );

                        if ( !Audio.valid ) {

                            Audio.obj.playing = false;
                            Audio.obj.track = '';

                            db.dwrite( 'PLT-AUDIO', Audio.obj ); }

                        console.log( 'While playing track an error occurred: ' + err ); }


                    } );
                Audio.obj.playing = true;
                Audio.obj.track = Track.obj.id;
                Track.obj.views = Track.obj.views + 1;

                db.dwrite( 'PLT-AUDIO', Audio.obj );
                db.swrite( 'LIB-TRACK-' + Track.obj.id, Track.obj );

                app.locals.PlaylistManagerTimeout = setTimeout( function ( ) {

                    var Audio = db.dread( 'PLT-AUDIO' );

                    if ( Audio.valid ) {

                        Audio.obj.stream.kill();
                        Audio.obj.playing = false;
                        Audio.obj.track = '';

                        db.dwrite( 'PLT-AUDIO', Audio.obj ); }

                    app.locals.PlaylistManager( app, db, player );

                    }, Schedule.obj.schedule[Current].end - Now );

                app.locals.AudioAccessWatchman( app, db );

                }

            else {

                app.locals.PlaylistManagerTimeout = setTimeout( function ( ) { app.locals.PlaylistManager( app, db, player ); }, Schedule.obj.schedule[Next].begin - Now ); } }

        else if ( Next >= 0 && Next < Schedule.obj.schedule.length ) {

            app.locals.PlaylistManagerTimeout = setTimeout( function ( ) { app.locals.PlaylistManager( app, db, player ); }, Schedule.obj.schedule[Next].begin - Now ); }
        }

    };

app.locals.PlaylistDesigner = function ( app, db, player ) {

    clearTimeout( app.locals.PlaylistDesignerTimeout );

    var Settings = db.sread('STE-SETTINGS');
    var Catalog = db.sread('LIB-CATALOG');
    var Schedule = db.sread('PLT-SCHEDULE');
    var Audio = db.dread('PLT-AUDIO');

    if ( !Settings.valid ) {

        app.locals.PlaylistDesignerTimeout = setTimeout( function ( ) { app.locals.PlaylistDesigner( app, db, player ); }, 1000 );

        return; }

    if ( !Catalog.valid ) {

        return; }

    if ( !Schedule.valid ) {

        return; }

    if ( !Audio.valid ) {

        return; }

    var Now = new Date();
    var Today = Now.getDay();

    var TimeoutDelay = 1000 * ( Settings.obj.settings.playlist_designer_launch_time - Now.getHours() * 3600 + Now.getMinutes() * 60 + Now.getSeconds() );

    if ( TimeoutDelay < 0 ) {

        TimeoutDelay = TimeoutDelay + 86400000; }

    app.locals.PlaylistDesignerTimeout = setTimeout( function ( ) { app.locals.PlaylistDesigner( app, db, player ); }, TimeoutDelay );

    var Tracks = [];

    for ( var i = 0; i < Catalog.obj.tracks.length; i++ ) {

        var Track = db.sread( 'LIB-TRACK-' + Catalog.obj.tracks[i] );

        if ( Track.valid && Track.obj.state == 'READY' ) {

            Tracks.push( Track.obj ); } }

    if ( Tracks.length > 0 ) {

        for ( var i = 0; i < Tracks.length; i++ ) {

            Tracks[i].points = Tracks[i].views / ( Tracks[i].rate + 1 ); }

        var ScheduleSector = [];

        if ( Schedule.obj.schedule.length > 0 ) {

            var Midnight = new Date();
            Midnight.setHours( 0, 0, 0 );

            var Left = 1;
            var LeftContr = Schedule.obj.schedule.length-1;

            var Right = 0;
            var RightContr = Schedule.obj.schedule.length-2;

            var m;
            if ( Schedule.obj.schedule[0].end > Midnight.getTime() ) {

              Left = 0; }
              else if(Left < LeftContr){
                m = Math.floor((Left+LeftContr)/2);
                while (!(Schedule.obj.schedule[m].end >= Midnight.getTime() && Schedule.obj.schedule[m-1].end < Midnight.getTime()) && Left <= LeftContr) {
                  if(Schedule.obj.schedule[m].end < Midnight.getTime())
                  Left = m+1;
                  else
                  LeftContr = m-1;
                  m = Math.floor((Left+LeftContr)/2);
                  if(LeftContr === -1)break;

                }
                Left = m;
              }

            if ( Schedule.obj.schedule[Schedule.obj.schedule.length - 1].begin < ( Midnight.getTime() + 86400000 ) ) {
              Right = Schedule.obj.schedule.length - 1; }
              else if(Right < RightContr){
                m = Math.floor((Right+RightContr)/2);
                while (!(Schedule.obj.schedule[m+1].begin >= ( Midnight.getTime() + 86400000 ) && Schedule.obj.schedule[m].begin < ( Midnight.getTime() + 86400000 ) ) && Right <= RightContr) {
                  if(Schedule.obj.schedule[m].begin < ( Midnight.getTime() + 86400000 ))
                  Right = m+1;
                  else
                  RightContr = m-1;

                  m = Math.floor((Right+RightContr)/2);
                  if(RightContr === -1)break;
                }
                Right = m;
              }

            if(Left > Right || Right < 0 || Left < 0 || !(Schedule.obj.schedule[Left].end > Midnight.getTime() &&  Schedule.obj.schedule[Right].begin < ( Midnight.getTime() + 86400000 )) ){
              Left = 0;
              Right = -1;
            }
            for ( var i = Left; i <= Right; i++ ) {

                var Entry = {

                    begin: ( Schedule.obj.schedule[i].begin - Midnight.getTime() ) / 1000,
                    end: ( Schedule.obj.schedule[i].end - Midnight.getTime() ) / 1000

                    };

                ScheduleSector.push( Entry ); } }

        var Intervals = [];

        for ( var i = 0; i < Settings.obj.settings.playlist_designer_time_intervals.length; i++ ) {

            if ( Settings.obj.settings.playlist_designer_time_intervals[i].days[Today] == false ) {

                continue; }

            var Fragmentary = false;

            for ( var j = 0; j < ScheduleSector.length; j++ ) {

                if ( ScheduleSector[j].begin < Settings.obj.settings.playlist_designer_time_intervals[i].end &&
                     ScheduleSector[j].end > Settings.obj.settings.playlist_designer_time_intervals[i].begin ) {

                    Fragmentary = true;

                    if ( ScheduleSector[j].begin > Settings.obj.settings.playlist_designer_time_intervals[i].begin &&
                         ScheduleSector[j].end < Settings.obj.settings.playlist_designer_time_intervals[i].end ) {

                        var First = {

                            days: Settings.obj.settings.playlist_designer_time_intervals[i].days,
                            begin: Settings.obj.settings.playlist_designer_time_intervals[i].begin,
                            end: ScheduleSector[j].begin

                            };

                        var Second = {

                            days: Settings.obj.settings.playlist_designer_time_intervals[i].days,
                            begin: ScheduleSector[j].end,
                            end: Settings.obj.settings.playlist_designer_time_intervals[i].end

                            };

                        Settings.obj.settings.playlist_designer_time_intervals.push( First );
                        Settings.obj.settings.playlist_designer_time_intervals.push( Second ); }

                    else if ( ScheduleSector[j].begin <= Settings.obj.settings.playlist_designer_time_intervals[i].begin ) {

                        var Interval = {

                            days: Settings.obj.settings.playlist_designer_time_intervals[i].days,
                            begin: ScheduleSector[j].end,
                            end: Settings.obj.settings.playlist_designer_time_intervals[i].end

                            };

                        Settings.obj.settings.playlist_designer_time_intervals.push( Interval ); }

                    else if ( ScheduleSector[j].end >= Settings.obj.settings.playlist_designer_time_intervals[i].end ) {

                        var Interval = {

                            days: Settings.obj.settings.playlist_designer_time_intervals[i].days,
                            begin: Settings.obj.settings.playlist_designer_time_intervals[i].begin,
                            end: ScheduleSector[j].begin

                            };

                        Settings.obj.settings.playlist_designer_time_intervals.push( Interval ); }

                    break; } }

            if ( Fragmentary ) {

                continue; }

            if ( ( Settings.obj.settings.playlist_designer_time_intervals[i].end - Settings.obj.settings.playlist_designer_time_intervals[i].begin ) < 10 ) {

                continue; }

            Intervals.push( { begin: Settings.obj.settings.playlist_designer_time_intervals[i].begin, end: Settings.obj.settings.playlist_designer_time_intervals[i].end } ); }

        if ( Intervals.length == 0 ) {

            return; }

        Intervals.sort( function ( a, b ) {

            if ( a.begin < b.begin ) {

                return -1; }

            if ( a.begin > b.begin ) {

                return 1; }

            return 0; } );

        for ( var i = 1; i < Intervals.length; i++ ) {

            if ( Intervals[i].begin < Intervals[ i - 1 ].end ) {

                Intervals[i].begin = Intervals[ i - 1 ].begin;

                if ( Intervals[i].end < Intervals[ i - 1 ].end ) {

                    Intervals[i].end = Intervals[ i - 1 ].end; }

                Intervals.splice( i - 1, 1 );

                i--; } }

                var LatestTracks = [];
        if(Schedule.obj.schedule.length){
        var Left = 0;
        var Right = Schedule.obj.schedule.length - 1;
        var m = Math.floor((Left + Right)/2);

        while(Left < Right && m > 0){
          if(Schedule.obj.schedule[m].end > Intervals[0].begin && Schedule.obj.schedule[m-1].end > Intervals[0].begin){
            Right = m - 1;
          } else if(Schedule.obj.schedule[m].end < Intervals[0].begin ){
            Left = m + 1;
          }

          m = Math.floor((Left + Right)/2);
        }

        var MinM = m-10 > 0 ? m - 10: 0;
        for(var i = m-1;i>=MinM;i--){
          LatestTracks.unshift( Schedule.obj.schedule[i].track);
        }
        /*
        console.log(LatestTracks.length,LatestTracks, Schedule.obj.schedule[m].end);
        if(m > 0)
          console.log( Schedule.obj.schedule[m-1].end,'b' );*/
}
/*
        for ( var i = Schedule.obj.schedule.length - 1; i >= 0 && TestTracks.length < 10; i-- ) { // TODO: CHANGE LINEAR SEARCH TO BINARY SEARCH

            if ( Schedule.obj.schedule[i].end > Intervals[0].begin ) {

                continue; }

            TestTracks.unshift( Schedule.obj.schedule[i].track );

          }
*/

            Tracks = shuffle(Tracks);

        while ( Intervals.length > 0 ) {

            var Next = -1;
            var Points = Number.MAX_VALUE;

            for ( var i = 0; i < Tracks.length; i++ ) {

                if ( Points < Tracks[i].points ) {

                    continue; }

                if ( Tracks.length > 2 ) {

                    var Match = false;

                    for ( var j = 0; j < LatestTracks.length && j < 2; j++ ) {

                        if ( Tracks[i].id == LatestTracks[j] ) {

                            Match = true;

                            break; } }

                        if ( Match ) {

                            continue; } }

                if ( Tracks.length > 10 ) {

                    var Match = false;

                    for ( var j = 0; j < LatestTracks.length; j++ ) {

                        if ( Tracks[i].id == LatestTracks[j] ) {

                            Match = true;

                            break; } }

                    if ( Match ) {

                        continue; } }

                Next = i;
                Points = Tracks[i].points; }

            Tracks[Next].points = Tracks[Next].points + ( 1 / ( Tracks[Next].rate + 1 ) );

            LatestTracks.unshift( Tracks[Next].id );

            if ( LatestTracks.length > 10 ) {

                LatestTracks.pop(); }

            var Begin = Intervals[0].begin;
            var End = Intervals[0].begin;

            if ( ( Intervals[0].begin + ( Tracks[Next].end - Tracks[Next].begin ) ) <= Intervals[0].end ) {

                End = Intervals[0].begin + ( Tracks[Next].end - Tracks[Next].begin ); }

            else {

                End = Intervals[0].end; }

            Intervals[0].begin = End;

            if ( ( Intervals[0].end - Intervals[0].begin ) < 10 ) {

                Intervals.shift(); }

            var Midnight = new Date();
            Midnight.setHours( 0, 0, 0 );

            Begin = Midnight.getTime() + Begin * 1000;
            End = Midnight.getTime() + End * 1000;
/*
            var Kurwix = 0;

            while ( Kurwix < Schedule.obj.schedule.length ) { // TODO: CHANGE LINEAR SEARCH TO BINARY SEARCH
              //Index is index of last element of the schedule that begin before the End

                if ( End > Schedule.obj.schedule[Kurwix].begin ) {

                    Kurwix++; }

                else {

                    break; }}*/

                    var Index = 0;


            Left = 0;
            Right = Schedule.obj.schedule.length;

            var Index = Math.floor((Left + Right)/2);
            while(Left < Right){
              if(End > Schedule.obj.schedule[Index].begin){
               Left = Index + 1;
             } else if(Index && End < Schedule.obj.schedule[Index].begin && End < Schedule.obj.schedule[Index-1].begin){
               Right = Index - 1;
             } else {
               break;
             }
             Index = Math.floor((Left + Right)/2);
            }

            var Entry = {

                id: shortid.generate(),
                track: Tracks[Next].id,

                begin: Begin,
                end: End

                };

            Schedule.obj.schedule.splice( Index, 0, Entry ); }

        Schedule.obj.timestamp = Date.now();

        db.swrite( 'PLT-SCHEDULE', Schedule.obj );

        if ( !Audio.obj.playing ) {

            app.locals.PlaylistManager( app, db, player ); } }


    };

    app.locals.TagsNewRemover = function ( app, db ) {
      var NowRemover = new Date();

      var Catalog = db.sread('LIB-CATALOG');

      if ( !Catalog.valid ) {

          return; }
      for(var k = Catalog.obj.catalog.length-1;k>=0;k--){

        var TimeoutTrack = db.sread( 'LIB-TRACK-' + Catalog.obj.catalog[k].id );
        if(!Catalog.obj.catalog[k].hasOwnProperty('tags')){
          Catalog.obj.catalog[k].tags = [];

          TimeoutTrack.obj.tags = [];

          db.swrite( 'LIB-TRACK-' + Catalog.obj.catalog[k].id, TimeoutTrack.obj, function ( ) {

              db.swrite( 'LIB-CATALOG', Catalog.obj );

              } );
        }

        if((Catalog.obj.catalog[k].timestamp + 86400000) > NowRemover.getTime()){
          var TrackId = Catalog.obj.catalog[k].id;
          var Timestamp = Catalog.obj.catalog[k].timestamp;

          setTimeout((function(k,TrackId,Timestamp){
            var Catalog = db.sread('LIB-CATALOG');
            if(Catalog.obj.catalog.length > 0){

            var index;

            if(k < Catalog.obj.catalog.length && Catalog.obj.catalog[k].id === TrackId){
              index = Catalog.obj.catalog[k].tags.findIndex(x => x.text=="new");
              if(index > -1)
                Catalog.obj.catalog[k].tags.splice(index, 1);

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
          }),(86400000 - (NowRemover.getTime() - Catalog.obj.catalog[k].timestamp)),k,TrackId,Timestamp);
        } else if(Catalog.obj.catalog[k].timestamp < NowRemover.getTime() && Catalog.obj.catalog[k].tags.findIndex(x => x.text=="new") > -1){
          index = Catalog.obj.catalog[k].tags.findIndex(x => x.text=="new");
          if(index > -1)
            Catalog.obj.catalog[k].tags.splice(index, 1);

          var TimeoutTrack = db.sread( 'LIB-TRACK-' + Catalog.obj.catalog[k].id );

          index = TimeoutTrack.obj.tags.findIndex(x => x.text=="new");
          if(index > -1)
            TimeoutTrack.obj.tags.splice(index, 1);

            db.swrite( 'LIB-TRACK-' + Catalog.obj.catalog[k].id, TimeoutTrack.obj, function ( ) {

                db.swrite( 'LIB-CATALOG', Catalog.obj );

                } );
        } else {
          //break;
        }
      }


};
/**/
app.locals.AudioAccessWatchmanTimeout = setTimeout( function ( ) { app.locals.AudioAccessWatchman( app, db ); }, 0 );
app.locals.TagsNewRemoverTimeout = setTimeout( function ( ) { app.locals.TagsNewRemover( app, db ); }, 0 );
app.locals.AmplifierStateWatchmanTimeout = setTimeout( function ( ) { app.locals.AmplifierStateWatchman( app, db ); }, 0 );
app.locals.PlaylistManagerTimeout = setTimeout( function ( ) { app.locals.PlaylistManager( app, db, player ); }, 0 );
app.locals.PlaylistDesignerTimeout = setTimeout( function ( ) { app.locals.PlaylistDesigner( app, db, player ); }, 0 );

app.use( busboyBodyParser());
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( cookieParser() );

app.use( express.static( path.join( __dirname, 'public' ) ) );

app.use( '/login', LoginRoute );
app.use( '/logout', LogoutRoute );
app.use( '/state', StateRoute );
app.use( '/library', LibraryRoute );
app.use( '/playlist', PlaylistRoute );

app.use( function( req, res, next ) {

    var err = new Error('Not Found');
    err.status = 404;

    next(err);

    } );

app.use( function( err, req, res, next ) {

    res.status( err.status || 500 );

    switch ( err.status ) {

        case 404 : res.sendFile( path.join( __dirname, 'public', '404.html' ) ); break;
        case 500 : res.sendFile( path.join( __dirname, 'public', '500.html' ) ); break;

        default : res.sendFile( path.join( __dirname, 'public', '500.html' ) ); }

    } );

var server = http.createServer(app);

server.listen( config.port );
server.on( 'error', onError );
server.on( 'listening', onListening );

function onError ( error ) {

    if ( error.syscall !== 'listen' ) {

        throw error; }

    var bind = typeof config.port === 'string' ? 'Pipe ' + config.port : 'Port ' + config.port;

    switch ( error.code ) {

        case 'EACCES':

            console.log( bind + ' requires elevated privileges!' );
            process.exit(1);

            break;

        case 'EADDRINUSE':

            console.log( bind + ' is already in use!' );
            process.exit(1);

            break;

        default: throw error; } }

function onListening ( ) {

    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;

    console.log( 'Listening on ' + bind ); }

module.exports = app;
