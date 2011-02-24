var redis = require('redis');
var settings = require('./settings');

/*

    Each update that comes from Instagram merely tells us that there's new
    data to go fetch. The update does not include the data. So, we take the
    geography ID from the update, and make the call to the API.

*/

function processGeography(geoName, update){
	var path = '/v1/geographies/' + update.object_id + '/media/recent/';
	getMinID(geoName, function(error, minID){
		var queryString = "?client_id="+ settings.CLIENT_ID;
		if(minID){
			queryString += '&min_id=' + minID;
		} else {
		    // If this is the first update, just grab the most recent.
			queryString += '&count=1';
		}
		var options = {
			host: settings.apiHost,
			// Note that in all implementations, basePath will be ''. Here at
			// instagram, this aint true ;)
			path: settings.basePath + path + queryString
		};
		if(settings.apiPort){
		    options['port'] = settings.apiPort;
		}

        // Asynchronously ask the Instagram API for new media for a given
        // geography.
		settings.httpClient.get(options, function(response){
			var data = '';
			response.on('data', function(chunk){
				data += chunk;
			});
			response.on('end', function(){
			    try {
				    var parsedResponse = JSON.parse(data);
			    } catch (e) {
			        console.log('Couldn\'t parse data. Malformed?');
			        return;
			    }
				if(!parsedResponse || !parsedResponse['data']){
				    console.log('Did not receive data for ' + geoName +':');
				    console.log(data);
				    return;
				}
				setMinID(geoName, parsedResponse['data']);
				
				// Let all the redis listeners know that we've got new media.
				var r = redis.createClient(
				        settings.REDIS_PORT,
				        settings.REDIS_HOST);
				r.publish('channel:' + geoName, data);
				r.quit();
			});
		});
	});
}
exports.processGeography = processGeography;

function getMedia(callback){
    // This function gets the most recent media stored in redis
    var r = redis.createClient(settings.REDIS_PORT, settings.REDIS_HOST);
	r.lrange('media:objects', 0, 14, function(error, media){
	    // Parse each media JSON to send to callback
	    media = media.map(function(json){return JSON.parse(json);});
	    callback(error, media);
	});
	r.quit()
}
exports.getMedia = getMedia;

/*
    In order to only ask for the most recent media, we store the MAXIMUM ID
    of the media for every geography we've fetched. This way, when we get an
    update, we simply provide a min_id parameter to the Instagram API that
    fetches all media that have been posted *since* the min_id.
    
    You might notice there's a fatal flaw in this logic: We create
    media objects once your upload finishes, not when you click 'done' in the
    app. This means that if you take longer to press done than someone else
    who will trigger an update on your same geography, then we will skip
    over your media. Alas, this is a demo app, and I've had far too
    much red bull – so we'll live with it for the time being.
    
*/

function getMinID(geoName, callback){
	var r = redis.createClient(settings.REDIS_PORT, settings.REDIS_HOST);
	r.get('min-id:channel:' + geoName, callback);
	r.quit();
}
exports.getMinID = getMinID;

function setMinID(geoName, data){
    var sorted = data.sort(function(a, b){
        return parseInt(b.id) - parseInt(a.id);
    });
    var nextMinID;
    try {
        nextMinID = parseInt(sorted[0].id);
    	var r = redis.createClient(settings.REDIS_PORT, settings.REDIS_HOST);
    	r.set('min-id:channel:' + geoName, nextMinID);
    	r.quit();
    } catch (e) {
        console.log('Error parsing min ID');
        console.log(sorted);
    }
}
exports.setMinID = setMinID;