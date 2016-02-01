$( document ).ready( function() {
	
//ace editor actions start
	$( '.close' ).click( function() {
		$( '.overlay' ).fadeToggle( 'fast' );
		$( '#shadow' ).fadeToggle( 'fast' );
	});
	
	$( document ).keyup( function(e) {
		if ( e.keyCode === 27 && $( '.overlay' ).css( 'display' ) !== 'none' ) {
			$( '.overlay' ).fadeToggle( 'fast' );
			$( '#shadow' ).fadeToggle( 'fast' );
		}
	});
//ace editor actions finish

// //jstree editor actions start
// 	//$(function () { $('#jstree-workspace').jstree(); });
// 	//$( '#jstree-workspace' ).jstree();
	
// //	$( '#jstree-workspace' ).on( 'changed.jstree', function( e, data ) {
// //		alert('called');
// //		console.log( data.selected );
// //	}).jstree();
// 	var countRoots = 3;
// 	var countChildren = 2;
// 	var methodsFolder = [ "src", "out", "jobs", "bin" ];
// 	var files = [ "file1", "file2" ];
// 	$('#jstree-workspace').on( 'ready.jstree', function( e, data ) {
// 		//$( '.jstree-container-ul' ).prepend( 'WORKSPACE' );
// 	}).jstree({
// 		'core' : {
// 			'data' : function (obj, cb) {
// 				//alert(JSON.stringify(obj, null, 2));
// 				var JSONObj = [];
// 				var nodeType = ( obj.id === '#' 
// 									? null
// 									: obj.id.substring( 0, obj.id.indexOf("-") )
// 								);
// 				if ( nodeType === null ) {
// 					alert("reading projects");
// 					//get project from the list
// 					for (i = 0; i < countRoots; i++) {
// 						//JSONObj.push( { "id":"pjt-"+i, "parent":obj.id, "text":"Project"+i, "children":true} );
// 						JSONObj.push( { "id":"pjt-"+i, "text":"Project"+i, "children":true} );
// 					}
// 					//alert(JSON.stringify(JSONObj));
// 					cb.call( this, JSONObj );
// 				} else if ( nodeType ===  "pjt" ) {
// 					alert("reading methods of project: " + obj.text );
// 					for (i = 0; i < countChildren; i++) {
// 						//JSONObj.push( { "id":"mtd-"+i+"-"+obj.id, "parent":obj.id, "text":"Method"+i, "children":true } );
// 						JSONObj.push( { "id":"mtd-"+i+"-"+obj.id, "text":"Method"+i, "children":true } );
// 					}
// 					//alert(JSON.stringify(JSONObj));
// 					cb.call( this, JSONObj );
// 				} else if ( nodeType ===  "mtd" ) {
// 					alert("reading methods folders of method: " + obj.text );
// 					for (i = 0; i < methodsFolder.length; i++) {
// 						//JSONObj.push( { "id":methodsFolder[i]+"-"+obj.id, "parent":obj.id, "text":methodsFolder[i], "children":true } );
// 						JSONObj.push( { "id":methodsFolder[i]+"-"+obj.id, "text":methodsFolder[i], "children":true } );
// 						/*methodsFolderJSON[i].id += obj.id;
// 						methodsFolderJSON[i].parent = obj.id;*/
// 					}
// 					//alert(JSON.stringify(JSONObj));
// 					cb.call( this, JSONObj );
// 				} else {
// 					alert("getting file in folder: " + obj.text );
// 					cb.call( this, files );
// 				}
// /*				if ( obj.id === '#' ) {
// 					alert("reading projects");
// 					//get project from the list
// 					for (i = 0; i < countRoots; i++) {
// 						rootJSON.push( { "text" : "Root " + countRoots, "children" : true } );
// 					}
// 					countRoots++;
// 					alert(countRoots);
// 					cb.call( this, rootJSON );
// 				} else {
// 					alert("reading , parent: " + obj.text );
// 					for (i = 0; i < countChildren; i+=2) {
// 						childJSON.push( "Child " + (countChildren-1) , { "text" : "Child " + countChildren, "children" : ["One more"] } );
// 					}
// 					countChildren++;
// 					alert(countChildren);
// 					cb.call( this, childJSON );
// 				}*/
// 			}
// 		}
// 	});
// 	/*	'core' : {
// 			'data' : {
// 				'url' : function (node) {
// 					//alert( node.toString());
// 					return node.id === '#' ? 
// 						rootJSON : 
// 						childJSON;
// 				},
// 				'data' : function (node) {
// 					//alert( "2: " +node.toString());
// 					return { 'id' : node.id };
// 				}
// 			}
// 		}
// 	});*/
// //jstree editor actions finish

});

