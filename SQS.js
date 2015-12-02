var AWS = require('aws-sdk');
var alchemy = require('./alchemyAPI.js');
var SNS = require('./SNS.js');

AWS.config.update({
    region: 'us-east-1'
});
var sqs = new AWS.SQS({
    apiVersion: '2012-11-05'
});

exports.queueInitiator = function() {
    var params = {
        QueueName: 'tweetQueue',
    };

    sqs.createQueue(params, function(err, data) {
        if (err) console.log(err, err.stack);
        else console.log('Message Queue initialised');
    });
}

exports.sendMessage = function(message, callback) {
    var params = {
        QueueName: 'tweetQueue'
    };
    sqs.getQueueUrl(params, function(err, data) {
        if (err) console.log(err, err.stack);
        else {
            Q_Url = data.QueueUrl;
            message.forEach(function(eachMessage) {
                var params = {
                    MessageBody: JSON.stringify(eachMessage), //.text,
                    QueueUrl: Q_Url,
                    DelaySeconds: 0
                };
                sqs.sendMessage(params, function(err, data) {
                    if (err) console.log(err, err.stack);
                    else console.log('Message pushed to Queue');
                });
            });
        }
        callback();
    });
}

var receiveMessage = exports.receiveMessage = function() { //callback) {
    var params = {
        QueueName: 'tweetQueue'
    };
    sqs.getQueueUrl(params, function(err, data) {
        if (err) console.log(err, err.stack);
        else {
            Q_Url = data.QueueUrl;
            var params = {
                QueueUrl: Q_Url,
                MaxNumberOfMessages: 10,
                VisibilityTimeout: 60,
                WaitTimeSeconds: 10
            };
            sqs.receiveMessage(params, function(err, messages) {
                if (err) console.log(err, err.stack);
                else {
                    if (messages.Messages && messages.Messages.length > 0) {
                        data = messages.Messages;
                        resultList = [];
                        var counter = 0;
                        data.forEach(function(d) {
                            var obj = JSON.parse(d.Body);
                            tweetObj = {};
                            tweetObj.text = obj.text;
                            tweetObj.lat = obj.coordinates.coordinates[0];
                            tweetObj.lng = obj.coordinates.coordinates[1];
                            tweetObj.sentiment = alchemy.alchemyAPI(tweetObj.text, function(sent) {
                                tweetObj.sentiment = sent;
                                SNS.publishMessageToTopic(tweetObj, function() {});
                                var params = {
                                    QueueUrl: Q_Url,
                                    ReceiptHandle: d.ReceiptHandle
                                };
                                sqs.deleteMessage(params, function(err, data) {
                                    if (err) console.log(err, err.stack);
                                    else {
                                        console.log('Messages Deleted from Queue')
                                    }
                                });
                                counter++;
                                if (counter == data.length) {
                                    receiveMessage();
                                    console.log('CALLING AGAIN');
                                }
                            });
                        });
                    } else {
                        receiveMessage();
                        console.log('CALLING AGAIN');
                    }
                }
            });
        }
    });
}
