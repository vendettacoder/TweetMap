var _ = require('underscore');
var r = require('rethinkdb');
var express = require('express');
var app = express();
var http = require('http'),
    server = http.createServer(app);
var AlchemyAPI = require('alchemy-api');
var alchemy = new AlchemyAPI('f40032114457c4706c22d2c6fb348dc2f4d62d13');
var alchem = require('./alchemyAPI.js');
var trends=require('./trends.js');
io = require('socket.io').listen(server);
var SNS = require('./SNS.js');
var SQS = require('./SQS.js');
SQS.queueInitiator();
SQS.receiveMessage();
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

    /*socket.on("start tweets", function(filter) {
        app.post('/newTweet', function(request, response) {
            var body = '';
            request.on('data', function(data) {
                body += data;
            });
            request.on('end', function() {
                var data = JSON.parse(body);
                message = data.Message;
                message = JSON.parse(message);
                var outputPoint = {
                    "lat": message.lat,
                    "lng": message.lng,
                    "sentiment": message.sentiment,
                    "text": message.text
                };
                console.log('outputPoint' + outputPoint['sentiment'] + outputPoint.text);
                socket.broadcast.emit("twitter-stream", outputPoint);
                socket.emit('twitter-stream', outputPoint);
            });

            response.status(200);
            response.send("received");
        });
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
                    alchem.alchemyAPI(data.text, function(sent) {
                        if (err) throw err;

                        if (sent != null)
                            var sentiment = sent;
                        else
                            sentiment = generate_str();
                        console.log(sentiment);

                        var outputPoint = {
                            "lat": data.coordinates.coordinates[0], //obj.lat,
                            "lng": data.coordinates.coordinates[1], //obj.lng,
                            "sentiment": sentiment, //obj.sentiment
                            "text": data.text //obj.text
                        };
                        socket.broadcast.emit("twitter-stream", outputPoint);
                        socket.emit('twitter-stream', outputPoint);
                    });
                });
            });

            r.db('tweetDB').table('tweetStreamNew').filter(function(tweet) {
                return tweet('text').match("(?i)" + filter)
            }).changes().run(live_connection).then(function(cursor) {
                cursor.each(function(err, data) {
                    console.log(data.new_val.text);
                    SQS.sendMessage([data.new_val], function() {});

                });
            });
        });
    });*/

    socket.on("start trends", function(trendList) {
        console.log('TREND LIST'+trendList);
    });

    // Emits signal to the client telling them that the
    // they are connected and can start receiving Tweets
    socket.emit("connected");
});
