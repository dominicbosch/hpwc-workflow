"use strict";

var updateProject = true;

function buildList( td_name ) {
	var string = '';
	$( '#exp_details td[name="' + td_name + '"] input:checked' ).each( function() {
		string += '"' + $( this ).val() + '" ';
	});

	return string;
}

function showGraph() {

	var config_name = $( '#configs' ).val(),
		project_name = $( '#projects' ).val(),
		experiment_name = $( '#graphs' ).val(),
		experiment;

	if ( experiment_name === '' )
		return;

	experiment = {
		dimensions : buildList( 'parameters' ),
		methods : buildList( 'methods' ),
		nthreads : buildList( 'nthreads' ),
		fixed : $( '.fixed:checked' ).first().val()
	}

	$.post( '/services/graph/buildAndGet/' 
		+ config_name + '/' 
		+ project_name + '/' 
		+ experiment_name, experiment, function( localFile ) {
				
	}).fail(function( xhr ) {
		console.log( xhr.responseText );
	});

}
function cleanProjectForm() {
	$( '#project_details td' ).text( '--' );
}

function setProjectForm( project ) {
	$("#project_details td[name='par_list']").text(project.parameters.list);
	$("#project_details td[name='comment']").text(project.comment);
}

function updateProjectFormInViz( cb ) {
	var config_name = $( '#configs' ).val(),
		project_name = $( '#projects' ).val();

	if ( project_name === '' ) {
		$.get( '/services/session/cleanProject', function( data ) {
			cleanProjectForm();
		});
	} else {
		//fill project form
		$.get( '/services/project/get/' 
			+ config_name + '/' 
			+ project_name, function( project ) {

			setProjectForm( project );

			//update experiments list
			getAndSetExperiments( config_name, project_name );
		});
	}
}

function getAndSetExperiments( config_name, project_val, cb ) {

	if( ( config_name !== '' ) && ( project_val !== '' ) ) {
		
		$.get( '/services/experiment/getAll/' 
			+ config_name + '/'
			+ project_val, function( experiments ) {

			var year, month, day, hour, minute, output;

			for ( var i in experiments ) {
				year = experiments[i].substring(0,4);
				month = experiments[i].substring(4,6);
				day = experiments[i].substring(6,8);
				hour = experiments[i].substring(9,11);
				minute = experiments[i].substring(11,13);
				output = day + '/' + month + '/' + year + ' at ' + hour + ':' + minute;
				$( '#graphs' ).append($( '<option>' ).attr( 'value', experiments[i] ).text( output ) );
			}
		}).fail(function( xhr ) {
			console.log( xhr.responseText );
		});

		if ( typeof(cb) === 'function' ) 
			cb( );

	} else {
		//clean graphs list
		$( '#graphs' ).html( '<option value="">Choose An Experiment</option>' );
	}
}

function cleanOutputForm() {
	$("#exp_details td[name='parameters']").text("--");
	$("#exp_details td[name='methods']").text("--");
	$("#exp_details td[name='nthreads']").text("--");
	$("#exp_details td[name='nexecs']").text("--");
}

function setOutputForm( experiment ) {

	var params = experiment.parameters,
		methods = experiment.methods,
		nthreads = experiment.nthreads,
		string_html, i;

	//fill parameters
	var createListItem = function( item, isChecked, isDisabled ) {
		return '<label>'
				+ '<input type="checkbox" value="' 
					+ item + '" ' 
					+ (isChecked ? 'checked ' : '') 
					+ (isDisabled ? 'disabled ' : '') 
				+ '>' 
				+ item 
			+ '</label>';
	};

	$( '#fix_par' ).prop( 'disabled', params.length === 1 );
	$( '#fix_met' ).prop( 'disabled', methods.length === 1 );
	$( '#fix_thr' ).prop( 'disabled', nthreads.length === 1 );

	//fill parameters
	string_html = '';
	for (i = 0; i < params.length; i++) {
		string_html += createListItem( params[ i ], (i===0), true );
	}
	$("#exp_details td[name='parameters']").html(string_html);

	//fill methods
	string_html = '';
	for (i = 0; i < methods.length; i++) {
		string_html += createListItem( methods[ i ], (i===0), true );
	}
	$("#exp_details td[name='methods']").html(string_html);

	//fill number of threads
	string_html = '';
	for (i = 0; i < nthreads.length; i++) {
		string_html += createListItem( nthreads[ i ], (i===0), true );
	}
	$("#exp_details td[name='nthreads']").html(string_html);

	$("#exp_details td[name='nexecs']").html(experiment.executions);
}

