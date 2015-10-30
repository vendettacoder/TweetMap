var _ = require('underscore');
var r = require('rethinkdb');
var express = require('express');
var app = express();
var http = require('http'),
    server = http.createServer(app);
var AlchemyAPI = require('alchemy-api');
var alchemy = new AlchemyAPI('f40032114457c4706c22d2c6fb348dc2f4d62d13');
io = require('socket.io').listen(server);

require('./twitter_api.js');

//Use the default port (for beanstalk) or default to 8081 locally
server.listen(process.env.PORT || 13685);

//Setup rotuing for app
app.use(express.static(__dirname + '/public'));

function generate_str() {
    var arr = ['positive', 'negative'];
    var v = Math.floor(Math.random() * 2) + 0;
    return arr[v];
}
//Create web sockets connection.
io.sockets.on('connection', function(socket) {
    socket.on("start tweets", function(filter) {
        live_connection = null;
        this.filter = filter;
        console.log('filter :' + filter);
        r.connect({
            host: 'localhost',
            port: 28015
        }, function(err, conn) {
            if (err) throw err;
            live_connection = conn;
            r.db('tweetDB').table('tweetStreamNew').filter(function(tweet) {
                return tweet('text').match("(?i)" + filter)
            }).run(live_connection).then(function(res_data) {
                res_data.each(function(err, data) {
                    //console.log(data.new_val.text);
                    alchemy.sentiment(data.text, {}, function(err, response) {
                        if (err) throw err;

                        if (response.docSentiment != null)
                            var sentiment = response.docSentiment.type;
                        else
                            sentiment = generate_str();
                        console.log(sentiment);
                        // Do something with data
                        //console.log(data.text);
                        var outputPoint = {
                            "lat": data.coordinates.coordinates[0],
                            "lng": data.coordinates.coordinates[1],
                            "sentiment": sentiment,
                            "text": data.text
                        };
                        //console.log(outputPoint);
                        socket.broadcast.emit("twitter-stream", outputPoint);
                        //Send out to web sockets channel.
                        socket.emit('twitter-stream', outputPoint);
                    });
                });
            });

            r.db('tweetDB').table('tweetStreamNew').filter(function(tweet) {
                return tweet('text').match("(?i)" + filter)
            }).changes().run(live_connection).then(function(cursor) {
                cursor.each(function(err, data) {
                    //console.log(data.new_val.text);
                    alchemy.sentiment(data.new_val.text, {}, function(err, response) {
                        if (err) throw err;

                        if (response.docSentiment != null)
                            var sentiment = response.docSentiment.type;
                        else
                            sentiment = generate_str();
                        console.log(sentiment);
                        // Do something with data
                        var outputPoint = {
                            "lat": data.new_val.coordinates.coordinates[0],
                            "lng": data.new_val.coordinates.coordinates[1],
                            "sentiment": sentiment,
                            "text": data.new_val.text
                        };
                        //console.log("Output point changes" + outputPoint['lat'] + ' ' + outputPoint['lng']);
                        socket.broadcast.emit("twitter-stream", outputPoint);
                        //Send out to web sockets channel.          
                        socket.emit('twitter-stream', outputPoint);
                    });
                });
            });
        });
    });
    // Emits signal to the client telling them that the
    // they are connected and can start receiving Tweets
    socket.emit("connected");
});
