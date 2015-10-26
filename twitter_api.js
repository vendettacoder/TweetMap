var _ = require('underscore');
var twitter = require('twitter');
var r = require('rethinkdb');
var config = require('./config');

var connection = null;
r.connect({
    host: '172.31.48.27',
    port: 28015
}, function(err, conn) {
    if (err) throw err;
    connection = conn;
    r.dbCreate('tweetDB').run(connection, function(err, callback) {
        r.db('tweetDB').tableCreate('tweetStreamNew').run(connection, function(err, callback) {
            var twitterClient = new twitter({
                consumer_key: config.twitterKeys.consumer_key,
                consumer_secret: config.twitterKeys.consumer_secret,
                access_token_key: config.twitterKeys.access_token_key,
                access_token_secret: config.twitterKeys.access_token_secret
            });

            trackvar = 'love,syria,football,cricket,sports,usa,india,tech,russia,microsoft,apple';
            twitterClient.stream('statuses/filter', {
                track: trackvar
            }, function(stream) {
                stream.on('data', function(tweet) {
                    if (tweet.geo != null && tweet.lang == 'en') {
                        r.db('tweetDB').table('tweetStreamNew').insert(tweet).run(connection, function(err, callback) {
                            console.log(tweet.text);
                            console.log('Stream documents successfully inserted in RethinkDB');
                        });
                    }
                });
                stream.on('error', function(error) {
                    console.log(error);
                });
            });
        });
    });
});
