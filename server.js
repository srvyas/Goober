var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var requestdog = require('request');
var twilio = require('twilio');
var mongoose = require('mongoose');
var geocoder = require('geocoder');
var User = require('./user.js');


var app = express();

var CLIENT_ID = 'OawcXJ9-fI4AsAUlbgZXFwp_sYVNiOAT';
var SERVER_TOKEN = '';
var CLIENT_SECRET = '';
var TWILIO_ACCOUNT_SID = 'AC4fb679f8f00d69d24b125cef3547b4d2';
var TWILIO_AUTH_TOKEN = '';


app.use(bodyParser());
app.use(bodyParser.json());

var lastNumber;

var client = new twilio.RestClient('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN');


mongoose.connect('', function(err) {
	if (err) {
		console.log(err);
	} else {
		console.log('Connected to the Database');
	}
});


app.get('/uber', function(req, res) {
	//console.log(req.originalUrl);

	var auth_code = req.originalUrl.split('code=')[1];
	var phone = req.body.phoneNum;
	console.log(req.body);
	//console.log(auth_code);
	console.log("HERE DOG");
	if (auth_code) { 
		//STEP 3 RECIEVE ACCESS TOKEN 
		//console.log(redirectURL);	
		console.log(auth_code);
		var postRequestObject = {
			client_secret: CLIENT_SECRET,
			client_id: CLIENT_ID,
			grant_type: 'authorization_code',
			redirect_uri: 'http://localhost:3000/uber',
			code: auth_code
		}

		requestdog({
			url: "https://login.uber.com/oauth/token",
			method: "POST",
			form: postRequestObject
		}, function(error, response, body) {
			if (error) {
				console.log(error);
			} else {
				var uber_token = response.body.split('access_token')[1].substr(3,30);
				console.log(uber_token);
				var user = new User({
					phone: lastNum,
					token: uber_token
				});

				user.save(function(err) {
					if (err) {
						console.log(err);
					} else {
						res.send("SUCCESS");
					}
				});
			}
		});
	}

});

app.post('/form', function(req, res) {
	console.log("HERE AT FORM POST");
	console.log(req.body.phoneNum);
	lastNum = req.body.phoneNum;
	var redirectURL = 'https://login.uber.com/oauth/authorize?response_type=code&client_id='+ CLIENT_ID +'&scope=request&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fuber'
	console.log(redirectURL);
	res.redirect(redirectURL);


});	

app.get('/', function(req, res) {
	console.log('HERE');
});


app.post('/sms', function(request, response) {
	console.log("GOT SMS CALL");
	var senderNumber = request.body.From.split('+')[1];
	var messageBody = request.body.Body;
	console.log(senderNumber);
    var twiml = new twilio.TwimlResponse();
    User.findOne({ phone: senderNumber }, function(err, user) {
    	if (err) {
			throw err;
		} else {
			console.log("FOUND USER");
			var pickup = messageBody.split(':')[0];
			var destination = messageBody.split(':')[1];
			var pickupLat;
			var pickupLong;
			var destLat;
			var destLong;
			geocoder.geocode(pickup, function(err, data) {
				if (err) {
					console.log(err);
				} else {
					console.log("GEOCODER RESPONSE");
					pickUpLat = data.results[0].geometry.location.lat;
					pickUpLong = data.results[0].geometry.location.lng;
					console.log("PICKUP CORDS: " +  pickUpLat + ":" + pickUpLong);
					geocoder.geocode(destination, function(err, data) {
						if (err) {
							console.log(err);
						} else {
							console.log("GEOCODER RESPONSE");
							destLat = data.results[0].geometry.location.lat;
							destLong = data.results[0].geometry.location.lng;
							console.log("DEST CORDS: " +  destLat  + ":" + destLong);

							var reqURL = 'https://api.uber.com/v1/products?latitude=' + pickUpLat + '&longitude=' + pickUpLong;
							var options = {
								url: reqURL,
								headers: {
									'Authorization': 'Bearer ' + user.token
								}
							}
							console.log(user.token);

							requestdog(options, function(error, response, body) {
								if (error) { 
									console.log(error);
								} else {
									var productID = body.split("product_id")[1].substr(3,36);
									var postRequestObject2 = {
										product_id: productID,
										start_latitude: pickUpLat,
										start_longitude: pickUpLong,
										end_latitude: destLat,
										end_longitude: destLong
									}
									console.log("testing JSONness", JSON.stringify(postRequestObject2));
									requestdog({
										url: "https://api.uber.com/v1/requests?product_id=5791244c-faf8-4fd6-811e-ed7d2382dcd3&start_latitude=42.2913265&start_longitude=-83.7174028&end_latitude=42.2753227&end_longitude=-83.7333555",
										method: "POST",
										body: JSON.stringify(postRequestObject2),
										headers: {
											'Content-Type': 'application/json',
											'Authorization': 'Bearer ' + user.token
			
										}
									}, function(error, response, body) {
										console.log("HERE");
										console.log(body);



									});

									
								}
							});
						}
					});
				}
			});
		}
    });
		
    twiml.message('Hello from node.js!');
    
    // Render the TwiML response as XML
    response.type('text/xml');
    response.send(twiml.toString());
});

app.listen(3000, function(err) {
	if (err) {
		console.log(err);
	} else {
		console.log('LISTENING ON PORT 3000');
	}
});

