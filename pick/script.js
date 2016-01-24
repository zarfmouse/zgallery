jQuery(function($){
    $(document).ready(function() {
	var password = prompt("Password?");
	var changes = false;
	var my_uri = URI(location.href);
	var rest_uri = URI("../rest.cgi"+my_uri.path());
	$.getJSON(rest_uri.href(), function(slides_data) {
	    var slides = slides_data.slides;
	    $('head > title').text("Picker for "+slides_data.title);
	    $.each(slides,function(k,v) {
		var el = $(Mustache.render('<li><img title="{{image}}" src="../{{thumb}}" class="thumb" /><span class="spinner"><i class="fa fa-spinner fa-pulse"></i></span></li>', v));
		el.data("fullsize", "../"+v.image);
		el.data("index", k);
		if(v.active) {
		    el.addClass('picked');
		}
		
		var existing_tags = [];
		if("tags" in v) {
		    existing_tags = v.tags.map(function(x) {
			return { tag: x };
		    });
		}
		var tags = $(Mustache.render('<ul class="tags">{{#tags}}<li>{{tag}}</li>{{/tags}}</ul>', { tags: existing_tags }));
		function store_tags(ev,ui) {
		    if(!ui.duringInitialization) {
			v.tags = tags.tagit("assignedTags");
			changes = true;
		    }
		}
		tags.tagit({
		    afterTagAdded: store_tags,
		    afterTagRemoved: store_tags,
		    autocomplete: {
			source: function(request, response) {
			    rest_uri.search({mode: 'tags', 
					     q: request.term});
			    $.getJSON(rest_uri.href(), function(data) {
				response(data);
			    })
			}
		    }
		});
		el.append(tags);
		el.append($('<ul class="controls"><li class="rotate left"><i class="fa fa-rotate-left" /></li><li class="checked"><i class="fa fa-check-square-o" /></li><li class="unchecked"><i class="fa fa-square-o" /></li><li class="tag-toggle"><i class="fa fa-tag" /></li><li class="rotate right"><i class="fa fa-rotate-right" /></li></ul>'));
		$('#picker').append(el);
		$('.spinner').hide();
	    });

	    $('#picker > li .controls .tag-toggle').click(function(ev) {
		ev.stopPropagation();
		$(this).parents("#picker > li").children(".tags").toggleClass('visible');
	    });

	    $('#picker > li .rotate').click(function(ev) {
		ev.stopPropagation();
		var dir = 'left';
		if($(this).hasClass('right')) {
		    dir = 'right';
		}
		    
		var i = $(this).parents("#picker > li").data("index");
		rest_uri.search({mode: 'rotate',
				 direction: dir,
				 index: i,
				 password: password});
		var img = $(this).parents("#picker > li").children("img.thumb");
		var spinner = $(this).parents("#picker > li").children('.spinner');
		spinner.show();
		$.ajax(rest_uri.href(), 
		       {type: 'GET',
			success: function() {
			    var src = img.attr('src').split("?", 1);
			    img.attr('src', src+"?t="+(new Date).getTime());
			    spinner.hide();
			},
		       });
	    });

	    $('#picker > li').click(function(ev) {
		var tags = $(this).children(".tags");
		if($(ev.target).parents(".tags").length == 0) {
		    $(this).toggleClass('picked');
		    if($(this).hasClass('picked')) {
			slides_data.slides[$(this).data("index")].active = 1;
		    } else {
			slides_data.slides[$(this).data("index")].active = undefined;
		    }
		    changes = true;
		} 
		return false;
	    });

	    $('#picker li').dblclick(function(ev) {
		window.open($(this).data("fullsize"), '_blank');
	    });

	    var show_all = true;
	    $("#toggle-all-tags").click(function(ev) {
		if(show_all) {
		    $(".tags").addClass('visible');
		    show_all = false;
		} else {
		    $(".tags").removeClass('visible');
		    show_all = true;
		}
	    });

	    var running = false;
	    setInterval(function() {
		if(changes && !running) {
		    changes = false;
		    running = true;
		    rest_uri.search({password: password});
		    $.ajax(rest_uri.href(), 
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

