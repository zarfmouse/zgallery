jQuery(function($){
    $(document).ready(function() {
	var password = prompt("Password?");

	var changes = false;
	var my_uri = URI(location.href);
	var rest_uri = URI("../rest.cgi"+my_uri.path());
	var check_password_uri = URI(rest_uri.href());
	check_password_uri.search({mode: 'check_auth',
				   password: password});
	$.getJSON(check_password_uri.href(), function(ok_response) {
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
		    var title = $(Mustache.render('<input type="text" name="title" class="title" value="{{title}}" />', { title: v.title }));
		    el.append(title);
		    
		    el.append($('<ul class="controls"><li class="rotate left"><i class="fa fa-rotate-left" /></li><li class="checked"><i class="fa fa-check-square-o" /></li><li class="unchecked"><i class="fa fa-square-o" /></li><li class="tag-toggle"><i class="fa fa-tag" /></li><li class="title-toggle"><i class="fa fa-info-circle" /></li><li class="rotate right"><i class="fa fa-rotate-right" /></li></ul>'));
		    $('#picker').append(el);
		    $('.spinner').hide();
		});
		$('#picker').sortable({
		    update: function(ev, ui) {
			var new_slides = [];
			$('#picker > li').each(function(i, el) {
			    var index = $(this).data("index");
			    new_slides.push(slides[index]);
			});
			slides_data.slides = slides = new_slides;
			changes = true;
		    }
		});
		$('#picker').disableSelection();
		
		$('#picker > li .controls .tag-toggle').click(function(ev) {
		    ev.stopPropagation();
		    $(this).parents("#picker > li").children(".tags").toggleClass('visible');
		});
		
		$('#picker > li .controls .title-toggle').click(function(ev) {
		    ev.stopPropagation();
		    $(this).parents("#picker > li").children(".title").toggleClass('visible');
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
		    if($(ev.target).hasClass('thumb') || $(ev.target).parents().hasClass('checked') || $(ev.target).parents().hasClass('unchecked')) {
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
		
		$('#picker > li > .title').change(function(ev) {
		    var i = $(this).parents("#picker > li").data("index");
		    slides_data.slides[i].title = $(this).val();
		    changes = true;
		});
		
		$('#picker > li').dblclick(function(ev) {
		    if($(ev.target).hasClass('thumb')) {
			window.open($(this).data("fullsize"), '_blank');
		    }
		});
		
		var show_all_tags = true;
		$("#toggle-all-tags").click(function(ev) {
		    if(show_all_tags) {
			$(".tags").addClass('visible');
			show_all_tags = false;
		    } else {
			$(".tags").removeClass('visible');
			show_all_tags = true;
		    }
		});
		
		var show_all_titles = true;
		$("#toggle-all-titles").click(function(ev) {
		    if(show_all_titles) {
			$("#picker > li > .title").addClass('visible');
			show_all_titles = false;
		    } else {
			$("#picker > li > .title").removeClass('visible');
			show_all_titles = true;
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
	}).fail(function() {
	    alert("Invalid password.");
	});
    });
});

