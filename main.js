// Configuration
var frameRate = 30;
var bUseOSC = true;
var bSimulate = false;
var nDistanceSensors = 30;
var fadeSpeed = 0.2;
var ambientFadeInSpeed = 0.2;
var ambientFadeOutSpeed = 1.4;

// Modules
var osc = require('node-osc');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var serialport = require('serialport');

// Serial Port
var mcuManufacturer = 'Arduino';
var mcuPorts = [];
var dataBuffer = new Buffer(0);

var now = 0, then = 0, delta = 0;

var frontHeights = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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
	var EOL = '\r\n';

	// Append incoming data to working buffer
	dataBuffer = Buffer.concat([dataBuffer, data]);

	// Find the first EOL
	var startIndex = 0;
	var eolIndex = dataBuffer.indexOf(EOL, startIndex);

	// If EOL is before the 6th index, look for the next one.
	// This is because 6 bytes of data needs to appear before EOL.
	if (eolIndex >= 0 && eolIndex < 6) {
		dataBuffer = dataBuffer.slice(eolIndex + 2);
		eolIndex = dataBuffer.indexOf(EOL, startIndex);
	}

	// If EOL is at index >= 6, then the previous 6 bytes must be the data
	while (eolIndex >= startIndex + 6) {
		var index = dataBuffer.readInt16LE(eolIndex - 6);
		var distance = dataBuffer.readFloatLE(eolIndex - 4);
		var normalizedDistance = normalizeDistance(distance);

		// Update front and back heights
		if (index >= 15 && index < 30) {
			frontHeights[index - 15] = normalizedDistance;
		} else if (index >= 0 && index < 15) {
			backHeights[index] = normalizedDistance;
		}

		startIndex = eolIndex + 2;
		eolIndex = dataBuffer.indexOf(EOL, startIndex);
	}

	// Keep incomplete buffer for the next round.
	var nLeftoverData = dataBuffer.length - startIndex;
	if (nLeftoverData >= 0) {
		var nextDataBuffer = new Buffer(nLeftoverData);
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
			frontHeights = JSON.parse(req.body.frontHeights);
			backHeights = JSON.parse(req.body.backHeights);
			for (var i = 0; i < frontHeights.length; i++) {
				client.send('/front', i, frontHeights[i]);
			}
			for (var i = 0; i < backHeights.length; i++) {
				client.send('/back', i, backHeights[i]);
			}
			res.sendStatus(200);
		});
	}
} else {
	setInterval(findArduino, 1000);
	setInterval(updateOSC, 1000 / frameRate);

	function findArduino() {
		serialport.list(function(error, ports) {
			ports.forEach(function(port) {
				if (mcuPorts.length > 2) {
					return;
				}

				for (var i in mcuPorts) {
					if (mcuPorts[i].path == port.comName) {
						return;
					}
				}

				if (port.manufacturer && port.manufacturer.indexOf(mcuManufacturer) >= 0) {
					var mcuPort = new serialport.SerialPort(port.comName, {
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

							var mcuPortIndex = mcuPorts.indexOf(mcuPort);
							if (mcuPortIndex >= 0) {
								mcuPorts.splice(mcuPortIndex, 1);
							}
						});
					});
				}
			});
		});
	}

	function updateOSC() {
		var isTouching = false;
		var touchingIndexes = [];

		// Update time
		if (then == 0) {
			then = Date.now();
		} else {
			then = now;
		}
		now = Date.now();
		delta = (now - then) * 0.001;

		// Check for touch
		for (var i = 0; i < frontHeights.length; i++) {
			if (frontHeights[i] > 0.2 && frontHeights[i] < 0.8 && backHeights[i] > 0.2 && backHeights[i] < 0.8) {
				isTouching = true;
				touchingIndexes.push(i);
			}
		}

		// Adjust sound volumes
		for (var i = 0; i < frontHeights.length; i++) {
			if ((isTouching == false || (isTouching && touchingIndexes.indexOf(i) >= 0)) && frontHeights[i] > 0.2 && frontHeights[i] < 0.8) {
				frontVolumes[i] = frontVolumes[i] + delta * fadeSpeed > 1 ? 1 : frontVolumes[i] + delta * fadeSpeed;
			} else {
				frontVolumes[i] = frontVolumes[i] - delta * fadeSpeed < 0 ? 0 : frontVolumes[i] - delta * fadeSpeed;
			}
			client.send('/front', i, frontVolumes[i]);
		}
		for (var i = 0; i < backHeights.length; i++) {
			if ((isTouching == false || (isTouching && touchingIndexes.indexOf(i) >= 0)) &&
			    backHeights[i] > 0.2 && backHeights[i] < 0.2) {
				backVolumes[i] = (backVolumes[i] + delta * fadeSpeed) > 1 ? 1 : backVolumes[i] + delta * fadeSpeed;
			} else {
				backVolumes[i] = (backVolumes[i] - delta * fadeSpeed) < 0 ? 0 : backVolumes[i] - delta * fadeSpeed;
			}
			client.send('/back', i, backVolumes[i]);
		}

		if (isTouching) {
			ambientVolume = ambientVolume - delta < 0 ? 0 : ambientVolume - delta * ambientFadeOutSpeed;
		} else {
			ambientVolume = ambientVolume + delta > 1 ? 1 : ambientVolume + delta * ambientFadeInSpeed;
		}
		client.send('/ambient', ambientVolume);
	}

	app.get('/volumes', function(req, res) {
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
