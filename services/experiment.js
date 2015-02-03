var express = require('express'),
	ssh = require('../modules/ssh'),
	path = require('path'),
	fs = require('fs'),
	router = express.Router();

// GET experiments list. 
router.get('/get', function(req, res) {

	var command = 'workflow exp -l -p ' + req.session.public.connection.project.name;
		
	ssh.execWorkComm( req.session.public, command, function(data) {
		console.log( 'ANSWER FROM SSH: ' + data );
		var list = "";
		var pos = data.indexOf(':');
		if (pos != -1) {
			var list = data.substring(pos + 1).trim().split(" ");
		} 
		console.log("LIST: " + list);
		res.send(list);
	});
});

// GET descriptor. 
router.get('/getDescriptor', function(req, res) {
	
	var user = req.session.public.user;
	var connection = req.session.public.connection;

	var project = req.session.public.connection.project;
	var output = req.query.output;
	var descriptor = "";

	if (output == "") {
		res.send(descriptor);
	} else {
		var exp_folder = "experiments"
		var desc_name = '.experiment';
		var filename  = path.join(connection.workspace, project.name, exp_folder, output, desc_name);

		ssh.getRemoteFile( user.name, filename, function(data) {

			console.log( 'ANSWER FROM SSH: ' + data );
			descriptor = JSON.parse(data);

			res.send(descriptor);
		});
	}
});

// Manage method. 
router.post('/manage', function(req, res) {
	
	var opt = '';
	var method = req.body;
	var project = req.session.public.connection.project;

	if (method.action === "delete") {
		opt="d";
		command = "workflow project_module -" + opt + " -p \"" + project.name + 
			"\" -n \"" + method.name + "\"";
	} else {
		if (method.action === "create") {
			opt="c";
		} else if (method.action === "edit") {
			opt="m";
		}

		command = "workflow project_module -" + opt + " -p \"" + project.name + 
			"\" -m " + method.type + " -n \"" + method.name + "\" --comment \"" + 
			method.comment + "\"";
	}

	ssh.execWorkComm( req.session.public, command, function( data ) {
		console.log( 'ANSWER FROM SSH: ' + data );
		res.send( data );
	});
});

module.exports = router;