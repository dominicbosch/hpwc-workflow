"use strict";

$(document).ready(function() {
		
	//create handler for changing of configuraton
	$("#configs").change( function() {

		//clean project list
		$("#projects").html("<option value=''>Choose A Project</option>");

		cleanProjectForm();

		var conf_file = $(this).val();
		if (conf_file == "") {
			$("#conf_table td[name='hostname']").html("--");
			$("#conf_table td[name='host']").html("--");
			$("#conf_table td[name='username']").html("--");
			$("#conf_table td[name='workflow']").html("--");
			$("#conf_table td[name='workspace']").html("--");

			//close the connection
			$.get('/services/gen/ssh/close', function( data ) {
				alert( data );
			});
		} else {
			$.get('/services/gen/getConfigs?conf=' + conf_file, function( data ) {
				var obj = data;
				$("#conf_table td[name='hostname']").html(obj.hostname);
				$("#conf_table td[name='host']").html(obj.url);
				$("#conf_table td[name='username']").html(obj.username);
				$("#conf_table td[name='workflow']").html(obj.workhome);
				$("#conf_table td[name='workspace']").html(obj.workspace);

				//when the configuration change, we read again the project
				$.get('/services/project/getProjects', function( data ) {

					var projects_string = '<option value="">Choose A Project</option>';
					
					if (data !== "") {
						data.forEach(function(project) {
							projects_string += '<option value="' + project + '">' + project + '</option>';
						});
					}

					$('#projects').html(projects_string);
/*					
					//remove old values except for the first
					$('#projects option:not(:first-child)').remove();
					//put data inside "projects" element
					if (data !== "") {
						data.forEach(function(project) {
	    					$('#projects').append($('<option>').attr('value', project).text(project));
						});
					}
*/					
				});
			});
		}
	});

	//when the project selected change, we read the value of parameters (user change)
	$("#projects").change( function() {
		var project = $(this).val();
		$("#resp_textarea").val("");
		update_project( project );
	});
});

function cleanProjectForm() {
	$("#edit_project input[name='par_list']").val("");
	$("#edit_project input[name='par_val']").val("");
	$("#edit_project input[name='nthreads']").val("");
	$("#edit_project textarea[name='comment']").val("");
}

function update_project( project ) {
	if (project == "") {
		$.get('/services/project/cleanProject', function( data ) {
			cleanProjectForm();
		});
	} else {
		//getDescriptor
		$.get('/services/project/getDescriptor?project=' + project, function( data ) {
			var desc = data;
			$("#edit_project input[name='par_list']").val(desc.parameters.list);
			$("#edit_project input[name='par_val']").val(desc.parameters.default);
			$("#edit_project input[name='nthreads']").val(desc.threads);
			$("#edit_project textarea[name='comment']").val(desc.comment);
		});
	}
}

function manage_project(action) {

	var id = "";
	var	project = {
			action: action
		};
	var conf_file = $("#configs").val();

	if (conf_file === "") {
		alert("Select A Configuration");
		return;
	}

	if (action == "delete") {
		project.name = $("#projects").val();
	} else {
		if (action == "create") {
			id="new_project";
			project.name = $("#new_project input[name='project_name']").val();
		} else if (action == "edit") {
			id="edit_project";
			project.name = $("#projects").val();
		}

		project.par_name = $("#"+id+" input[name='par_list']").val();
		project.par_val = $("#"+id+" input[name='par_val']").val();
		project.nthreads = $("#"+id+" input[name='nthreads']").val();
		project.comment = $("#"+id+" textarea[name='comment']").val();
	}

	$.post('/services/project/manage', project, function( data ) {
		$("#resp_textarea").val( data );
		
		//update project list
		$.get('/services/project/getProjects', function( data ) {

			var projects_string = '<option value="">Choose A Project</option>',
			var	project_val = "";
			
			if (data !== "") {
				data.forEach(function(project) {
					projects_string += '<option value="' + project + '">' + project + '</option>';
				});
			}

			$('#projects').html(projects_string);
			
			//if edit, select again the project
			if ((project.action === "edit")) {
				project_val = project.name;
			} else if ((project.action === "create")) {
				//clean creation form
				$("#new_project input[name='project_name']").val("");
				$("#new_project input[name='par_list']").val("");
				$("#new_project input[name='par_val']").val("");
				$("#new_project input[name='nthreads']").val("");
				$("#new_project textarea[name='comment']").val("");
			}

			$("#projects").val(project_val);

			update_project(project_val);
		});
	});
}