var showTab = function( id ) {
	$( id ).show().siblings().hide();
	$( 'a[href="' + id + '"]' ).parent( 'li' ).addClass( 'active' ).siblings().removeClass( 'active' );
}

$(document).ready(function() {

	//function to manage tab view
	$( '.tabs .tab-links a' ).click( function( e ) {
		var currentAttrValue = $( this ).attr( 'href' );

		showTab( currentAttrValue );

		var url = window.location.origin + window.location.pathname + "?tab=" + currentAttrValue.substring(1);
		window.history.pushState( null, null, url );
		
		e.preventDefault();
	});

	// This does not work if we do not put this on top of the executîon stack
	setTimeout(function() {
		var oQuery = getURLQuery();
		if( oQuery.tab && oQuery.tab !== '' ) showTab( '#' + oQuery.tab );
	}, 0);
});