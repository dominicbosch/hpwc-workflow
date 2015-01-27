var express = require('express'),
	ssh = require('../modules/ssh'),
	path = require('path'),
	fs = require('fs'),
	router = express.Router();


//ssh.createConnection('guerrera');

//var conf_file = "host1.json",		
//	conf_file_path = path.join("users", "guerrera", "conf"),
//	conf_file_json = JSON.parse(fs.readFileSync(path.join(conf_file_path, conf_file))); 
//
//ssh.connectToHost(conf_file_json, "guerrera");

// GET users listing. 
router.get('/get', function(req, res) {
	var conf_file = "host1.json",		
	conf_file_path = path.join("users", "guerrera", "conf"),
	conf_file_json = JSON.parse(fs.readFileSync(path.join(conf_file_path, conf_file))); 

	ssh.connectToHost(conf_file_json, "guerrera", function(data) {
		req.session.username = 'guerrera';
		ssh.executeCommand( req.session.username, 'ls', function(data) {
			//console.log( 'ANSWER FROM SSH: ' + data );
			//send data to response
			res.send(data);
		});
	});
});

// GET projects list. 
router.get('/getProjectsOld', function(req, res) {
	
	req.session.username = 'guerrera';

	ssh.getProjectsList( req.session.username, function(data) {
		console.log( 'ANSWER FROM SSH: ' + data );
		var list = "";
		var pos = data.indexOf(':');
		if (pos != -1) {
			var list = data.substring(pos + 1).trim().split(" ");
		} 
		res.send(list);
	});
});

// GET projects list. 
router.get('/getProjects', function(req, res) {

	req.session.username = 'guerrera';
	var command = 'workflow project -l';
		
	ssh.execWorkComm( req, command, function(data) {
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
	
	req.session.username = 'guerrera';
	var project = req.query.project;
	var method = req.query.method;
	var descriptor = "";

	if (project == "") {
		res.send(descriptor);
	} else {
		var desc_name = '';
		var filename = '';

		if (method == "") {
			desc_name = '.project';
			filename = path.join(req.session.workspace, project, desc_name);
		} else {
			desc_name = '.module';
			filename = path.join(req.session.workspace, project, method, desc_name);
		}

		ssh.getRemoteFile( req.session.username, filename, function(data) {

			console.log( 'ANSWER FROM SSH: ' + data );
			descriptor = JSON.parse(data);
			res.send(descriptor);
		});
	}
});

// Manage project. 
router.post('/manage', function(req, res) {
	
	req.session.username = 'guerrera';

	var opt = '';
	var project = req.body;

	if (project.action === "delete") {
		opt="d";
		command = "workflow project -" + opt + " -p " + project.project_name;
	} else {
		if (project.action === "create") {
			opt="c";
		} else if (project.action === "edit") {
			opt="m";
		}

		command = "workflow project -" + opt + " -p " + project.project_name + 
			" --params " + project.par_name + " --values " + project.par_val + 
			" --threads " + project.nthreads + " --comment \"" + project.comment + "\"";
	}

	ssh.execWorkComm( req, command, function( data ) {
		console.log( 'ANSWER FROM SSH: ' + data );
		res.send( data );
	});
});

module.exports = router;