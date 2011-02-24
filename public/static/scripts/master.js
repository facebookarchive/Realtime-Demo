var socket = new io.Socket();

socket.on('message', function(update){ 
	var data = $.parseJSON(update);
	$(document).trigger(data);
});

var Media = {
    onNewMedia: function(ev) {
        $(ev.media).each(function(index, media){
            $('<img/>').attr('src', media.images.low_resolution.url).load(function(){
        		$newCube = $('<div class="cube in"><span class="location"></span><span class="channel"></span</div>');
        		$newCube.prepend(this);
        		$('.location', $newCube).html(media.location.name);
        		$('.channel', $newCube).html(media.meta.location);
        		var numChildren = $('#wrapper').children().length;
        		var index = Math.floor(Math.random() * numChildren);
        		var $container = $($('#wrapper').children()[index]);
        		var $oldCube = $('.cube', $container);
        		$container.addClass('animating').append($newCube);
        		$oldCube.addClass('out').bind('webkitAnimationEnd', function(){
        			$container.removeClass('animating');
        			$(this).remove();
        		});
        	}); 
        });
    },
    positionAll: function(){
        var columns = 5;
        var width = parseInt($('.container').css('width'));
    	$('.container').each(function(index, item){
    		$(item).css('top', 10+parseInt(index / columns) * width +'px')
    			   .css('left', 10+(index % columns) * width +'px');
    	});
    }
};

$(document).bind("newMedia", Media.onNewMedia)