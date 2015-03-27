"use strict";

oPub.updateProject = true;
		
function cleanProjectForm() {
	$( '#project_details input' ).val( '' );
	$( '#project_details textarea' ).val( '' );
}

function setProjectForm( project ) {
	$( '#project_details input[name="par_list"]' ).val(project.parameters.list);
	$( '#project_details input[name="par_val"]' ).val(project.parameters.default);
	$( '#project_details input[name="nthreads"]' ).val(project.threads);
	$( '#project_details textarea[name="comment"]' ).val(project.comment);
}

function updateProjectForm( cb ) {
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
		});
	}
}

function manage_project( action ) {

	var id = '' ;
	var	project = {
			action: action
		};
	var config_name = $( '#configs' ).val();

	if ( config_name === '' ) {
		alert( 'Select A Configuration' );
		return;
	}

	if ( action === 'delete' ) {
		project.name = $( '#projects' ).val();
	} else {
		if ( action === 'create' ) {
			id = 'new_project' ;
			project.name = $( '#new_project input[name="project_name"]' ).val();
		} else if (action === 'edit' ) {
			id = 'project_details' ;
			project.name = $( '#projects' ).val();
		}

		if ( project.name === '' ) {
			alert( 'Project can not be empty' );
			return;
		}

		project.par_name = $( '#'+id+' input[name="par_list"]' ).val();
		project.par_val = $( '#'+id+' input[name="par_val"]' ).val();
		project.nthreads = $( '#'+id+' input[name="nthreads"]' ).val();
		project.comment = $( '#'+id+' textarea[name="comment"]' ).val();
		
	}
	if ( ( project.nthreads === '' ) || ( project.nthreads <= 0 ) ) {
		project.nthreads = 2;
	}

	$.post( '/services/project/manage/' 
		+ config_name, project, function( data ) {

		setTextAndScroll( 'resp_textarea', data );

		//clean project list
		$( '#projects' ).html( '<option value="">Choose A Project</option>' );
		$( '#projects' ).val( '' );

		var	project_val = project.name;

		if( project.action === 'delete' ) {
			updateProjectForm();
			project_val = null;
		} else if ( project.action === 'create' ) {
			//clean creation form
			$( '#new_project input' ).val( '' );
			$( '#new_project textarea' ).val( '' );
		}

		//update project list
		getAndSetProjects( $( '#configs' ).val(), project_val, updateProjectForm);

	});
}

$(document).ready(function() {

	updateConfigurationsList( 
		null, 
		updateProjectForm 
	);

	$( '#configs' ).change( function() {
		setTextAndScroll( 'resp_textarea', '' );
		cleanProjectForm();
	});

	$( '#configs' ).change( updateConfigurationForm );

	$( '#connectButton' ).on( 'click', cleanProjectForm );

	//when the project selected change, we read the value of parameters (user change)
	$( '#projects' ).change( function() {
		setTextAndScroll( 'resp_textarea', '' );
		updateProjectForm( );
	});

});