function setSrc() {

	var config_name = $( '#configs' ).val();
	if ( config_name === '' ) {
		alert( 'Select a Configuration' );
		return;
	}
	var project_name = $( '#projects' ).val();
	if ( project_name === '' ) {
		alert( 'Select a Project' );
		return;
	}

	var method_name = $( '#methods' ).val();
	if ( method_name === '' ) {
		alert( 'First select a method' );
		return;
	}

	var source_name = $( '#src_files' ).val();

	var content = editor.getSession().getValue();

	//alert( 'last: ' + content.lastIndexOf( '\n' ) + 'length: ' + content.length );
	if ( content.lastIndexOf( '\n' ) == content.length - 1 )
		content = content.substring( 0, content.length - 1 );
	
	var file = {
		content: content
	};

	$.post( '/services/method/setSrcFile/' 
		+ config_name + '/' 
		+ project_name + '/' 
		+ method_name + '/'
		+ source_name, file, function( ) {
	//	editor.getSession().setValue(source);
	//	event.preventDefault();
		$( '.overlay' ).fadeToggle( 'fast' );
		$( '#shadow' ).fadeToggle( 'fast' );
	});
}

function setUpFileTree( project_name, method_name, folder_name ) {

	var methodsFolder = [ "src", "out", "jobs", "bin" ];

	$('#jstree-workspace').on( 'ready.jstree', function( e, data ) {
		//$( '.jstree-container-ul' ).prepend( 'WORKSPACE' );
	}).jstree({
		'core' : {
			'data' : function (obj, cb) {
				//alert(JSON.stringify(obj, null, 2));
				var JSONObj = [];
				var nodeType = ( obj.id === '#' 
									? null
									: obj.id.substring( 0, obj.id.indexOf("-") )
								);
				if ( nodeType === null ) {
					alert("reading projects");
					alert($( '#projects option' )[1].value);
					//get project from the list
					JSONObj = createNodes( 'projects' );//createProjectNodes();
					//JSONObj = initializeTree();
					cb.call( this, JSONObj );
				} else if ( nodeType ===  "pjt" ) {
					alert("reading methods of project: " + obj.text );
					if ( obj.text === $( '#projects' ).val() ) {
						createMethodNodes( obj.id );
					} else {

					}
					
					JSONObj.push( obj );
					// for (i = 0; i < countChildren; i++) {
					// 	//JSONObj.push( { "id":"mtd-"+i+"-"+obj.id, "parent":obj.id, "text":"Method"+i, "children":true } );
					// 	JSONObj.push( { "id":"mtd-"+i+"-"+obj.id, "text":"Method"+i, "children":true } );
					// }
					// //alert(JSON.stringify(JSONObj));
					cb.call( this, JSONObj );
				} else if ( nodeType ===  "mtd" ) {
					alert("reading methods folders of method: " + obj.text );
					createMethodNodes( nodeJSON );
					for (i = 0; i < methodsFolder.length; i++) {
						//JSONObj.push( { "id":methodsFolder[i]+"-"+obj.id, "parent":obj.id, "text":methodsFolder[i], "children":true } );
						JSONObj.push( { "id":methodsFolder[i]+"-"+obj.id, "text":methodsFolder[i], "children":true } );
						/*methodsFolderJSON[i].id += obj.id;
						methodsFolderJSON[i].parent = obj.id;*/
					}
					//alert(JSON.stringify(JSONObj));
					cb.call( this, JSONObj );
				} else {
					alert("getting file in folder: " + obj.text );
					cb.call( this, files );
				}
			}
		}
	});
}

