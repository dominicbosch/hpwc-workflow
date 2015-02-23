"use strict";

oPub.updateProject = true;

//OK
function addToList( name ) {
	var string = '', 
		value = $( '#' + name ).val().trim();

	if ( value !== '' ) {
		if ( $( '#experiment_setup td[name="' + name + '"] input[value="' 
			+ value + '"]' ).val() ) {
			alert("Value already in the list, just check it!");
		} else {
			string = createListItem( value, true, false );
			$( '#experiment_setup td[name="' + name + '"]' ).append( string );
		}
	} else {
		alert( 'First select a value' );
	}
}

//OK
function cleanProjectForm() {
	$( '#experiment_setup td[name="par_list"]' ).empty();
	$( '#experiment_setup td[name="par_val"]' ).empty();
	$( '#experiment_setup td[name="nthreads"] input' ).prop( 'checked', false );
	$( '#experiment_setup td[name="hosts"]' ).empty();
}

//OK
function setProjectForm( project ) {
	$( '#experiment_setup td[name="par_list"]' ).text(project.parameters.list);
	$( '#experiment_setup td[name="par_val"]' ).html(
		createListItem( project.parameters.default, true, false ) );
	$( '#experiment_setup td[name="nthreads"] input[value="' 
		+ project.threads + '"]' ).prop( 'checked', true );
	$( '#experiment_setup td[name="hosts"]' ).html(
		createListItem( 'localhost', true, true ) );

}

function cleanOutputForm() {
	$( '.fixed' ).prop( 'checked', true );
	$( '.fixed' ).prop( 'disabled', true );
	$( '#exp_details td[name="parameters"]' ).text( '--' );
	$( '#exp_details td[name="methods"]' ).text( '--' );
	$( '#exp_details td[name="nthreads"]' ).text( '--' );
	$( '#exp_details td[name="nexecs"]' ).text( '--' );
}

//OK
function updateProjectFormInExp() {

	var config_name = $( '#configs' ).val(),
		project_name = $( '#projects' ).val();

	if ( project_name === '' ) {
		$.get( '/services/session/cleanProject', function( data ) {

			oPub.selectedConn.projectName = '';

			//clean information related to the project
			cleanProjectForm();

			//clean method list
			$("#experiment_setup td[name='methods']").empty();

			//clean output list
			$("#experiments").html("<option value=''>Choose An Experiment</option>");

		});
	} else {
		//fill project form
		$.get( '/services/project/get/' 
			+ config_name + '/' 
			+ project_name, function( project ) {

			oPub.selectedConn.projectName = project_name;

			setProjectForm( project );

			//update methods list
			getAndSetMethodsList( config_name, project_name );

			//update experiment list
			getAndSetExperiments( config_name, project_name );
		});
	}
}

//OK
function getAndSetMethodsList( config_name, project_val ) {

	if( ( config_name !== '' ) && ( project_val !== '' ) ) {
		//read the projects for an open connection and set the values
		$.get( '/services/method/getAll/' 
			+ config_name + '/'
			+ project_val, function( methods ) {

			var string_html = '';

			//fill list
			for ( var i in methods ) {
				string_html += createListItem( methods[i], false, false );
			}
			$("#experiment_setup td[name='methods']").html(string_html);

		}).fail(function( xhr ) {
			console.log( xhr.responseText );
		});
	} else {
		//clean method list
		$("#experiment_setup td[name='methods']").empty();
	}
}

$(document).ready(function() {

	//OK
	updateConfigurationsList( 
		null, 
		updateProjectFormInExp
	);

	//get data
	$("#experiments").change( function() {

		//updateOutputForm( );
	});

	//when the project selected change, we read the value of parameters (user change)
	$("#projects").change( function() {

		//clean output list
		$("#experiments").html("<option value=''>Choose An Experiment</option>");

		updateProjectFormInExp( );
	});

	//OK
	//create handler for changing of configuraton
	$("#configs").change( function() {

		//clean project list
		$( '#projects' ).html( '<option value="">Choose A Project</option>' );

		//clean information related to the project
		if ( oPub.selectedConn.projectName && ( oPub.selectedConn.projectName !== '' ) )
			updateProjectFormInExp();

		//update the right part of the page and read the project list
		updateConfigurationForm();
	});

	$( '#connectButton' ).on( 'click', function() {

		//when disconnect, the project has to be deleted but this doesn't influence the functioning
		//oPub.selectedConn.projectName = '';

		//clean information related to the project
		cleanProjectForm();

		//clean method list
		$("#experiment_setup td[name='methods']").empty();

		//clean output list
		$("#experiments").html("<option value=''>Choose An Experiment</option>");
	});

});
