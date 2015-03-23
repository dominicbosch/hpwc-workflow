var gulp = require( 'gulp' ),
	nodemon = require( 'gulp-nodemon' ),
	jshint = require( 'gulp-jshint' );
 
gulp.task( 'lint', function () {
	gulp.src([ './**/*.js', '!./node_modules/**/*', '!./public/js/lib/**/*' ])
		.pipe( jshint() )
		.pipe( jshint.reporter( 'default' ) );
})
 
gulp.task( 'develop', function () {
  nodemon({ script: 'run-hpwc-server.js', ext: 'html js' })
    // .on( 'change', [ 'lint' ] )
    .on( 'restart', function () {
      console.log( 'restarted!' );
    })
})