function selectValuesToArray ( id ) {
	var arrayValue = [];

	$( '#' + id + ' option' ).each( function( index ) {
		var value = $(this).val();
		if ( value !== '') {
			arrayValue.push( value );
		}
	});

	return arrayValue;
}

function initializeTree() { //reads projects and open the path of selected file
	var JSONObj = [];
	var projectsList = selectValuesToArray ( "projects" );

	for( var index in projectsList ) {
		var nodeJSON = {
			"id" : "pjt-" + index,
			"text" : projectsList[ index ]
		};

		if ( nodeJSON.text === $( '#projects' ).val() ) { //expand selected project
			nodeJSON.state = {
				"opened" : true
			}
			//read methods
			var methodsList = selectValuesToArray ( "methods" );
			nodeJSON.children = createMethodNodes( nodeJSON, methodsList );
		} else {
			nodeJSON.children = true;
		}
		JSONObj.push( nodeJSON );
	};

	return JSONObj;
}

function readProjectContent( parentNode, methodsList ) {

	var methodsFolder = [ "src", "out", "jobs", "bin" ];
	var JSONObj = [];

	var addMethodNodes = function( list ) {
		for( var index in list ) {
			var nodeJSON = {
				"id" : "mtd-" + index + "-" + parentNode.id,
				"text" : list[ index ]
			};

			if ( methodsList && ( nodeJSON.text === $( '#methods' ).val() ) ) { //expand selected methods if in initialization phase
				nodeJSON.state = {
					"opened" : true
				};
				nodeJSON.children = [];
				var fldIndex;
				for ( fldIndex = 0; fldIndex < methodsFolder.length; fldIndex++ ) {
					//if is the secected folder
					var nodeFolderJSON = {
						"id" : methodsFolder[ fldIndex ] + "-" + nodeJSON.id, 
						"text" : methodsFolder[ fldIndex ]
					};

					if ( methodsFolder[ fldIndex ] == $( '#folders' ).val() ) {
						nodeFolderJSON.state = {
							"opened" : true
						};

						//read files
						nodeFolderJSON.children = createFileNodes( 'src_files', nodeFolderJSON.id );

					} else {
						nodeFolderJSON.children = true;
					}

					nodeJSON.children.push( nodeFolderJSON );
				}

			} else {
				nodeJSON.children = true;
			}

			JSONObj.push( nodeJSON );
		};
	}

	if ( !methodsList ) { //read remote list
		var config_name = $( '#configs' ).val();
		if ( $( '#connectButton' ).text() !== 'Disconnect' ) {
			return;
		} else {
			var project_name = parentNode.text;

			$.get( '/services/method/getAll/' 
				+ config_name + '/'
				+ project_name, function( list ) {

					addMethodNodes( list );

			}).fail(function( xhr ) {
				console.log( xhr.responseText );
			});
		}
	} else {
		addMethodNodes( methodsList );
	}

	
	
	return JSONObj;
}

function readFolderContent( id, parentNodeId ) {
	
	var JSONObj = [];
	var list = selectValuesToArray ( id );

	for( var index in list ) {
		var nodeJSON = {
			"id" : "file-" + index + "-" + parentNodeId
			, "text" : list[ index ]
			, "icon" : "jstree-file"
			, "children" : false //file has no children
		};
		if ( nodeJSON.text === $( '#' + id ).val() ) {
			nodeJSON.state = {
				"opened" : true
				, "selected" : true
			};
		}
		JSONObj.push( nodeJSON );
	};

	return JSONObj;
}

function createProjectNodes( list ) {

	var JSONObj = [];

	for( var index in list ) {
		var nodeJSON = {
			"id" : "pjt-" + index,
			"text" : list[ index ]
		};

		if ( nodeJSON.text === $( '#projects' ).val() ) {
			nodeJSON.state = {
				"opened" : true
			//	, "disabled" : false //false by default
			//	, "selected" : true
			}
			//read methods
			nodeJSON.children = createMethodNodes( nodeJSON.id );
		} else {
			nodeJSON.children = true;
		}
		JSONObj.push( nodeJSON );
	};

	return JSONObj;
}


