function update_project( project ) {
	var method = "";
	if (project == "") {
		$("#edit_project input[name='par_list']").val("");
		$("#edit_project input[name='par_val']").val("");
		$("#edit_project input[name='nthreads']").val("");
		$("#edit_project textarea[name='comment']").val("");
	} else {
		//getDescriptor
		$.get('/services/project/getDescriptor?project=' + project + '&method=' + method, function( data ) {
			var desc = data;
			$("#edit_project input[name='par_list']").val(desc.parameters.list);
			$("#edit_project input[name='par_val']").val(desc.parameters.default);
			$("#edit_project input[name='nthreads']").val(desc.threads);
			$("#edit_project textarea[name='comment']").val(desc.comment);
		});
	}
}

function manage_project(action) {

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