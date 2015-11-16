"use strict";

oPub.updateProject = true;

function showGraph() {

	var config_name = $( '#configs' ).val(),
		project_name = $( '#projects' ).val(),
		experiment_name = $( '#experiments' ).val(),
		metric = $( 'input[name="metric_name"]' ).val(),
		experiment;

	if ( experiment_name === '' )
		return;

//	if ( metric === '' )
//		metric = 'GFlop/s';

	experiment = {
		dimensions : buildList( 'exp_details', 'parameters' ),
		methods : buildList( 'exp_details', 'methods' ),
		nthreads : buildList( 'exp_details', 'nthreads' ),
		fixed : $( '.fixed:checked' ).first().val(),
		metric : '"' + metric + '"'
	}

	$.post( '/services/graph/buildAndGet/' 
		+ config_name + '/' 
		+ project_name + '/' 
		+ experiment_name, experiment, function( encImage ) {
		
		$( '#out_image' ).attr( 'src', 'data:image/png; base64, ' + encImage );
		$( '#out_image' ).attr( 'style', 'border:2px solid; padding: 10px;' );

	}).fail(function( xhr ) {
		console.log( xhr.responseText );
	});

}

function deleteExperiment() {

	var config_name = $( '#configs' ).val(),
		project_name = $( '#projects' ).val(),
		experiment_name = $( '#experiments' ).val();

	if ( experiment_name === '' ) {
		alert( 'First select an experiment!' );
		return;
	}

	$.get( '/services/experiment/delete/' 
		+ config_name + '/' 
		+ project_name + '/' 
		+ experiment_name, function( data ) {
		
		if ( !data.err ) {
			$( '#experiments' ).val( '' ).change();
			$( '#experiments option[value=' + experiment_name + ']' ).remove();
		}

		addTextAndScroll( 'info_textarea', data.msg );

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
		$( '#projects' ).prop( 'disabled', true );
		//fill project form
		$.get( '/services/project/get/' 
			+ config_name + '/' 
			+ project_name, function( project ) {

			setProjectForm( project );
			$( '#projects' ).prop( 'disabled', false );
			//update experiments list
			getAndSetExperiments( config_name, project_name );
		});
	}
}

function cleanOutputForm() {
	$( '.fixed' ).prop( 'checked', true );
	$( '.fixed' ).prop( 'disabled', true );
	$( '#exp_details td[name="parameters"]' ).text( '--' );
	$( '#exp_details td[name="methods"]' ).text( '--' );
	$( '#exp_details td[name="nthreads"]' ).text( '--' );
	$( '#exp_details td[name="nexecs"]' ).text( '--' );
}

function setOutputForm( experiment ) {

	var params = experiment.parameters,
		methods = experiment.methods,
		nthreads = experiment.nthreads,
		string_html;

	$( '#fix_par' ).prop( 'disabled', params.length === 1 );
	$( '#fix_met' ).prop( 'disabled', methods.length === 1 );
	$( '#fix_thr' ).prop( 'disabled', nthreads.length === 1 );

	//fill parameters
	string_html = '';
	for ( var i in params ) {
		string_html += createListItem( params[i], (i==0), false );
	}
	$( '#exp_details td[name="parameters"]' ).html(string_html);

	$( '#exp_details td[name="parameters"] input' ).on( 'change', addChecksToList);

	//fill methods
	string_html = '';
	for ( var i in methods ) {
		string_html += createListItem( methods[i], (i==0), false );
	}
	$( '#exp_details td[name="methods"]' ).html(string_html);

	$( '#exp_details td[name="methods"] input' ).on( 'change', addChecksToList);

	//fill number of threads
	string_html = '';
	for ( var i in nthreads ) {
		string_html += createListItem( nthreads[i], (i==0), false );
	}
	$( '#exp_details td[name="nthreads"]' ).html(string_html);

	$( '#exp_details td[name="nthreads"] input' ).on( 'change', addChecksToList);

	$( '#exp_details td[name="nexecs"]' ).html(experiment.executions);
}

function updateOutputForm( cb ) {

	var config_name = $( '#configs' ).val(),
		project_name = $( '#projects' ).val(),
		experiment_name = $( '#experiments' ).val();

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

function addChecksToList() {
	var n = 0;

	if ( $(this).is( ':checked' ) ) {
		if ( $(this).parent().parent( 'td' ).prev( 'td' ).children( '.fixed' ).is( ':checked' ) ) {
			//uncheck other box 
			$(this).parent().siblings().children( 'input' ).prop( 'checked', false );
		}
	} else {
		n = $(this).parent().siblings().children( 'input:checked' ).length;
		if ( n === 0 ) {
			$(this).prop( 'checked', true );
			alert("Property can't be empty");
		} else {
			if ( n === 1 ) {
				$(this).parent().parent( 'td' ).prev( 'td' ).children( '.fixed' ).prop( 'checked', true );
			}
		}
	}
}

$(document).ready(function() {

	updateConfigurationsList( 
		null,
		updateProjectFormInViz
	);

	//create handler for changing of configuraton
	$("#configs").change( function() {

		//clean image
		$( '#out_image' ).removeAttr( 'src' );
		$( '#out_image' ).removeAttr( 'style' );

		cleanOutputForm();
		
		//clean output list
		$("#experiments").html("<option value=''>Choose An Experiment</option>");

		//clean information related to the project
		cleanProjectForm();

		//update the right part of the page and the project list
		updateConfigurationForm( );
	});

	//get outputs
	$("#experiments").change( function() {

		//clean image
		$( '#out_image' ).removeAttr( 'src' );
		$( '#out_image' ).removeAttr( 'style' );

		updateOutputForm( );
	});

	//when the project selected change, we read the value of parameters (user change)
	$("#projects").change( function() {

		//clean image
		$( '#out_image' ).removeAttr( 'src' );
		$( '#out_image' ).removeAttr( 'style' );

		//clean output list
		$("#experiments").html("<option value=''>Choose An Experiment</option>");

		cleanOutputForm();

		updateProjectFormInViz( );
	});

	$( '.fixed' ).on( 'change', function() {
		var name = '',
			n = 0;

		if ( $(this).is( ':checked' ) ) {
			name = $(this).parent().next( 'td' ).attr( 'name' );
			n = $( '#exp_details td[name="' + name + '"] input:checked' ).length;
			if ( n !== 1) {
				$(this).prop( 'checked', false );
				alert("To fix a property, only 1 correspondent value has to be selected");
			}
		} else {
			n = $( '.fixed:checked' ).length;
			if ( n === 0 ) {
				$(this).prop( 'checked', true );
				alert("At least one property has to be checked");
			}
		}
	});

	$( '#connectButton' ).on( 'click', cleanOutputForm );

	$( '#connectButton' ).on( 'click', cleanProjectForm );

	$( '#connectButton' ).on( 'click', function() {
		$( '#out_image' ).removeAttr( 'src' );
		$( '#out_image' ).removeAttr( 'style' );
	});
});