function createNodes( id ) { //id of what you want to read

	var JSONObj = [];

	var list = selectValuesToArray ( id );

	for( var index in list ) {
		var nodeJSON = {
			"id" : id.substr(0, 3) + "-" + index,
			"text" : list[ index ]
		};

		if ( nodeJSON.text === $( '#' + id ).val() ) { //if is the node selected in the page, get children from page also
			nodeJSON.state = {
				"opened" : true
			}
			nodeJSON.children = createMethodNodes( 'methods', nodeJSON.id );
		} else {
			nodeJSON.children = true;
		}
		JSONObj.push( nodeJSON );
	};

	return JSONObj;
}

function createProjectNodesOld() {

	var JSONObj = [];

	$( '#projects option' ).each( function( index ) {
		var project = $(this).val();
		if ( project !== '') {
			var nodeJSON = {
				"id" : "pjt-" + index,
				"text" : project
			};

			if ( $(this).is(':selected') ) {
				nodeJSON.state = {
					"opened" : true
				//	, "disabled" : false //false by default
				//	, "selected" : true
				}
				//read methods
				nodeJSON.children = createMethodNodes( nodeJSON.id );
			} else {
				nodeJSON.children = true;
			}
			JSONObj.push( nodeJSON );
		}
	});

	return JSONObj;
}

function createMethodNodes( parentNodeId ) {

	var JSONObj = [];

	$( '#methods option' ).each( function( index ) {
		var methodsFolder = [ "src", "out", "jobs", "bin" ];
		var method = $(this).val();
		if ( method !== '' ) {
			var nodeJSON = {
				"id" : "mtd-" + index + "-" + parentNodeId,
				"text" : method
			};

			if ( $(this).is( ':selected' ) ) {
				nodeJSON.state = {
					"opened" : true
				//	, "disabled" : false //false by default
				//	, "selected" : true
				};
				nodeJSON.children = [];
				var fldIndex;
				for ( fldIndex = 0; fldIndex < methodsFolder.length; fldIndex++ ) {
					//if is the secected folder
					var nodeFolderJSON = {
						"id" : methodsFolder[ fldIndex ] + "-" + nodeJSON.id, 
						"text" : methodsFolder[ fldIndex ]
					};

					if ( methodsFolder[ fldIndex ] == $( '#folders' ).val() ) {
						nodeFolderJSON.state = {
							"opened" : true
						//	, "disabled" : false //false by default
						//	, "selected" : true
						};

						//read files
						nodeFolderJSON.children = createFileNodes( nodeFolderJSON.id );

					} else {
						nodeFolderJSON.children = true;
					}

					nodeJSON.children.push( nodeFolderJSON );
				}

			} else {
				nodeJSON.children = true;
			}

			JSONObj.push( nodeJSON );
		}
	});
	
	return JSONObj;
}

function createFileNodes( parentNodeId ) {
	
	var JSONObj = [];

	$( '#src_files option' ).each( function( index ) {
		var file = $(this).val();
		if ( file !== '' ) {
			var nodeJSON = {
				"id" : "file-" + index + "-" + parentNodeId
				, "text" : file
				, "icon" : "jstree-file"
				, "children" : false //file has no children
			};
			if ( $(this).is( ':selected' ) ) {
				nodeJSON.state = {
					"opened" : true
				//	, "disabled" : false //false by default
					, "selected" : true
				};
			}
			JSONObj.push( nodeJSON );
		}
	});

	return JSONObj;
}

