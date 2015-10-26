var _ = require('underscore');
var r = require('rethinkdb');
var express = require('express');
var app = express();
var http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server);
require('./twitter_api.js');

//Use the default port (for beanstalk) or default to 8081 locally
server.listen(process.env.PORT || 13685);

//Setup rotuing for app
app.use(express.static(__dirname + '/public'));

//Create web sockets connection.
io.sockets.on('connection', function(socket) {
    socket.on("start tweets", function(filter) {
        live_connection = null;
        this.filter = filter;
      console.log('filter :'+ filter);
        r.connect({
            host: '172.31.48.27',
            port: 28015
        }, function(err, conn) {
            if (err) throw err;
            live_connection = conn;
            r.db('tweetDB').table('tweetStreamNew').filter(function (tweet){
            	return tweet('text').match("(?i)"+filter)
            }).run(live_connection).then(function(res_data) {
                res_data.each(function(err, data) {
                    //console.log(data.text);
                    var outputPoint = {
                        "lat": data.coordinates.coordinates[0],
                        "lng": data.coordinates.coordinates[1]
                    };
                    //console.log(outputPoint);
                    socket.broadcast.emit("twitter-stream", outputPoint);
                    //Send out to web sockets channel.
                    socket.emit('twitter-stream', outputPoint);
                });
            });

            r.db('tweetDB').table('tweetStreamNew').filter(function (tweet){
            	return tweet('text').match("(?i)"+filter)
            }).changes().run(live_connection).then(function(cursor) {
                cursor.each(function(err, data) {
                    console.log(data.new_val.text);
                    var outputPoint = {
                        "lat": data.new_val.coordinates.coordinates[0],
                        "lng": data.new_val.coordinates.coordinates[1]
                    };
                    //console.log("Output point changes" + outputPoint['lat'] + ' ' + outputPoint['lng']);
                    socket.broadcast.emit("twitter-stream", outputPoint);
                    //Send out to web sockets channel.			
                     socket.emit('twitter-stream', outputPoint);
                });

            });
        });
    });
    // Emits signal to the client telling them that the
    // they are connected and can start receiving Tweets
    socket.emit("connected");
});
