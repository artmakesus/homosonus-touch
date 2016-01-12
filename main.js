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
		let heights = JSON.parse(req.body.heights);
		for (let i = 0; i < heights.length; i++) {
			client.send('/data/' + i, heights[i]);
		}
	} catch (error) {
		console.log(error);
	}
	res.sendStatus(200);
});

app.listen(8080, function() {
	console.log('Listening on port 8080');
});
