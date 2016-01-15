jQuery(function($){
    $(document).ready(function() {
	var password = prompt("Password?");
	var changes = false;
	$.getJSON("rest.cgi", function(slides_data) {
	    var slides = slides_data.slides;
	    slides_data.password = password;
	    $('head > title').text("Picker for "+slides_data.title);
	    $.each(slides,function(k,v) {
		var el = $(Mustache.render('<li><img title="{{image}}" src="../{{thumb}}" class="thumb" /><span class="spinner"><i class="fa fa-spinner fa-pulse"></i></span></li>', v));
		el.data("fullsize", "../"+v.image);
		el.data("index", k);
		if(v.active) {
		    el.addClass('picked');
		}
		el.append($('<ul class="controls"><li class="rotate left"><i class="fa fa-rotate-left" /></li><li class="checked"><i class="fa fa-check-square-o" /></li><li class="unchecked"><i class="fa fa-square-o" /></li><li class="rotate right"><i class="fa fa-rotate-right" /></li></ul>'));
		$('#picker').append(el);
		$('.spinner').hide();
	    });

	    $('#picker > li .rotate').click(function(ev) {
		ev.stopPropagation();
		var dir = 'left';
		if($(this).hasClass('right')) {
		    dir = 'right';
		}

		var i = $(this).parents("#picker > li").data("index");
		var url = "rest.cgi?mode=rotate&direction="+dir+"&index="+i+"&password="+password;
		var img = $(this).parents("#picker > li").children("img.thumb");
		var spinner = $(this).parents("#picker > li").children('.spinner');
		spinner.show();
		$.ajax(url, 
		       {type: 'GET',
			success: function() {
			    var src = img.attr('src').split("?", 1);
			    img.attr('src', src+"?t="+(new Date).getTime());
			    spinner.hide();
			},
		       });
	    });

	    $('#picker > li').click(function(ev) {
		$(this).toggleClass('picked');
		if($(this).hasClass('picked')) {
		    slides_data.slides[$(this).data("index")].active = 1;
		} else {
		    slides_data.slides[$(this).data("index")].active = undefined;
		}
		changes = true;
		return false;
	    });

	    $('#picker li').dblclick(function(ev) {
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

