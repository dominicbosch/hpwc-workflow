"use strict";

function buildList( tab_id, td_name ) {
	var string = '';
	$( '#' + tab_id + ' td[name="' + td_name + '"] input:checked' ).each( function() {
		string += '"' + $( this ).val() + '" ';
	});

	return string;
}

function getAndSetExperiments( config_name, project_val, cb ) {

	if( ( config_name !== '' ) && ( project_val !== '' ) ) {
		
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
				$( '#experiments' ).append($( '<option>' ).attr( 'value', experiments[i] ).text( output ) );
			}
		}).fail(function( xhr ) {
			console.log( xhr.responseText );
		});

		if ( typeof(cb) === 'function' ) 
			cb( );

	} else {
		//clean experiments list
		$( '#experiments' ).html( '<option value="">Choose An Experiment</option>' );
	}
}
