var express = require('express');
var router = express.Router();

var db = require('../db.js');
var auth = require('../auth.js');

router.get( '/', function( req, res ) {

    if ( !auth.validate(req) ) {

        res.status(401).send('Unauthorized'); }

    // delete library
    db.reset();
    db.swrite( 'ATH-PASSWORD', { data: '', time: Date.now() } );

    res.send('Done');

    } );

module.exports = router;
