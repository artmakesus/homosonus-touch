'use strict';

var osc = require('node-osc');
var express = require('express');
var app = express();

var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });

var client = new osc.Client('localhost', 7070);

app.use(express.static(__dirname + '/public'));

app.post('/data', urlencodedParser, function(req, res) {
	try {
		var data = JSON.parse(req.body.data);
		for (let i = 0; i < data.length; i++) {
			client.send('/data/' + i, data[i], function() {
			});
		}
	} catch (error) {
		console.log(error);
	}
});

app.listen(8080, function() {
	console.log('Listening on port 8080');
});
