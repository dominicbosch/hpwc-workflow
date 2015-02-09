"use strict";

function cleanProjectForm() {
	$( '#project_details input' ).val( '' );
	$( '#project_details textarea' ).val( '' );
}

function update_project( project ) {
	if ( project === '' ) {
		$.get( '/services/session/cleanProject', function( data ) {
			cleanProjectForm();
		});
	} else {
		//getDescriptor
		$.get( '/services/project/getDescriptor?project="' + project, function( data ) {
			var desc = data;
			$( '#project_details input[name="par_list"]' ).val(desc.parameters.list);
			$( '#project_details input[name="par_val"]' ).val(desc.parameters.default);
			$( '#project_details input[name="nthreads"]' ).val(desc.threads);
			$( '#project_details textarea[name="comment"]' ).val(desc.comment);
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
		if (action === 'create' ) {
			id = 'new_project';
			project.name = $( '#new_project input[name="project_name"]' ).val();
		} else if (action === 'edit' ) {
			id = 'project_details';
			project.name = $( '#projects' ).val();
		}

		project.par_name = $( '#"+id+" input[name="par_list"]' ).val();
		project.par_val = $( '#"+id+" input[name="par_val"]' ).val();
		project.nthreads = $( '#"+id+" input[name="nthreads"]' ).val();
		project.comment = $( '#"+id+" textarea[name="comment"]' ).val();
	}

	$.post( '/services/project/manage', project, function( data ) {
		$( '#resp_textarea' ).val( data );
		
		//update project list
		$.get( '/services/project/getProjects', function( data ) {

			var projects_string = '<option value="">Choose A Project</option>';
			var	project_val = "";
			
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

			update_project(project_val);
		});
	});
}

$(document).ready(function() {
		
	//create handler for changing of configuraton
	$( '#configs' ).change( cleanProjectForm );

	//when the project selected change, we read the value of parameters (user change)
	$( '#projects' ).change( function() {
		var project = $( this ).val();
		$( '#resp_textarea' ).val( '' );
		update_project( project );
	});

});