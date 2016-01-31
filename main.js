'use strict'

// Configuration
const bSimulate = false;
const nDistanceSensors = 30;

// Modules
const osc = require('node-osc');
const client = new osc.Client('localhost', 7070);
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const serialport = require('serialport');

// Serial Port
const mcuManufacturer = 'Arduino';
let mcuPort;
let dataBuffer = new Buffer(0);

// OSC
let oscClient = new osc.Client('127.0.0.1', 57120);

serialport.list(function(error, ports) {
	ports.forEach(function(port) {
		if (!mcuPort && port.manufacturer && port.manufacturer.indexOf(mcuManufacturer) >= 0) {
			mcuPort = new serialport.SerialPort(port.comName, {
				baudrate: 9600,
			});

			mcuPort.open(function(error) {
				if (error) {
					console.log(error);
					return;
				}

				console.log('Connected to Arduino');

				mcuPort.on('data', function(data) {
					processData(data);
				});
			});
		}
	});
});

function normalizeDistance(distance) {
	if (distance < 0.2) {
		distance = 0.2;
	} else if (distance > 1.5) {
		distance = 1.5;
	}
	return (distance - 0.2) / 1.3;
}

function processData(data) {
	const EOL = '\r\n';

	dataBuffer = Buffer.concat([dataBuffer, data]);

	let startIndex = 0;
	let eolIndex = dataBuffer.indexOf(EOL, startIndex);

	// If EOL is at index >= 6, then the previous 6 bytes must be the data
	while (eolIndex >= startIndex + 6) {
		let index = dataBuffer.readInt16LE(eolIndex - 6);
		let distance = dataBuffer.readFloatLE(eolIndex - 4);
		if (index == 0) {
			console.log('index:', index, 'distance:', distance);
		}

		// Send data to SuperCollider through OSC
		if (index >= 15) {
			oscClient.send('/front', index, normalizeDistance(distance));
		} else {
			oscClient.send('/back', index, normalizeDistance(distance));
		}

		startIndex = eolIndex + 2;
		eolIndex = dataBuffer.indexOf(EOL, startIndex);
	}

	// Keep incomplete data for the next round.
	let nLeftoverData = dataBuffer.length - startIndex;
	if (nLeftoverData >= 0) {
		let nextDataBuffer = new Buffer(nLeftoverData);
		dataBuffer.copy(nextDataBuffer, startIndex, 0, nLeftoverData);
		dataBuffer = nextDataBuffer;
	}
}

if (bSimulate) {
	app.use(express.static(__dirname + '/public'));
	app.use(bodyParser.urlencoded({ extended: false }));

	app.post('/data', function(req, res) {
		try {
			let frontHeights = JSON.parse(req.body.frontHeights);
			let backHeights = JSON.parse(req.body.backHeights);
			for (let i = 0; i < frontHeights.length; i++) {
				client.send('/front', i, frontHeights[i]);
			}
			for (let i = 0; i < backHeights.length; i++) {
				client.send('/back', i, backHeights[i]);
			}
		} catch (error) {
			console.log(error);
		}
		res.sendStatus(200);
	});
}

app.listen(8080, function() {
	console.log('Listening on port 8080');
});
