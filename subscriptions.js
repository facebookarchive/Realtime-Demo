var redis = require('redis'),
    fs = require('fs'),
    jade = require('jade'),
    io = require('socket.io'),
    settings = require('./settings'),
    app = settings.app,
    subscriptionPattern = 'channel:*',
    socket = io.listen(app);

// We use Redis's pattern subscribe command to listen for signals
// notifying us of new updates.

var r = redis.createClient(
    settings.REDIS_PORT,
    settings.REDIS_HOST);
r.psubscribe(subscriptionPattern);

r.on('pmessage', function(pattern, channel, message){
    
    /* Every time we receive a message, we check to see if it matches
       the subscription pattern. If it does, then go ahead and parse it. */

	if(pattern == subscriptionPattern){
	    try {
    		var data = JSON.parse(message)['data'];
    		
    		// Channel name is really just a 'humanized' version of a slug
    		// san-francisco turns into san francisco. Nothing fancy, just
    		// works.
    		var channelName = channel.split(':')[1].replace(/-/g, ' ');
	    } catch (e) {
	        return;
	    }
		
		// Store individual media JSON for retrieval by homepage later
		for(index in data){
		    var media = data[index];
		    media.meta = {};
		    media.meta.location = channelName;
			var r = redis.createClient(
			    settings.REDIS_PORT,
			    settings.REDIS_HOST);
			r.lpush('media:objects', JSON.stringify(media));
			r.quit();
		}
		
		// Send out whole update to the listeners
		var update = {
			'type': 'newMedia',
			'media': data,
			'channelName': channelName
		};
		for(sessionId in socket.clients){
			socket.clients[sessionId].send(JSON.stringify(update));
		}
	}
});