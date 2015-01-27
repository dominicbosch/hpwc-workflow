var express = require('express'),
	fs = require('fs'),
	path = require('path'),
	ssh = require('../modules/ssh'),
	router = express.Router();

router.get('/getConfigs', function(req, res) {

	req.session.username = "guerrera";

	var conf_file = req.query.conf;
	var	conf_file_path = path.join("users", req.session.username, "conf");

	if (conf_file) { //read specific file
		var connObj = JSON.parse(fs.readFileSync(path.join(conf_file_path, conf_file)));
		console.log("reading conf file");
		if (connObj) {
			ssh.connectToHost( connObj, req.session.username, function(err, data) {
				console.log( 'ANSWER FROM CONNECTION: ' + data );
				//save if connection ok
				req.session.conf = connObj.filename;
				req.session.hostname = connObj.hostname;
				req.session.workhome = connObj.workhome;
				req.session.workspace = connObj.workspace;

				res.send(connObj);
			});
		}
	} else { //read all configurations
		var arr = fs.readdirSync(conf_file_path);
		res.send(arr.filter( function(d){ return d.substring(d.length-5)==='.json'}));
	}
});

router.get('/getSessionVar', function(req, res) {

	if (req.session[req.query.name])
		res.send(req.session[req.query.name]);
	else
		res.send("");

//	if (req.query.name) {
//		console.log("if");
//		res.send(req.session[req.query.name]);
//	} else {
//		console.log("else");
//		res.send("");
//	}
	/*
	if (req.query.name) {
		console.log("if");
		res.send(req.session[req.query.name]);
	} else {
		console.log("else");
		res.send("");
	}*/
});

router.get('/ssh/close', function(req, res) {

	//close the connection
	ssh.closeConnection('guerrera');

	//clean session variables
	req.session.conf = "";
	req.session.hostname = "";
	req.session.workhome = "";
	req.session.workspace = "";

	//send message to client
	res.send("Connection Closed");
});

module.exports = router;
