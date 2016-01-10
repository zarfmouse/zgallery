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

    $(document).ready(function() {
	$("#slidebuy").hide();
	$("#slidefb").hide();

        $.getJSON('pick/rest.cgi', function(slides_data) {
            var slides = $.grep(slides_data.slides, function(o,i) {
		if(o.active) {
		    return true;
		} else {
		    return false;
		}
	    });

	    $('head > title').text(slides_data.title);

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

            $.supersized({
                slideshow:            1,      // Slideshow on/off
                autoplay:             1,      // Slideshow starts playing automatically
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
		location.hash = '#'+slide.image.replace(/^images\//, '');
		if("pass_id" in slide) {
		    var url = "http://gopho.pass.us/the-embers/i-"+slide.pass_id;
		    $("#slidebuy a").attr('href', url);
		    $("#slidebuy").show();
		} else {
		    $("#slidebuy").hide();
		}		

		if("fburl" in slide) {
		    $("#slidefb a").attr('href', slide.fburl);
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
