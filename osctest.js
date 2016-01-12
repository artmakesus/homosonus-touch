var osc = require('node-osc');

var oscServer = new osc.Server(7070, 'localhost');
oscServer.on('message', function(msg, rinfo) {
	console.log(msg);
});
