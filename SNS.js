var AWS = require('aws-sdk');
var http = require('http');
var SNSClient = require('aws-snsclient');

AWS.config.update({
    region: 'us-east-1'
});

var sns = new AWS.SNS({
    region: 'us-east-1'
});

var params = {
    Name: 'tweets'
};

sns.createTopic(params, function(err, data) {
    if (err) console.log(err, err.stack);
    else console.log('Topic created');
});

exports.publishMessageToTopic = function(message, callback) {
    var params = {
        Message: JSON.stringify(message),
        Subject: 'New tweet has arrived',
        TargetArn: "arn:aws:sns:us-east-1:812071873860:tweets"
    }
    sns.publish(params, function(err, data) {
        if (err) console.log(err, err.stack);
        else console.log("Publish happened");
    });
}