function setUpFileTree_v2( project_name, method_name, folder_name ) {

	var methodsFolder = [ "src", "out", "jobs", "bin" ];

	$('#jstree-workspace').on( 'ready.jstree', function( e, data ) {
		//$( '.jstree-container-ul' ).prepend( 'WORKSPACE' );
	}).jstree({
		'core' : {
			'data' : function (obj, cb) {
				//alert(JSON.stringify(obj, null, 2));
				var JSONObj = [];
				var nodeType = ( obj.id === '#' 
									? null
									: obj.id.substring( 0, obj.id.indexOf("-") )
								);
				if ( nodeType === null ) {
					alert("reading projects");
					//get project from the list
					$( '#projects option' ).each( addProjectNodes( JSONObj ) );
					cb.call( this, JSONObj );
				} else if ( nodeType ===  "pjt" ) {
					alert("reading methods of project: " + obj.text );
					for (i = 0; i < countChildren; i++) {
						//JSONObj.push( { "id":"mtd-"+i+"-"+obj.id, "parent":obj.id, "text":"Method"+i, "children":true } );
						JSONObj.push( { "id":"mtd-"+i+"-"+obj.id, "text":"Method"+i, "children":true } );
					}
					//alert(JSON.stringify(JSONObj));
					cb.call( this, JSONObj );
				} else if ( nodeType ===  "mtd" ) {
					alert("reading methods folders of method: " + obj.text );
					for (i = 0; i < methodsFolder.length; i++) {
						//JSONObj.push( { "id":methodsFolder[i]+"-"+obj.id, "parent":obj.id, "text":methodsFolder[i], "children":true } );
						JSONObj.push( { "id":methodsFolder[i]+"-"+obj.id, "text":methodsFolder[i], "children":true } );
						/*methodsFolderJSON[i].id += obj.id;
						methodsFolderJSON[i].parent = obj.id;*/
					}
					//alert(JSON.stringify(JSONObj));
					cb.call( this, JSONObj );
				} else {
					alert("getting file in folder: " + obj.text );
					cb.call( this, files );
				}
			}
		}
	});
}

addProjectNodes = function( parentNode ) {
	return function( index ) {
		var text = $(this).val();
		if ( text !== '') {
			var nodeJSON = {
				"id" : "pjt-" + index,
				"text" : text
			};

			if ( $(this).is(':selected') ) {
				nodeJSON.state = {
					"opened" : true
					, "disabled" : false
				//	, "selected" : true
				}
				nodeJSON.children = [];
				//read methods
				$( '#methods option' ).each( addMethodNodes( nodeJSON ) );
			} else {
				nodeJSON.children = true;
			}
			parentNode.push( nodeJSON );
		}
	}
}

addMethodNodes = function( parentNode ) {

	return function( index ) {
		var methodsFolder = [ "src", "out", "jobs", "bin" ];
		var method = $(this).val();
		if ( method !== '' ) {
			var nodeJSON = {
				"id" : "mtd-" + index + "-" + parentNode.id,
				"text" : method
			};

			if ( $(this).is( ':selected' ) ) {
				nodeJSON.state = {
					"opened" : true
					, "disabled" : false
				//	, "selected" : true
				};
				nodeJSON.children = [];
				var fldIndex;
				for ( fldIndex = 0; fldIndex < methodsFolder.length; fldIndex++ ) {
					//if is the secected folder
					var nodeFolderJSON = {
						"id" : methodsFolder[ fldIndex ] + "-" + nodeJSON.id, 
						"text" : methodsFolder[ fldIndex ]
					};

					if ( methodsFolder[ fldIndex ] == $( '#folders' ).val() ) {
						nodeFolderJSON.state = {
							"opened" : true
							, "disabled" : false
						//	, "selected" : true
						};
						nodeFolderJSON.children = [];
						$( '#src_files option' ).each( addFileNodes( nodeFolderJSON ) );
					} else {
						nodeFolderJSON.children = true;
					}

					nodeJSON.children.push( nodeFolderJSON );
				}

			} else {
				nodeJSON.children = true;
			}

			parentNode.children.push( nodeJSON );
		}
	}
}

addFileNodes = function( parentNode ) {
	
	return function( index ) {
		var file = $(this).val();
		if ( file !== '' ) {
			var nodeJSON = {
				"id" : "file-" + index + "-" + parentNode.id
				, "text" : file
				, "icon" : "jstree-file"
				, "children" : false //file has no children
			};
			if ( $(this).is( ':selected' ) ) {
				nodeJSON.state = {
					"opened" : true,
					"disabled" : false,
					"selected" : true
				};
			}
			parentNode.children.push( nodeJSON );
		}
	}
}

