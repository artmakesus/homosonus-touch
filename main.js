'use strict';

var osc = require('node-osc');
var client = new osc.Client('localhost', 7070);
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/data', function(req, res) {
	try {
		let frontHeights = JSON.parse(req.body.frontHeights);
		let backHeights = JSON.parse(req.body.backHeights);
		for (let i = 0; i < frontHeights.length; i++) {
			client.send('/front/' + i, frontHeights[i]);
		}
		for (let i = 0; i < backHeights.length; i++) {
			client.send('/back/' + i, backHeights[i]);
		}
	} catch (error) {
		console.log(error);
	}
	res.sendStatus(200);
});

app.listen(8080, function() {
	console.log('Listening on port 8080');
});
