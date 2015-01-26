var router = require( 'express' ).Router();

router.get( '/getProjects', function( req, res ) {
	res.send( 'get Projects' );
});

module.exports = router;