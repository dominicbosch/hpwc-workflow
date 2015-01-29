var express = require('express'),
	ssh = require('../modules/ssh'),
	path = require('path'),
	fs = require('fs'),
	router = express.Router();

cleanProject = function( req, res ) {
	delete req.session.public.connection.project;
	res.send("");
};

//cleanProject
router.get('/cleanProject', cleanProject);

// GET projects list. 
router.get('/getProjects', function(req, res) {

	var command = 'workflow project -l';
		
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

	var project = req.query.project;
	var descriptor = "";

	if (project == "") {
		res.send(descriptor);
	} else {
		var desc_name = '.project';
		var filename = path.join(connection.workspace, project, desc_name);

		ssh.getRemoteFile( user.name, filename, function(data) {

			console.log( 'ANSWER FROM SSH: ' + data );
			descriptor = JSON.parse(data);

			//store data in session
			req.session.public.connection.project = descriptor;

			res.send(descriptor);
		});
	}
});

// Manage project. 
router.post('/manage', function(req, res) {
	
	var opt = '';
	var project = req.body;

	if (project.action === "delete") {
		opt="d";
		command = "workflow project -" + opt + " -p " + project.name;
	} else {
		if (project.action === "create") {
			opt="c";
		} else if (project.action === "edit") {
			opt="m";
		}

		command = "workflow project -" + opt + " -p \"" + project.name + 
			"\" --params " + project.par_name + " --values " + project.par_val + 
			" --threads " + project.nthreads + " --comment \"" + project.comment + "\"";
	}

	ssh.execWorkComm( req.session.public, command, function( data ) {
		console.log( 'ANSWER FROM SSH: ' + data );
		res.send( data );
	});
});

module.exports = router;