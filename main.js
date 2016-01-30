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

// OSC
let oscClient = new osc.Client('127.0.0.1', 57120);

serialport.list(function(error, ports) {
	ports.forEach(function(port) {
		if (!mcuPort && port.manufacturer && port.manufacturer.indexOf(mcuManufacturer) >= 0) {
			mcuPort = new serialport.SerialPort(port.comName, {
				baudrate: 9600,
			});

			mcuPort.open(function(error) {
				mcuPort.on('data', function(data) {
					let startIndex = 0;
					let eolIndex = data.indexOf('\r\n', startIndex);
					while (eolIndex >= 0) {
						if (eolIndex - startIndex < 8) {
							continue;
						}

						let index = data.readInt16LE(startIndex += 2);
						let distanceInMeters = data.readFloatLE(startIndex += 4);
						startIndex += 2;
						eolIndex = data.indexOf('\r\n', startIndex);

						let nDistanceSensorsHalved = (nDistanceSensors * 0.5).toFixed(0);
						if (index >= nDistanceSensorsHalved) {
							oscClient.send('/front', index - nDistanceSensorsHalved, distanceInMeters);
						} else {
							oscClient.send('/back', index, distanceInMeters);
						}
					}
				});
			});
		}
	});
});

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
