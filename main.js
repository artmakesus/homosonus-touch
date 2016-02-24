'use strict'

// Configuration
const frameRate = 30;
const bUseOSC = false;
const bSimulate = false;
const nDistanceSensors = 30;
const fadeSpeed = 0.2;
const ambientFadeInSpeed = 0.2;
const ambientFadeOutSpeed = 1.4;

// Modules
const osc = require('node-osc');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const serialport = require('serialport');

// Serial Port
const mcuManufacturer = 'Arduino';
let mcuPorts = [];
let dataBuffer = new Buffer(0);

let now = 0, then = 0, delta = 0;

let frontHeights = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    backHeights  = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

// OSC
if (bUseOSC) {
	var client = new osc.Client('127.0.0.1', 57120);
}

// Volumes
if (!bSimulate) {
	var frontVolumes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	    backVolumes  = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		ambientVolume = 0;
}

function normalizeDistance(distance) {
	if (isNaN(distance)) {
		distance = 0;
	}
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
	if (eolIndex >= 0 && eolIndex < 6) {
		dataBuffer = dataBuffer.slice(eolIndex + 2);
		eolIndex = dataBuffer.indexOf(EOL, startIndex);
	}

	// If EOL is at index >= 6, then the previous 6 bytes must be the data
	while (eolIndex >= startIndex + 6) {
		let index = dataBuffer.readInt16LE(eolIndex - 6);
		let distance = normalizeDistance(dataBuffer.readFloatLE(eolIndex - 4));

		// Update front and back heights
		if (index >= 15 && index < 30) {
			frontHeights[index - 15] = distance;
		} else if (index >= 0 && index < 15) {
			backHeights[index] = distance;
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

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/config', function(req, res) {
	res.send({
		bUseOSC: bUseOSC,
		bSimulate: bSimulate,
	});
});

if (bSimulate) {
	if (bUseOSC) {
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
	setInterval(findArduino, 1000);
	setInterval(updateSuperCollider, 1000 / frameRate);

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

	function updateSuperCollider() {
		let isTouching = false;
		let touchingIndexes = [];

		// Update time
		if (then == 0) {
			then = Date.now();
		} else {
			then = now;
		}
		now = Date.now();
		delta = (now - then) * 0.001;

		// Check for touch
		for (let i = 0; i < frontHeights.length; i++) {
			if (frontHeights[i] > 0.2 && frontHeights[i] < 0.8 && backHeights[i] > 0.2 && backHeights[i] < 0.8) {
				isTouching = true;
				touchingIndexes.push(i);
			}
		}

		// Adjust sound volumes
		for (let i = 0; i < frontHeights.length; i++) {
			if ((isTouching == false || (isTouching && touchingIndexes.indexOf(i) >= 0)) && frontHeights[i] > 0.2 && frontHeights[i] < 0.8) {
				frontVolumes[i] = frontVolumes[i] + delta * fadeSpeed > 1 ? 1 : frontVolumes[i] + delta * fadeSpeed;
			} else {
				frontVolumes[i] = frontVolumes[i] - delta * fadeSpeed < 0 ? 0 : frontVolumes[i] - delta * fadeSpeed;
			}
		}
		for (let i = 0; i < backHeights.length; i++) {
			if ((isTouching == false || (isTouching && touchingIndexes.indexOf(i) >= 0)) &&
			    backHeights[i] > 0.2 && backHeights[i] < 0.2) {
				backVolumes[i] = (backVolumes[i] + delta * fadeSpeed) > 1 ? 1 : backVolumes[i] + delta * fadeSpeed;
			} else {
				backVolumes[i] = (backVolumes[i] - delta * fadeSpeed) < 0 ? 0 : backVolumes[i] - delta * fadeSpeed;
			}
		}

		if (isTouching) {
			ambientVolume = ambientVolume - delta < 0 ? 0 : ambientVolume - delta * ambientFadeOutSpeed;
		} else {
			ambientVolume = ambientVolume + delta > 1 ? 1 : ambientVolume + delta * ambientFadeInSpeed;
		}

	}

	app.get('/volumes', function(req, res) {
		console.log(
			frontVolumes[0].toFixed(2),
			frontVolumes[1].toFixed(2),
			frontVolumes[2].toFixed(2),
			frontVolumes[3].toFixed(2),
			frontVolumes[4].toFixed(2),
			frontVolumes[5].toFixed(2),
			frontVolumes[6].toFixed(2),
			frontVolumes[7].toFixed(2),
			frontVolumes[8].toFixed(2),
			frontVolumes[9].toFixed(2),
			frontVolumes[10].toFixed(2),
			frontVolumes[11].toFixed(2),
			frontVolumes[12].toFixed(2),
			frontVolumes[13].toFixed(2),
			frontVolumes[14].toFixed(2)
		);
		res.send({
			frontVolumes: frontVolumes,
			backVolumes: backVolumes,
			ambientVolume: ambientVolume,
		});
	});
}

app.listen(8080, function() {
	console.log('Listening on port 8080');
});
