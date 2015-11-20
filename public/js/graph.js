"use strict";

function buildList( tab_id, td_name ) {
	var string = '';
	$( '#' + tab_id + ' [name="' + td_name + '"] input:checked' ).each( function() {
		string += '"' + $( this ).val() + '" ';
	});
	//console.log('BUILD LIST:', string);
	return string;
}

function getMax( tab_id, td_name ) {
	var max = 0;
	$( '#' + tab_id + ' [name="' + td_name + '"] input:checked' ).each( function() {
		if ( $( this ).val() > max )
			max = $( this ).val();
	});
	return max;
}

/*function getMax( stringList ) {
	alert("Stringa: " + stringList );
    var arr = stringList.split('" "');
   	var max = 0;
	arr.forEach( function( val ) {
		alert("val: " + val );
		if ( parseInt(val) > max )
			max = parseInt(val);
		alert("max: " + max );
	});
    return max;
}*/

function getAndSetExperiments( config_name, project_val, cb ) {

	var tempExpsHTMLObj = $( '<select>' );
	tempExpsHTMLObj.html( $( '<option>' ).attr( 'value', '' ).text( 'Choose An Experiment' ) );


	if( ( config_name !== '' ) && ( project_val !== '' ) ) {
		
		$( '#experiments' ).prop( 'disabled', true );

		$.get( '/services/experiment/getAll/' 
			+ config_name + '/'
			+ project_val, function( experiments ) {

			var year, month, day, hour, minute, second, output;

			for ( var i in experiments ) {
				year = experiments[i].substring(0,4);
				month = experiments[i].substring(4,6);
				day = experiments[i].substring(6,8);
				hour = experiments[i].substring(9,11);
				minute = experiments[i].substring(11,13);
				second = experiments[i].substring(13,15);
				output = day + '/' + month + '/' 
						+ year + ' at ' + hour + ':' 
						+ minute + ':' + second;
				tempExpsHTMLObj.append($( '<option>' ).attr( 'value', experiments[i] ).text( output ) );
			}
			$( '#experiments' ).html( tempExpsHTMLObj.html() );
		}).fail(function( xhr ) {
			console.log( xhr.responseText );
		}).always(function() {
		//	$( '#experiments' ).html( tempExpsHTMLObj.html() );
			$( '#experiments' ).prop( 'disabled', false );
		});

		if ( typeof(cb) === 'function' ) 
			cb( );

	} /*else {
		//clean experiments list
		$( '#experiments' ).html( '<option value="">Choose An Experiment</option>' );
	}*/
}
