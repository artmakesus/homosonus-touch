'use strict'

// Configuration
const bUseOSC = false;
const bSimulate = true;
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
let mcuPorts = [];
let dataBuffer = new Buffer(0);

let frontHeights = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    backHeights  = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

// OSC
if (bUseOSC) {
	var oscClient = new osc.Client('127.0.0.1', 57120);
}

setInterval(findArduino, 1000);

function findArduino() {
	serialport.list(function(error, ports) {
		ports.forEach(function(port) {
			if (mcuPorts.length > 2) {
				return;
			}

			for (let i in mcuPorts) {
				if (mcuPorts[i].path == port.comName) {
					return;
				}
			}

			if (port.manufacturer && port.manufacturer.indexOf(mcuManufacturer) >= 0) {
				let mcuPort = new serialport.SerialPort(port.comName, {
					baudrate: 9600,
				});

				mcuPort.open(function(error) {
					if (error) {
						console.log(error);
						return;
					}

					console.log('Arduino connected');

					mcuPorts.push(mcuPort);

					mcuPort.on('data', function(data) {
						processData(data);
					});

					mcuPort.on('close', function(error) {
						if (error) {
							console.log(error);
							return;
						}

						console.log('Arduino disconnected');

						let mcuPortIndex = mcuPorts.indexOf(mcuPort);
						if (mcuPortIndex >= 0) {
							mcuPorts.splice(mcuPortIndex, 1);
						}
					});
				});
			}
		});
	});
}

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
	while (eolIndex >= 0 && eolIndex < 6) {
		startIndex = eolIndex + 2;
		eolIndex = dataBuffer.indexOf(EOL, startIndex);
	}

	// If EOL is at index >= 6, then the previous 6 bytes must be the data
	while (eolIndex >= startIndex + 6) {
		let index = dataBuffer.readInt16LE(eolIndex - 6);
		let distance = dataBuffer.readFloatLE(eolIndex - 4);
		console.log('index:', index, 'distance:', distance);

		// Send data to SuperCollider through OSC
		if (bUseOSC && bSimulate == false) {
			if (index >= 15) {
				oscClient.send('/front', index, normalizeDistance(distance));
			} else {
				oscClient.send('/back', index, normalizeDistance(distance));
			}
		} else {
			if (index >= 15) {
				frontHeights[index - 15] = normalizeDistance(distance);
			} else {
				backHeights[index] = normalizeDistance(distance);
			}
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

	app.get('/config', function(req, res) {
		res.send({
			bUseOSC: bUseOSC,
			bSimulate: bSimulate,
		});
	});

	if (bSimulate && bUseOSC) {
		app.post('/distances', function(req, res) {
			try {
				frontHeights = JSON.parse(req.body.frontHeights);
				backHeights = JSON.parse(req.body.backHeights);
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
} else {
	app.get('/distances', function(req, res) {
		res.send({
			frontHeights: frontHeights,
			backHeights: backHeights,
		});
	});
}

app.listen(8080, function() {
	console.log('Listening on port 8080');
});
