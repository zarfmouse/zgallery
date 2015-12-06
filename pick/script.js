jQuery(function($){
    $(document).ready(function() {
	var password = prompt("Password?");
	var changes = false;
	$.getJSON("rest.cgi", function(slides_data) {
	    var slides = slides_data.slides;
	    slides_data.password = password;
	    $('head > title').text("Picker for "+slides_data.title);
	    $.each(slides,function(k,v) {
		var el = $(Mustache.render('<li><img title="{{image}}" src="../{{thumb}}" /></li>', v));
		el.data("fullsize", "../"+v.image);
		el.data("index", k);
		if(v.active) {
		    el.addClass('picked');
		}
		$('#picker').append(el);
	    });
	    
	    $('#picker li').click(function(ev) {
		console.log('picked');
		$(this).toggleClass('picked');
		if($(this).hasClass('picked')) {
		    slides_data.slides[$(this).data("index")].active = 1;
		} else {
		    slides_data.slides[$(this).data("index")].active = undefined;
		}
		changes = true;
	    });

	    $('#picker li').dblclick(function(ev) {
		console.log('dblpicked');
		window.open($(this).data("fullsize"), '_blank');
	    });

	    var running = false;
	    setInterval(function() {
		if(changes && !running) {
		    changes = false;
		    running = true;
		    $.ajax("rest.cgi", 
			   {data: JSON.stringify(slides_data),
			    type: 'POST',
			    contentType: 'application/json',
			    success: function() {
				running = false;
			    },
			   });
		}
	    }, 5000);
	});
    });
});

