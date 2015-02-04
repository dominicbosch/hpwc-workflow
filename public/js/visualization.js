"use strict";

$(document).ready(function() {

	//create handler for changing of configuraton
	$("#configs").change( function() {

		//clean output list
		$("#graphs").html("<option value=''>Choose An Experiment Output</option>");

		cleanOutputForm();

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
				});
			});
		}
	});

	//get outputs
	$("#graphs").change( function() {

		var output = $(this).val();
		update_output( output );
	});

	//when the project selected change, we read the value of parameters (user change)
	$("#projects").change( function() {

		//clean output list
		$("#graphs").html("<option value=''>Choose An Experiment Output</option>");

		cleanOutputForm();

		var project = $(this).val();
		update_project( project );
	});

	
	$("#fix_par").on( "change", function() {
		if ($(this).is(":checked")) {
			var n = $( "#exp_details td[name='parameters'] input:checked" ).length;
			if ( n > 1) {
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
			if ( n > 1) {
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
			if ( n > 1) {
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

function cleanOutputForm() {
	$("#exp_details td[name='parameters']").html("--");
	$("#exp_details td[name='methods']").html("--");
	$("#exp_details td[name='nthreads']").html("--");
	$("#exp_details td[name='nexecs']").html("--");
}

function update_output( output ) {
	if (output == "") {
		cleanOutputForm();
	} else {
		//getDescriptor
		$.get('/services/experiment/getDescriptor?&output=' + output, function( data ) {
			var params = data.parameters;
			var par_html = "";
			var methods = data.methods;
			var met_html = "";
			var nthreads = data.nthreads;
			var thr_html = "";
			var par_disabled = params.length === 1;
			var met_disabled = methods.length === 1;
			var thr_disabled = nthreads.length === 1;
			var i;
			//fill parameters

			var createListItem = function( item, isChecked, isDisabled ) {
				return '<label><input class="smallselector" type="checkbox" value="' + item + '" ' + 
					(isChecked ? 'checked ' : '') + (isDisabled ? 'disabled ' : '') + '>' + item + '</label>';
			};

			$('#fix_par').prop('disabled', par_disabled);
			$('#fix_met').prop('disabled', met_disabled);
			$('#fix_thr').prop('disabled', thr_disabled);

			//reset disabled
			par_disabled = met_disabled = thr_disabled = true;

			for (i = 0; i < params.length; i++) {
				par_html += createListItem( params[ i ], (i===0), par_disabled );
			}
			$("#exp_details td[name='parameters']").html(par_html);
		//	$("#exp_details td[name='parameters'] input").prop('disabled', true);
			//fill methods
			for (i = 0; i < methods.length; i++) {
				met_html += createListItem( methods[ i ], (i===0), met_disabled );
			}
			$("#exp_details td[name='methods']").html(met_html);
		//	$("#exp_details td[name='methods'] input").prop('disabled', true);
			//fill number of threads
			for (i = 0; i < nthreads.length; i++) {
				thr_html += createListItem( nthreads[ i ], (i===0), thr_disabled );
			}
			$("#exp_details td[name='nthreads']").html(thr_html);
		//	$("#exp_details td[name='nthreads'] input").prop('disabled', true);
			$("#exp_details td[name='nexecs']").html(data.executions);
		});
	}
}

function cleanProjectForm() {
	$("#project_details td[name='par_list']").html("--");
	$("#project_details td[name='comment']").html("--");
}

function update_project( project ) {
	if (project == "") {
		$.get('/services/session/cleanProject', function( data ) {
			cleanProjectForm();
		});
	} else {
		//getDescriptor
		$.get('/services/project/getDescriptor?project=' + project, function( data ) {
			var desc = data;
			$("#project_details td[name='par_list']").html(desc.parameters.list);
			$("#project_details td[name='comment']").html(desc.comment);

			$.get('/services/experiment/get', function( data ) {
				var output_string = '<option value="">Choose An Experiment Output</option>';
				if (data !== "") {
					data.forEach(function(outName) {
						var year = outName.substring(0,4);
						var month = outName.substring(4,6);
						var day = outName.substring(6,8);
						var hour = outName.substring(9,11);
						var minute = outName.substring(11,13);
						var output = day + '/' + month + '/' + year + ' at ' + hour + ':' + minute;
						output_string += '<option value="' + outName + '">' + output + '</option>';
					});
				}
				$('#graphs').html(output_string);
			});
		});
	}
}
