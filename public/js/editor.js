$( document ).ready( function() {
	//editor
	$( '#edit_code' ).click( function( event ){

		config_name = $( '#configs' ).val();
		if ( config_name === '' ) {
			alert( 'Select a Configuration' );
			return;
		}
		project_name = $( '#projects' ).val();
		if ( project_name === '' ) {
			alert( 'Select a Project' );
			return;
		}

		method_name = $( '#methods' ).val();
		if ( method_name === '' ) {
			alert( 'First select a method' );
			return;
		}

		var source_name = $( '#src_files' ).val();
		$.get( '/services/method/getSrcFile/' 
			+ config_name + '/' 
			+ project_name + '/' 
			+ method_name + '/'
			+ source_name, function( source ) {
			editor.getSession().setValue(source);
			event.preventDefault();
			$( '.overlay' ).fadeToggle( 'fast' );
		});
  	});
	
	$( '.close' ).click( function() {
		$( '.overlay' ).fadeToggle( 'fast' );
	});
	
	$( document ).keyup( function(e) {
		if ( e.keyCode === 27 && $( '.overlay' ).css( 'display' ) !== 'none' ) {
			$( '.overlay' ).fadeToggle( 'fast' );
		}
	});
});

function getRemoteSrc() {

	config_name = $( '#configs' ).val();
	if ( config_name === '' ) {
		alert( 'Select a Configuration' );
		return;
	}
	project_name = $( '#projects' ).val();
	if ( project_name === '' ) {
		alert( 'Select a Project' );
		return;
	}

	method = $( '#methods' ).val();
	if ( method === '' ) {
		alert( 'First select a method' );
		return;
	}
	
	exp = project_name + "/"+method+"/src/example.chpl";
	getPreview(conf_file, exp, {
		onFinish: function(response) {
			editor.getSession().setValue(response);
		}, 
	});

}