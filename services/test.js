var router = require( 'express' ).Router();

router.get('/getTest', function(req, res) {

	res.send( "TEST" );
});

module.exports = router;