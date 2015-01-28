"use strict";

$(document).ready(function() {

	//create handler for changing of configuraton
	$("#configs").change( function() {
		var conf_file = $(this).val();
		if (conf_file == "") {
			$("#conf_table td[name='hostname']").html("--");
			$("#conf_table td[name='host']").html("--");
			$("#conf_table td[name='username']").html("--");
			$("#conf_table td[name='workflow']").html("--");
			$("#conf_table td[name='workspace']").html("--");

			//clean project list
			$("#projects").html("<option value=''>Choose A Project</option>");
			$("#projects").change();

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
					data.forEach(function(project) {
						projects_string += '<option value="' + project + '">' + project + '</option>';
					});

					$('#projects').html(projects_string);

				});
			});
		}
	});

	//get method
	$("#methods").change( function() {

		var method = $(this).val();
		$("#resp_textarea").val("");
		update_method( method );
	});

	//when the project selected change, we read the modules implemented
	$("#projects").change( function() {
		var conf_file = $("#configs").val();
		if (conf_file == "") {
			alert("Select A Configuration");
			return;
		}
		var project = $(this).val();

		if (project == "") {
			$.get('/services/project/cleanProject', function( data ) {
				$("#methods").html("<option value=''>Choose A Method</option>");
				$("#methods").change();
			});
		} else {
			$.get('/services/project/getDescriptor?project=' + project, function( ) {
				$.get('/services/method/getMethods', function( data ) {
					var methods_string = '<option value="">Choose A Method</option>';
					data.forEach(function(method) {
						methods_string += '<option value="' + method + '">' + method + '</option>';
					});
					$('#methods').html(methods_string);
				});
			});
		}
	});

});

function update_method( method ) {
	if (method == "") {
		$("#edit_method input[name='method_type']").val("");
		$("#edit_method textarea[name='comment']").val("");
	} else {
		//getDescriptor
		$.get('/services/project/getDescriptor?&method=' + method, function( data ) {
			var desc = data;
			$("#edit_method input[name='method_type']").val(desc.type);
			$("#edit_project textarea[name='comment']").val(desc.comment);
		});
	}
}

function manage_method( action ) {

	var id = "",
		obj = {
			action: action
		},
		conf_file = $("#configs option:selected").val();

	if (conf_file === "") {
		alert("Select A Configuration");
		return;
	}

	if (action == "delete") {
		obj.project_name = $("#projects").val();
	} else {
		if (action == "create") {
			id="new_project";
			obj.project_name = $("#new_project input[name='project_name']").val();
		} else if (action == "edit") {
			id="edit_project";
			obj.project_name = $("#projects").val();
		}

		obj.par_name = $("#"+id+" input[name='par_list']").val();
		obj.par_val = $("#"+id+" input[name='par_val']").val();
		obj.nthreads = $("#"+id+" input[name='nthreads']").val();
		obj.comment = $("#"+id+" textarea[name='comment']").val();
	}

	$.post('/services/project/manage', obj, function( data ) {
		$("#resp_textarea").val( data );
		
		//update project list
		$.get('/services/project/getProjects', function( data ) {

			var projects_string = '<option value="">Choose A Project</option>',
				project_val = "";
			data.forEach(function(project) {
				projects_string += '<option value="' + project + '">' + project + '</option>';
			});

			$('#projects').html(projects_string);
			
			//if edit, select again the project
			if ((obj.action === "edit")) {
				project_val = obj.project_name;
			} else if ((obj.action === "create")) {
				//clean creation form
				$("#new_project input[name='project_name']").val("");
				$("#new_project input[name='par_list']").val("");
				$("#new_project input[name='par_val']").val("");
				$("#new_project input[name='nthreads']").val("");
				$("#new_project textarea[name='comment']").val("");
			}

			$("#projects").val(project_val);

			update_project($("#projects").val());

			//update_project();
		});
	});
}