var twitter = require('twitter');
var config = require('./config');
var geocoderProvider = 'google';
var httpAdapter = 'http';
var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter);

var twitterClient = new twitter({
    consumer_key: config.twitterKeys.consumer_key,
    consumer_secret: config.twitterKeys.consumer_secret,
    access_token_key: config.twitterKeys.access_token_key,
    access_token_secret: config.twitterKeys.access_token_secret
});

//exports.trendGetter = function(callback) {
twitterClient.get('trends/available', function(error, tweets, response) {
    if (error) throw error;
    var min = Math.min(10, tweets.length);
    trendAvailableList = []
    for (var i = 0; i < min; i++) {
        obj = {}
        obj.place = tweets[i].name;
        obj.country = tweets[i].country;
        obj.countryCode = tweets[i].countryCode;
        obj.woeid = tweets[i].woeid;
        trendAvailableList.push(obj);
    }

    trendAvailableList.forEach(function(eachLoc) {
        var addr = '';
        addr = addr + eachLoc.place + eachLoc.country;
        geocoder.geocode(addr)
            .then(function(res) {
                eachLoc.lat = res[0].latitude;
                eachLoc.lng = res[0].longitude;
                eachLoc.trendsList = []
                twitterClient.get('trends/place', {
                    id: eachLoc.woeid
                }, function(error, message, response) {
                    message[0]['trends'].forEach(function(eachTrend) {
                        eachLoc.trendsList.push(eachTrend.name);
                        console.log(eachTrend);

                    });

                });

            })
            .catch(function(err) {
                console.log('Error in geo locations');
            });

    });
});
//}
