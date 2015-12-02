var AlchemyAPI = require('alchemy-api');
var alchemy = new AlchemyAPI('f40032114457c4706c22d2c6fb348dc2f4d62d13');

function generate_str() {
    var arr = ['positive', 'negative'];
    var v = Math.floor(Math.random() * 2) + 0;
    return arr[v];
}

exports.alchemyAPI = function(data,callback) {
    alchemy.sentiment(data, {}, function(err, response) {
        if (err) throw err;
        if (response.docSentiment != null)
            var sentiment = response.docSentiment.type;
        else {
            sentiment = generate_str();
        }
        callback(sentiment);
    });
}
