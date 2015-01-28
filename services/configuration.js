var express = require( 'express' ),
	fs = require( 'fs' ),
	path = require( 'path' ),
	ssh = require( '../modules/ssh' ),
	router = express.Router();

router.get( '/create', function( req, res ) {
	var user = req.session.public.user;

	var conf_file = req.query.conf;
	var	conf_file_path = path.join("users", user.name, "conf");

	if (conf_file) { //read specific file
		var connObj = JSON.parse(fs.readFileSync(path.join(conf_file_path, conf_file)));
		console.log("reading conf file");
		if (connObj) {
			ssh.connectToHost( connObj, user.name, function(err, data) {
				console.log( 'ANSWER FROM CONNECTION: ' + data );

				//save if connection ok
				req.session.public.connection = connObj;

				res.send(connObj);
			});
		}
	} else { //read all configurations
		var arr = fs.readdirSync(conf_file_path);
		res.send(arr.filter( function(d){ return d.substring(d.length-5)==='.json'}));
	}
});


// FIXME CATCH NO EXISTING CONFIGURATIONS 
router.get( '/get', function(req, res) {

	//req.session.username = "guerrera";
	var user = req.session.public.user;

	var conf_file = req.query.conf;
	var	conf_file_path = path.join("users", user.name, "conf");

	if (conf_file) { //read specific file
		var connObj = JSON.parse(fs.readFileSync(path.join(conf_file_path, conf_file)));
		console.log("reading conf file");
		if (connObj) {
			ssh.connectToHost( connObj, user.name, function(err, data) {
				console.log( 'ANSWER FROM CONNECTION: ' + data );

				//save if connection ok
				req.session.public.connection = {
					name: connObj.filename,
					hostname: connObj.hostname,
					url: connObj.hosturl,
					port: connObj.port,
					username: connObj.username,
					workhome: connObj.workhome,
					workspace: connObj.workspace
				}

				res.send(connObj);
			});
		}
	} else { //read all configurations
		var arr = fs.readdirSync(conf_file_path);
		res.send(arr.filter( function(d){ return d.substring(d.length-5)==='.json'}));
	}
});

module.exports = router;
