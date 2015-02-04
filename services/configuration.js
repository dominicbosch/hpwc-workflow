'use strict';

var express = require( 'express' ),
	fs = require( 'fs' ),
	path = require( 'path' ),
	ssh = require( '../modules/ssh' ),
	router = express.Router();

/*
 * TODO 
 * Create Connections: Create SSH key/value pair, copy public key to remote machine
 * select connection which will be shown in almost all views
 * allow connect/disconnect connections
 * dropdown allows selection of the connection without connecting -> in the page button to connect/disconnect
 * 
 *
 *
 *
 *
 *
 *
 */


router.post( '/create', function( req, res ) {
	var args, user = req.session.pub,
		oBody = req.body;

	if( !oBody.name || !oBody.url || !oBody.port || !oBody.workspace || !oBody.workhome
			|| !oBody.username || !oBody.hostpassword  || !oBody.keypassword ) {
		res.status( 400 );
		res.send( 'Missing Parameters!' );
	} else {
		ssh.createConfiguration( req.session.pub.username, oBody, function( err ) {
			if( err ) {
				console.error( err );
				res.status( 400 );
				res.send( 'Connection initialization failed!' );
			} else {
				res.send( 'Connection initialization successful!' );
			}
		});
	}
});


router.get( '/connect/:name', function( req, res ) {
	var oUser = req.session.pub;
	ssh.connectToHost( oUser.username, oUser.configurations[ req.params.name ], function( err ) {
		if( err ) {
			console.log( err );
			res.status( 400 );
			res.send("Connection failed!");
		} else {
			res.send("Connection Created!");
		}
	});
});

router.get( '/disconnect/:name', function( req, res ) {
	if ( ssh.closeConnection( req.session.pub.username, req.params.name ) ) {
		res.send("Connection Closed!");
	} else {
		res.status( 404 );
		res.send("Connection not found!");
	}
});

router.get( '/connect', function( req, res ) {
	var user = req.session.pub;

	var conf_file = req.query.conf;
	var	conf_file_path = path.join("users", user.name, "conf");

	if (conf_file) { //read specific file
		var connObj = JSON.parse(fs.readFileSync(path.join(conf_file_path, conf_file)));
		console.log("reading conf file");
		if (connObj) {
			ssh.connectToHost( connObj, user.name, function(err, data) {
				console.log( 'ANSWER FROM CONNECTION: ' + data );

				//save if connection ok
				req.session.pub.connections[ connObj.name ] = connObj;

				res.send(connObj);
			});
		}
	} else { //read all configurations
		var arr = fs.readdirSync(conf_file_path);
		res.send(arr.filter( function(d){ return d.substring(d.length-5)==='.json'}));
	}
});

router.get( '/get', function( req, res ) {
	res.send( req.session.pub.configurations );
});

module.exports = router;
