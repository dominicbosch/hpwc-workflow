$(document).ready(function() {
	//editor
	$("#edit_button").click(function( event ){
		event.preventDefault();
    	$(".overlay").fadeToggle("fast");
  	});
	
	$(".close").click(function(){
		$(".overlay").fadeToggle("fast");
	});
	
	$(document).keyup(function(e) {
		if(e.keyCode == 27 && $(".overlay").css("display") != "none" ) {
			$(".overlay").fadeToggle("fast");
		}
	});
});