function updateOutputForm( cb ) {

	var config_name = $( '#configs' ).val(),
		project_name = $( '#projects' ).val(),
		experiment_name = $( '#graphs' ).val();

	if ( experiment_name === '' ) {
		cleanOutputForm();
	} else {
		//getDescriptor
		$.get( '/services/experiment/get/' 
			+ config_name + '/' 
			+ project_name + '/' 
			+ experiment_name, function( experiment ) {

			setOutputForm( experiment );
		});
	}
}

$(document).ready(function() {

	$( '#connectButton' ).on( 'click', cleanOutputForm );

	$( '#connectButton' ).on( 'click', cleanProjectForm );

	updateConfigurationsList( 
		null,
		updateProjectFormInViz
	);

	//create handler for changing of configuraton
	$("#configs").change( function() {

		//clean output list
		$("#graphs").html("<option value=''>Choose An Experiment Output</option>");

		cleanOutputForm();

		//clean project list
		$("#projects").html("<option value=''>Choose A Project</option>");

		cleanProjectForm();

		updateConfigurationForm( );

	});

	//get outputs
	$("#graphs").change( function() {

		updateOutputForm( );
	});

	//when the project selected change, we read the value of parameters (user change)
	$("#projects").change( function() {

		//clean output list
		$("#graphs").html("<option value=''>Choose An Experiment Output</option>");

		cleanOutputForm();

		updateProjectFormInViz( );
	});

	
	$("#fix_par").on( "change", function() {
		if ($(this).is(":checked")) {
			var n = $( "#exp_details td[name='parameters'] input:checked" ).length;
			if ( n !== 1) {
				$(this).prop('checked', false);
				alert("To fix a property, only 1 correspondent value has to be selected");
			} else {
				$("#exp_details td[name='parameters'] input").prop('disabled', true);
			}
		} else {
			if ($("#fix_met").is(":checked") || $("#fix_thr").is(":checked")) {
				$("#exp_details td[name='parameters'] input").prop('disabled', false);
			} else {
				$(this).prop('checked', true);
				alert("At least one property has to be checked");
			}
		}
	});
	$("#fix_met").on( "change", function() {
		if ($(this).is(":checked")) {
			var n = $( "#exp_details td[name='methods'] input:checked" ).length;
			if ( n !== 1) {
				$(this).prop('checked', false);
				alert("To fix a property, only 1 correspondent value has to be selected");
			} else {
				$("#exp_details td[name='methods'] input").prop('disabled', true);
			}
		} else {
			if ($("#fix_par").is(":checked") || $("#fix_thr").is(":checked")) {
				$("#exp_details td[name='methods'] input").prop('disabled', false);
			} else {
				$(this).prop('checked', true);
				alert("At least one property has to be checked");
			}
		}
	});
	$("#fix_thr").on( "change", function() {
		if ($(this).is(":checked")) {
			var n = $( "#exp_details td[name='nthreads'] input:checked" ).length;
			if ( n !== 1) {
				$(this).prop('checked', false);
				alert("To fix a property, only 1 correspondent value has to be selected");
			} else {
				$("#exp_details td[name='nthreads'] input").prop('disabled', true);
			}
		} else {
			if ($("#fix_par").is(":checked") || $("#fix_met").is(":checked")) {
				$("#exp_details td[name='nthreads'] input").prop('disabled', false);
			} else {
				$(this).prop('checked', true);
				alert("At least one property has to be checked");
			}
		}
	});
});
