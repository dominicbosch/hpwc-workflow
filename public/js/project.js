"use strict";

function cleanProjectForm() {
	$( '#project_details input' ).val( '' );
	$( '#project_details textarea' ).val( '' );
}

function updateProjectForm( cb ) {
	var project_name = $( '#projects' ).val();
	if ( project_name === '' ) {
		$.get( '/services/session/cleanProject', function( data ) {
			cleanProjectForm();
		});
	} else {
		//fill project form
		$.get( '/services/project/get/' + $( '#configs' ).val() + '/' + project_name, function( project ) {
			$( '#project_details input[name="par_list"]' ).val(project.parameters.list);
			$( '#project_details input[name="par_val"]' ).val(project.parameters.default);
			$( '#project_details input[name="nthreads"]' ).val(project.threads);
			$( '#project_details textarea[name="comment"]' ).val(project.comment);
		});
	}
}

function manage_project(action) {

	var id = "";
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
			id = 'new_project';
			project.name = $( '#new_project input[name="project_name"]' ).val();
		} else if (action === 'edit' ) {
			id = 'project_details';
			project.name = $( '#projects' ).val();
		}

		project.par_name = $( '#'+id+' input[name="par_list"]' ).val();
		project.par_val = $( '#'+id+' input[name="par_val"]' ).val();
		project.nthreads = $( '#'+id+' input[name="nthreads"]' ).val();
		project.comment = $( '#'+id+' textarea[name="comment"]' ).val();
	}

	$.post( '/services/project/manage', project, function( data ) {
		$( '#resp_textarea' ).val( data );
		
		//update project list
		$.get( '/services/project/getProjects', function( data ) {

			var projects_string = '<option value="">Choose A Project</option>';
			var	project_val = '';
			
			if ( data !== '' ) {
				data.forEach(function(project) {
					projects_string += '<option value="' + project + '">' + project + '</option>';
				});
			}

			$( '#projects' ).html(projects_string);
			
			//if edit, select again the project
			if( project.action === 'edit' ) {
				project_val = project.name;
			} else if ( project.action === 'create' ) {
				//clean creation form
				$( '#new_project input' ).val( '' );
				$( '#new_project textarea' ).val( '' );
			}

			$( '#projects' ).val(project_val);

			updateProjectForm(project_val);
		});
	});
}

$(document).ready(function() {
		
	//create handler for changing of configuraton
	$( '#configs' ).change( cleanProjectForm );

	$( '#connectButton' ).on( 'click', cleanProjectForm );

	//when the project selected change, we read the value of parameters (user change)
	$( '#projects' ).change( function() {
		var project = $( this ).val();
		$( '#resp_textarea' ).val( '' );
		updateProjectForm( project );
	});

});