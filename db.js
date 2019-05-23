var fs = require('fs');
var db = {};

db.dmem = []; // [ id : STRING, obj: OBJECT ]
db.smem = []; // [ id : STRING, obj: OBJECT ]

db.init = function ( ) {

    console.log('Initiating database');

    try {

        db.smem = JSON.parse( fs.readFileSync( './db.json', 'utf8' ) ); }

    catch ( err ) {

        console.log( 'While initiating database an error occurred: ' + err );

        db.reset();
        db.init(); }

    };

db.reset = function ( ) {

    console.log('Resetting database');

    db.dmem = [];
    db.smem = [

        { id: 'ATH-PASSWORD', obj: { password: '', timestamp: Date.now() } },
        { id: 'LIB-CATALOG', obj: { catalog: [], tracks: [], timestamp: Date.now() } },
        { id: 'STE-SETTINGS', obj: { settings: {

            playlist_designer: false,
            amplifier_toggle: 'auto',
            playlist_designer_launch_time: 10800,
            playlist_designer_time_intervals: [],
            reserved_time_intervals: [],
            synchronization_delay: 2000

            }, timestamp: Date.now() } }

        ];

    fs.writeFileSync( './db.json', JSON.stringify( db.smem ), 'utf8' );

    };

db.swap = function ( mem, i, j ) {

    var tmp = mem[i];

    mem[i] = mem[j];
    mem[j] = tmp;

    };

db.read = function ( mem, id, json_friendly ) {

    if ( id === undefined || id === '' ) {

        return { id: id, obj: {}, valid: false }; }

    var data = { id: id, obj: {}, valid: false };

    var Left = 0;
    var Right = mem.length-1;
    var m = Math.floor((Left+Right)/2)

    while(Left < Right){
      if(mem[m].id > id){
        Right = m-1;
      } else if(mem[m].id < id){
        Left = m+1;
      } else {
        break;
      }
      m = Math.floor((Left+Right)/2);
    }

    if(mem[m] !== undefined && mem[m].id === id){
      if ( typeof( json_friendly ) != 'boolean' ) {

          data.obj = JSON.parse( JSON.stringify( mem[m].obj ) ); }

      else if ( json_friendly ) {

          data.obj = JSON.parse( JSON.stringify( mem[m].obj ) ); }

      else {

          data.obj = mem[m].obj; }

      data.valid = true;

    }

    return data;

    };

db.write = function ( mem, id, obj, json_friendly ) {

    if ( id === undefined || id === '' ) {

        return; }

        var Left = 0;
        var Right = mem.length-1;
        var m = Math.floor((Left+Right)/2)

        while(Left < Right){
          if(mem[m].id > id){
            Right = m-1;
          } else if(mem[m].id < id){
            Left = m+1;
          } else {
            break;
          }
          m = Math.floor((Left+Right)/2);
        }

        if(mem[m] !== undefined && mem[m].id == id){
          if ( typeof( json_friendly ) != 'boolean' ) {

              mem[m].obj = JSON.parse( JSON.stringify( obj ) ); }

          else if ( json_friendly ) {

              mem[m].obj = JSON.parse( JSON.stringify( obj ) ); }

          else {

              mem[m].obj = obj; }


        } else {
        mem.splice( m, 0, { id: id, obj: obj });
      }

    };

db.remove = function ( mem, id ) {

    if ( id === undefined || id === '' ) {

        return; }

        var Left = 0;
        var Right = mem.length-1;
        var m = Math.floor((Left+Right)/2)

        while(Left < Right){
          if(mem[m].id > id){
            Right = m-1;
          } else if(mem[m].id < id){
            Left = m+1;
          } else {
            break;
          }
          m = Math.floor((Left+Right)/2);
        }

        if(mem[m] !== undefined && mem[m].id == id){
            mem.splice( m, 1 );
        }

    };

db.dread = function ( id ) {

    return db.read( db.dmem, id, false );

    };

db.dwrite = function ( id, obj ) {

    db.write( db.dmem, id, obj, false );

    };

db.dremove = function ( id ) {

    db.remove( db.dmem, id );

    };

db.sread = function ( id ) {

    return db.read( db.smem, id );

    };

db.swrite = function ( id, obj, callback ) {
    db.write( db.smem, id, obj );

    fs.writeFile( './db.json', JSON.stringify( db.smem ), 'utf8', function ( err ) {

        if ( err ) {

            console.log( 'While writing to database an error occurred: ' + err ); }

        if ( callback !== undefined ) {

            callback(); }

        } );

    };

db.sremove = function ( id, callback ) {

    db.remove( db.smem, id );

    fs.writeFile( './db.json', JSON.stringify( db.smem ), 'utf8', function ( err ) {

        if ( err ) {

            console.log( 'While removing from database an error occurred: ' + err ); }

        if ( callback !== undefined ) {

            callback(); }

        } );

    };

module.exports = db;
