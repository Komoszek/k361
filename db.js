var fs = require('fs');
var db = {};

db.dmem = []; // [ id : STRING, obj: OBJECT ]
db.smem = []; // [ id : STRING, obj: OBJECT ]

db.init = function ( ) {

    db.smem = JSON.parse( fs.readFileSync( './db.json', 'utf8' ) );

    };

db.reset = function ( ) {

    db.dmem = [];
    db.smem = [];

    fs.writeFileSync( './db.json', JSON.stringify( db.smem ), 'utf8' );

    };

db.swap = function ( mem, i, j ) {

    var tmp = mem[i];

    mem[i] = mem[j];
    mem[j] = tmp;

    };

db.read = function ( mem, id ) {

    if ( id === undefined || id === '' ) {

        return { id: id, obj: {}, valid: false }; }

    var obj = { id: id, obj: {}, valid: false };

    for ( var i = 0; i < mem.length; i++ ) {

        if ( mem[i].id === id ) {

            obj.obj = mem[i].obj;
            obj.valid = true;

            if ( i > 0 ) {

                db.swap( mem, i, i - 1 ); }

            break; } }

    return obj;

    };

db.write = function ( mem, id, obj ) {

    if ( id === undefined || id === '' ) {

        return; }

    for ( var i = 0; i < mem.length; i++ ) {

        if ( mem[i].id === id ) {

            mem[i].obj = obj;

            if ( i > 0 ) {

                db.swap( mem, i, i - 1 ); }

            return; } }

    mem.push( { id: id, obj: obj } );

    };

db.dread = function ( id ) {

    return db.read( db.dmem, id );

    };

db.dwrite = function ( id, obj ) {

    db.write( db.dmem, id, obj );

    };

db.sread = function ( id ) {

    return db.read( db.smem, id );

    };

db.swrite = function ( id, obj, callback ) {

    db.write( db.smem, id, obj );

    fs.writeFile( './db.json', JSON.stringify( db.smem ), 'utf8', function ( err ) {

        if ( err ) {

            throw err; }

        if ( callback !== undefined ) {

            callback(); }

        } );

    };

module.exports = db;