function setUpFileTreeOld( project_name, method_name, folder_name ) {

//	var projectsList = $( '#projects option' ).not( "[value='']" ).val();
//	var methodsList = $( '#methods option' ).not( "[value='']" ).val();
	//var projectsList = $( '#projects option' ).val();
	var methodsList = $( '#methods option' ).val();
//	alert(JSON.stringify(projectsList, null, 2));
	alert(methodsList);
	var countRoots = 3;
	var countChildren = 2;
	var methodsFolder = [ "src", "out", "jobs", "bin" ];
	var files = [ "file1", "file2" ];
	$('#jstree-workspace').on( 'ready.jstree', function( e, data ) {
		//$( '.jstree-container-ul' ).prepend( 'WORKSPACE' );
	}).jstree({
		'core' : {
			'data' : function (obj, cb) {
				//alert(JSON.stringify(obj, null, 2));
				var JSONObj = [];
				var nodeType = ( obj.id === '#' 
									? null
									: obj.id.substring( 0, obj.id.indexOf("-") )
								);
				if ( nodeType === null ) {
					alert("reading projects");
					//get project from the list
					$( '#projects option' ).each( function( pjtIndex ) {

						var project = $(this).val();
						if ( project !== '') {
							var nodeProjectJSON = {
								"id" : "pjt-" + pjtIndex,
								"text" : project
							};

							if ( $(this).is(':selected') ) {
								nodeProjectJSON.state = {
									"opened" : true
									, "disabled" : false
								//	, "selected" : true
								}
								nodeProjectJSON.children = [];
								//read methods
								$( '#methods option' ).each( function( mtdIndex ) {
									var method = $(this).val();
									if ( method !== '' ) {
										var nodeMethodJSON = {
											"id" : "mtd-" + mtdIndex + "-" + nodeProjectJSON.id,
											"text" : method
										};

										if ( $(this).is( ':selected' ) ) {
											nodeMethodJSON.state = {
												"opened" : true
												, "disabled" : false
											//	, "selected" : true
											};
											nodeMethodJSON.children = [];
											var fldIndex;
											for ( fldIndex = 0; fldIndex < methodsFolder.length; fldIndex++ ) {
												//if is the secected folder
												var nodeFolderJSON = {
													"id" : methodsFolder[ fldIndex ] + "-" + nodeMethodJSON.id, 
													"text" : methodsFolder[ fldIndex ]
												};

												if ( methodsFolder[ fldIndex ] == $( '#folders' ).val() ) {
													nodeFolderJSON.state = {
														"opened" : true
														, "disabled" : false
													//	, "selected" : true
													};
													nodeFolderJSON.children = [];
													$( '#src_files option' ).each( function( fileIndex ) {
														var file = $(this).val();
														if ( file !== '' ) {
															var nodeFileJSON = {
																"id" : "file-" + fileIndex + "-" + nodeFolderJSON.id
																, "text" : file
																, "icon" : "jstree-file"
																, "children" : false //file has no children
															};
															if ( $(this).is( ':selected' ) ) {
																nodeFileJSON.state = {
																	"opened" : true,
																	"disabled" : false,
																	"selected" : true
																};
															}
															nodeFolderJSON.children.push( nodeFileJSON );
														}
													});
												} else {
													nodeFolderJSON.children = true;
												}

												nodeMethodJSON.children.push( nodeFolderJSON );
											}

										} else {
											nodeMethodJSON.children = true;
										}

										nodeProjectJSON.children.push( nodeMethodJSON );
									}
								});
							} else {
								nodeProjectJSON.children = true;
							}
							JSONObj.push( nodeProjectJSON );
						}
					});
					//alert($( '#projects' ).val());
					/*for (i = 0; i < countRoots; i++) {
						//JSONObj.push( { "id":"pjt-"+i, "parent":obj.id, "text":"Project"+i, "children":true} );
						JSONObj.push( { "id":"pjt-"+i, "text":"Project"+i, "children":true} );
					}*/
					//alert(JSON.stringify(JSONObj));
					cb.call( this, JSONObj );
				} else if ( nodeType ===  "pjt" ) {
					alert("reading methods of project: " + obj.text );
					for (i = 0; i < countChildren; i++) {
						//JSONObj.push( { "id":"mtd-"+i+"-"+obj.id, "parent":obj.id, "text":"Method"+i, "children":true } );
						JSONObj.push( { "id":"mtd-"+i+"-"+obj.id, "text":"Method"+i, "children":true } );
					}
					//alert(JSON.stringify(JSONObj));
					cb.call( this, JSONObj );
				} else if ( nodeType ===  "mtd" ) {
					alert("reading methods folders of method: " + obj.text );
					for (i = 0; i < methodsFolder.length; i++) {
						//JSONObj.push( { "id":methodsFolder[i]+"-"+obj.id, "parent":obj.id, "text":methodsFolder[i], "children":true } );
						JSONObj.push( { "id":methodsFolder[i]+"-"+obj.id, "text":methodsFolder[i], "children":true } );
						/*methodsFolderJSON[i].id += obj.id;
						methodsFolderJSON[i].parent = obj.id;*/
					}
					//alert(JSON.stringify(JSONObj));
					cb.call( this, JSONObj );
				} else {
					alert("getting file in folder: " + obj.text );
					cb.call( this, files );
				}
			}
		}
	});
}

