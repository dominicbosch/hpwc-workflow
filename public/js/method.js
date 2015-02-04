"use strict";

$(document).ready(function() {

	//create handler for changing of configuraton
	$("#configs").change( function() {

		//clean method list
		$("#methods").html("<option value=''>Choose A Method</option>");

		cleanMethodForm();

		//clean method type
		$("#method_types").html("<option value=''>Choose A Method Type</option>");

		//clean project list
		$("#projects").html("<option value=''>Choose A Project</option>");

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
				});

				$.get('/services/method/getInstalled', function( data ) {

					var types_string = '<option value="">Choose A Method Type</option>';

					if (data !== "") {
						data.forEach(function(type) {
							types_string += '<option value="' + type + '">' + type + '</option>';
						});
					}
					$('#method_types').html(types_string);
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

		$("#methods").html("<option value=''>Choose A Method</option>");

		cleanMethodForm();

		var project = $(this).val();

		if (project == "") {
			$.get('/services/session/cleanProject', function( data ) {
				
			});
		} else {
			$.get('/services/project/getDescriptor?project=' + project, function( ) {
				$.get('/services/method/get', function( data ) {
					var methods_string = '<option value="">Choose A Method</option>';
					if (data !== "") {
						data.forEach(function(method) {
							methods_string += '<option value="' + method + '">' + method + '</option>';
						});
					}
					$('#methods').html(methods_string);
				});
			});
		}
	});

});

function cleanMethodForm() {
	$("#edit_method input[name='method_type']").val("");
	$("#edit_method textarea[name='comment']").val("");
}

function update_method( method ) {
	if (method == "") {
		cleanMethodForm();
	} else {
		//getDescriptor
		$.get('/services/method/getDescriptor?&method=' + method, function( data ) {
			var desc = data;
			$("#edit_method input[name='method_type']").val(desc.type);
			$("#edit_method textarea[name='comment']").val(desc.comment);
		});
	}
}

function manage_method( action ) {

	var id = "";
	var	method = {
			action: action
		};
	var	conf_file = $("#configs").val();
	var project_name = $("#projects").val();

	if (conf_file === "") {
		alert("Select A Configuration");
		return;
	}

	if (project_name === "") {
		alert("Select A Project");
		return;
	}

	if (action == "delete") {
		method.name = $("#methods").val();
	} else {
		if (action == "create") {
			id="new_method";
			method.name = $("#new_method input[name='method_name']").val();
			method.type = $("#method_types").val();
		} else if (action == "edit") {
			alert ("to be implemented on the script");
			return;
			id="edit_method";
			method.name = $("#methods").val();
			method.type = $("#"+id+" input[name='method_type']").val();
		}

		method.comment = $("#"+id+" textarea[name='comment']").val();
	}

	$.post('/services/method/manage', method, function( data ) {
		$("#resp_textarea").val( data );
		
		//update method list
		$.get('/services/method/get', function( data ) {

			var methods_string = '<option value="">Choose A Method</option>';
			var	method_val = "";

			if (data !== "") {
				data.forEach(function(method) {
					methods_string += '<option value="' + method + '">' + method + '</option>';
				});
			}

			$('#methods').html(methods_string);

			//if edit, select again the method
			if ((method.action === "edit")) {
				method_val = method.name;
			} else if ((method.action === "create")) {
				//clean creation form
				$("#new_method input[name='method_name']").val("");
				$("#method_types").val("");
				$("#new_method textarea[name='comment']").val("");
			}

			$("#methods").val(method_val);

			update_method(method_val);

		});
	});
}