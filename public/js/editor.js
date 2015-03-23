$( document ).ready( function() {
	
	$( '.close' ).click( function() {
		$( '.overlay' ).fadeToggle( 'fast' );
	});
	
	$( document ).keyup( function(e) {
		if ( e.keyCode === 27 && $( '.overlay' ).css( 'display' ) !== 'none' ) {
			$( '.overlay' ).fadeToggle( 'fast' );
		}
	});
});

function setSrc() {

	var config_name = $( '#configs' ).val();
	if ( config_name === '' ) {
		alert( 'Select a Configuration' );
		return;
	}
	var project_name = $( '#projects' ).val();
	if ( project_name === '' ) {
		alert( 'Select a Project' );
		return;
	}

	var method_name = $( '#methods' ).val();
	if ( method_name === '' ) {
		alert( 'First select a method' );
		return;
	}

	var source_name = $( '#src_files' ).val();

	var content = editor.getSession().getValue();

	//alert( 'last: ' + content.lastIndexOf( '\n' ) + 'length: ' + content.length );
	if ( content.lastIndexOf( '\n' ) == content.length - 1 )
		content = content.substring( 0, content.length - 1 );
	
	var file = {
		content: content
	};

	$.post( '/services/method/setSrcFile/' 
		+ config_name + '/' 
		+ project_name + '/' 
		+ method_name + '/'
		+ source_name, file, function( ) {
	//	editor.getSession().setValue(source);
	//	event.preventDefault();
		$( '.overlay' ).fadeToggle( 'fast' );
	});
}

function getRemoteSrc( event ) {

	var config_name = $( '#configs' ).val();
	if ( config_name === '' ) {
		alert( 'Select a Configuration' );
		return;
	}
	var project_name = $( '#projects' ).val();
	if ( project_name === '' ) {
		alert( 'Select a Project' );
		return;
	}

	var method_name = $( '#methods' ).val();
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
}