function getRemoteSrc( event ) {

	var t0 = performance.now();
	var config_name = $( '#configs' ).val();
	if ( config_name === '' ) {
		alert( 'Select a Configuration' );
		return;
	}
	var project_name = $( '#projects' ).val();
	if ( project_name === '' ) {
		alert( 'Select a Project' );
		return;
	}

	var method_name = $( '#methods' ).val();
	if ( method_name === '' ) {
		alert( 'First select a method' );
		return;
	}
	var folder_name = $( '#folders' ).val();
	if ( folder_name === '' ) {
		alert( 'First select a folder' );
		return;
	}
	var t1 = performance.now();
	console.log('Took', (t1 - t0).toFixed(4), 'milliseconds' );
	setUpFileTree( project_name, method_name, folder_name );
	t0 = performance.now();
	console.log('Took2', (t0 - t1).toFixed(4), 'milliseconds' );

	var source_name = $( '#src_files' ).val();
	$.get( '/services/method/getSrcFile/' 
		+ config_name + '/' 
		+ project_name + '/' 
		+ method_name + '/'
		+ folder_name + '/'
		+ source_name, function( source ) {
			t1 = performance.now();
			console.log('Took3', (t1 - t0).toFixed(4), 'milliseconds' );
		editor.getSession().setValue(source);
		event.preventDefault();
		//set title
		$( '#src_title' ).html( '<label>Filename: ' + source_name + '</label>' );
		//$( '#remoteHost' ).text( $( '#conf_table td[name="host"]').text() );
		$( '.overlay' ).fadeToggle( 'fast' );
		$( '#shadow' ).fadeToggle( 'fast' );
	});
}

/*function getRemoteSrc( event ) {

	var config_name = $( '#configs' ).val();
	if ( config_name === '' ) {
		alert( 'Select a Configuration' );
		return;
	}
	var project_name = $( '#projects' ).val();
	if ( project_name === '' ) {
		alert( 'Select a Project' );
		return;
	}

	var method_name = $( '#methods' ).val();
	if ( method_name === '' ) {
		alert( 'First select a method' );
		return;
	}
	var folder_name = $( '#folders' ).val();
	if ( folder_name === '' ) {
		alert( 'First select a folder' );
		return;
	}

	var source_name = $( '#src_files' ).val();
	$.get( '/services/method/getSrcFile/' 
		+ config_name + '/' 
		+ project_name + '/' 
		+ method_name + '/'
		+ folder_name + '/'
		+ source_name, function( source ) {
		editor.getSession().setValue(source);
		event.preventDefault();
		$( '.overlay' ).fadeToggle( 'fast' );
		$( '#shadow' ).fadeToggle( 'fast' );
	});
}*/