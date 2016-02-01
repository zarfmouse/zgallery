jQuery(function($){

    // This hack replaces the deprecated/removed toggle() event in jQuery. 
    // http://stackoverflow.com/a/25150375
    $.fn.toggle=function(){
        var functions=arguments, iteration=0
        return this.click(function(){
            functions[iteration].call()
            iteration= (iteration+1) %functions.length
        })
    }

    function shuffle(array) {
	var currentIndex = array.length, temporaryValue, randomIndex;
	while (0 !== currentIndex) {
	    randomIndex = Math.floor(Math.random() * currentIndex);
	    currentIndex -= 1;
	    temporaryValue = array[currentIndex];
	    array[currentIndex] = array[randomIndex];
	    array[randomIndex] = temporaryValue;
	}
	return array;
    }

    $(document).ready(function() {
	$("#slidebuy").hide();
	$("#slidefb").hide();
	var my_uri = URI(location.href);
	var my_search = my_uri.search(true);
	var rest_uri = URI("rest.cgi"+my_uri.path());
	rest_uri.search({ active: 1 });
	$.getJSON(rest_uri.href(), function(slides_data) {
	    $('head > title').text(slides_data.title);
	    var slides = slides_data.slides;
	    if(my_search.random) {
		$("#slide-shuffle").addClass("active");
		var unshuffle_uri = URI(my_uri.href());
		unshuffle_uri.removeSearch("random");
		$("#slide-shuffle a").attr('href', unshuffle_uri.href());
		shuffle(slides);
	    }  else {
		var shuffle_uri = URI(my_uri.href());
		shuffle_uri.addSearch("random", 1);
		$("#slide-shuffle a").attr('href', shuffle_uri.href());
	    }
	    var index_hash = {};
	    var i = 1;
	    slides.forEach(function(slide) {
		index_hash[slide.image.replace(/^images\//, '')] = i++;
	    });

	    function parse_hash() {
		if(typeof location.hash !== 'undefined') {
		    var image = location.hash.substr(1);
		    var retval = index_hash[image];
		    if(retval >= 1 && retval <= slides.length) {
			return retval;
		    }
		}
		return 1;
	    }

	    var autoplay = my_search.pause ? 0 : 1;
            $.supersized({
                slideshow:            1,      // Slideshow on/off
                autoplay:             autoplay,      // Slideshow starts playing automatically
                start_slide:          parse_hash(), // Start slide (0 is random)
                stop_loop:            0,      // Pauses slideshow on last slide
                random:               0,      // Randomize slide order (Ignores start slide)
                slide_interval:       4000,   // Length between transitions
                transition:           1,      // 0-None, 1-Fade, 2-Slide Top, 3-Slide Right, 4-Slide Bottom, 5-Slide Left, 6-Carousel Right, 7-Carousel Left
                transition_speed:     750,   // Speed of transition
                new_window:           1,      // Image links open in new window/tab
                pause_hover:          0,      // Pause slideshow on hover
                keyboard_nav:         1,      // Keyboard navigation on/off
                performance:          2,      // 0-Normal, 1-Hybrid speed/quality, 2-Optimizes image quality, 3-Optimizes transition speed 
                image_protect:        0,      // Disables image dragging and right click with Javascript
                min_width:            0,      // Min width allowed (in pixels)
                min_height:           0,      // Min height allowed (in pixels)
                vertical_center:      1,      // Vertically center background
                horizontal_center:    1,      // Horizontally center background
                fit_always:           1,      // Image will never exceed browser width or height (Ignores min. dimensions)
                fit_portrait:         1,      // Portrait images will not exceed browser height
                fit_landscape:        1,      // Landscape images will not exceed browser width
                slide_links:          false,  // Individual links for each slide (Options: false, 'num', 'name', 'blank')
                thumb_links:          1,      // Individual thumb links for each slide
                thumbnail_navigation: 0,      // Thumbnail navigation
                slides:               slides, // Slideshow Images
                progress_bar:         0,      // Timer for each slide                                                   
                mouse_scrub:          0
            });
	    function initialize_slide(slide) {
		var new_location = URI(location.href);
		new_location.hash(slide.image.replace(/^images\//, ''));
		location.replace(new_location.href());
		if("buy_url" in slide) {
		    $("#slidebuy a").attr('href', slide.buy_url);
		    $("#slidebuy").show();
		} else {
		    $("#slidebuy").hide();
		}		

		if("fb_url" in slide) {
		    $("#slidefb a").attr('href', slide.fb_url);
		    $("#slidefb").show();
		} else {
		    $("#slidefb").hide();
		}		
	    }
	    initialize_slide(slides[vars.current_slide]);	    
	    $(window).on('hashchange', function() {
		// slide_start above, api.goTo(), and our
		// location.hash are all 1-indexed, but
		// vars.current_slide is 0-indexed.
		var slide = parse_hash();
		if(slide != (vars.current_slide+1)) {
		    api.goTo(slide);
		}
	    });
	    var old_theme_afterAnimation = theme.afterAnimation;
	    theme.afterAnimation = function() {
		old_theme_afterAnimation();
		initialize_slide(slides[vars.current_slide]);
	    }
	    
        });
    });
});
