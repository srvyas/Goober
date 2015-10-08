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
var CLIENT_SECRET = '_3nYx_ComyCHiEhsJ3RmnPY9mki0ctbIwgBx0qza';
var TWILIO_ACCOUNT_SID = 'AC4fb679f8f00d69d24b125cef3547b4d2';
var TWILIO_AUTH_TOKEN = '';


app.use(bodyParser());
app.use(bodyParser.json());

var lastNumber;

var client = new twilio.RestClient('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN');

function helper6(error, response, body) {
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
}

function helper5(err, data) {
	if (err) {
		console.log(err);
	} else {
		destLat = data.results[0].geometry.location.lat;
		destLong = data.results[0].geometry.location.lng;
		var reqURL = 'https://api.uber.com/v1/products?latitude=' + pickUpLat + '&longitude=' + pickUpLong;
		var options = {
			url: reqURL,
			headers: {
				'Authorization': 'Bearer ' + user.token
			}
		}
		requestdog(options, helper6);
	}
}


function helper4(err, user) {
	if (err) {
		throw err;
	} else {
		var pickup = messageBody.split(':')[0];
		var destination = messageBody.split(':')[1];
		var pickupLat;
		var pickupLong;
		var destLat;
		var destLong;
		geocoder.geocode(pickup, helper5);
	}
}


function helper3(request, response) {
	var senderNumber = request.body.From.split('+')[1];
	var messageBody = request.body.Body;
    var twiml = new twilio.TwimlResponse();
    User.findOne({ phone: senderNumber }, helper4);
		
    twiml.message('Hello from node.js!');
    
    // Render the TwiML response as XML
    response.type('text/xml');
    response.send(twiml.toString());
}

function helper2(error, response, body) {
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
}

function helper(req, res) {
	var auth_code = req.originalUrl.split('code=')[1];
	var phone = req.body.phoneNum;
	if (auth_code) { 
		//STEP 3 RECIEVE ACCESS TOKEN 
		console.log(auth_code);
		var postRequestObject = {
			client_secret: CLIENT_SECRET,
			client_id: CLIENT_ID,
			grant_type: 'authorization_code',
			redirect_uri: 'http://localhost:3000/uber',
			code: auth_code
		}
		requestdog({ url: "https://login.uber.com/oauth/token", method: "POST", form: postRequestObject}, helper2);
	}
};

mongoose.connect('', function(err) {
	if (err) {
		console.log(err);
	} else {
		console.log('Connected to the Database');
	}
});


app.get('/uber', helper);

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


app.post('/sms', helper3);

app.listen(3000, function(err) {
	if (err) {
		console.log(err);
	} else {
		console.log('LISTENING ON PORT 3000');
	}
});

