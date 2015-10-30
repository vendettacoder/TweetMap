var liveTweets = new google.maps.MVCArray();
function initialize() {
  //Setup Google Map
  var myLatlng = new google.maps.LatLng("45.478294","9.123949");
  var patch_shape_style = [{"featureType": "all", "elementType": "all", "stylers": [{"visibility": "on"}] }, {"featureType": "all", "elementType": "geometry", "stylers": [{"color": "#4d1111"}, {"visibility": "on"}] }, {"featureType": "administrative", "elementType": "all", "stylers": [{"visibility": "off"}] }, {"featureType": "administrative", "elementType": "geometry", "stylers": [{"visibility": "off"}] }, {"featureType": "administrative", "elementType": "labels", "stylers": [{"visibility": "off"}] }, {"featureType": "administrative.country", "elementType": "geometry.stroke", "stylers": [{"color": "#ffffff"}] }, {"featureType": "administrative.province", "elementType": "geometry.stroke", "stylers": [{"color": "#ffffff"}] }, {"featureType": "administrative.locality", "elementType": "all", "stylers": [{"visibility": "on"}] }, {"featureType": "administrative.locality", "elementType": "geometry", "stylers": [{"visibility": "on"}] }, {"featureType": "administrative.locality", "elementType": "geometry.fill", "stylers": [{"visibility": "on"}] }, {"featureType": "administrative.locality", "elementType": "geometry.stroke", "stylers": [{"visibility": "on"}] }, {"featureType": "administrative.locality", "elementType": "labels.text", "stylers": [{"visibility": "off"}] }, {"featureType": "administrative.locality", "elementType": "labels.icon", "stylers": [{"visibility": "off"}] }, {"featureType": "administrative.neighborhood", "elementType": "all", "stylers": [{"visibility": "off"}] }, {"featureType": "administrative.neighborhood", "elementType": "geometry", "stylers": [{"visibility": "on"}] }, {"featureType": "landscape", "elementType": "all", "stylers": [{"visibility": "off"}] }, {"featureType": "landscape", "elementType": "geometry", "stylers": [{"visibility": "on"}, {"color": "#000000"}] }, {"featureType": "landscape", "elementType": "labels", "stylers": [{"visibility": "off"}] }, {"featureType": "landscape.man_made", "elementType": "all", "stylers": [{"visibility": "off"}] }, {"featureType": "landscape.man_made", "elementType": "labels", "stylers": [{"visibility": "off"}] }, {"featureType": "landscape.natural.landcover", "elementType": "all", "stylers": [{"visibility": "off"}, {"color": "#080000"}] }, {"featureType": "landscape.natural.landcover", "elementType": "labels", "stylers": [{"visibility": "off"}] }, {"featureType": "poi", "elementType": "all", "stylers": [{"visibility": "off"}] }, {"featureType": "poi", "elementType": "labels", "stylers": [{"visibility": "off"}] }, {"featureType": "road", "elementType": "geometry", "stylers": [{"visibility": "on"}, {"color": "#ffffff"}] }, {"featureType": "road", "elementType": "labels", "stylers": [{"visibility": "off"}] }, {"featureType": "transit", "elementType": "all", "stylers": [{"visibility": "off"}] }, {"featureType": "transit", "elementType": "geometry", "stylers": [{"visibility": "on"}, {"color": "#ffffff"}] }, {"featureType": "transit", "elementType": "labels", "stylers": [{"visibility": "off"}] }, {"featureType": "transit.station", "elementType": "all", "stylers": [{"visibility": "off"}] }, {"featureType": "water", "elementType": "all", "stylers": [{"visibility": "on"}, {"color": "#ffffff"}, {"saturation": "0"}] }, {"featureType": "water", "elementType": "geometry", "stylers": [{"visibility": "on"}, {"color": "#99d7e3"}] }, {"featureType": "water", "elementType": "labels", "stylers": [{"visibility": "off"}] }]

  var myOptions = {
    zoom: 2,
    center: myLatlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: google.maps.ControlPosition.LEFT_BOTTOM
    },
    styles: patch_shape_style
  };
  var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
  addDropDown(map);
  //Setup heat map and link to Twitter array we will append data to
  var heatmap;
  
  heatmap = new google.maps.visualization.HeatmapLayer({
  data: liveTweets,
  radius: 35
  });
  heatmap.setMap(map);
    if (io !== undefined) {
        // Storage for WebSocket connections
        var socket = io.connect('http://localhost:13685/');

        // This listens on the "twitter-steam" channel and data is 
        // received everytime a new tweet is receieved.
        socket.on('twitter-stream', function(data) {
             //console.log(data.sentiment.type);
             //console.log(data.text);
            // if(data.tweet.toLowerCase().indexOf(keyword) > -1)      {
            var sentiment_type = data.sentiment;
            //Add tweet to the heat map array.
            var tweetLocation = new google.maps.LatLng(data.lng, data.lat);
            liveTweets.push(tweetLocation);

            //Flash a dot onto the map quickly
            if(sentiment_type == "positive"){
            var image = "css/green_marker.png";
            var marker = new google.maps.Marker({
                position: tweetLocation,
                map: map,
                animation: google.maps.Animation.DROP,
                icon: image
            });
            }
            else if(sentiment_type == "neutral"){
            var image = "css/yellow_marker.png";
            var marker = new google.maps.Marker({
                position: tweetLocation,
                map: map,
                animation: google.maps.Animation.DROP,
                icon: image
            });
            }
            else{
            var image = "css/orange_marker1.png";
            var marker = new google.maps.Marker({
                position: tweetLocation,
                map: map,
                animation: google.maps.Animation.DROP,
                icon: image
            });
            }
            setTimeout(function() {
                marker.setMap(null);
            }, 4000);

            // }
        });

        // Listens for a success response from the server to 
        // say the connection was successful.
        socket.on("connected", function(r) {

            //Now that we are connected to the server let's tell 
            //the server we are ready to start receiving tweets.
            //socket.emit("start tweets");
        });
    }
}

function filter() {
    var filter_list = document.getElementById("keyword");
    var filter = filter_list.value;
    console.log(filter);
    var socket = io.connect('http://localhost:13685/');
     while(liveTweets.length > 0)
            {
              liveTweets.pop();
            }
            
    socket.emit("start tweets", filter);

}

 function addDropDown(map) {
        var dropdown = document.getElementById('dropdown-holder');
        map.controls[google.maps.ControlPosition.RIGHT_TOP].push(dropdown);
      }