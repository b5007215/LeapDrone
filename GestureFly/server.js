/*jshint node:true*/
// Backend logic using Express framework
var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	dronestream = require('dronestream').listen(server),
	// Use socket programming for asynchronous connection
	io = require('socket.io').listen(3001),
	arDrone = require('ar-drone'),
	client = arDrone.createClient(),
	// Used to check the state of the drone
	flight = false,
	// Set the speed of the drone
	speed = 0.2,
	busy = false;

app.use(express.static(__dirname + '/client'));

io.sockets.on('connection', function (socket) {
	console.log('\nConnected!\n');
	socket.emit('status', {
		connected: true
	});

// Display information regarding drone status
	socket.on('action', function (action) {
		function setBusy(isBusy) {
			busy = isBusy;
			socket.emit('status', { busy: busy });
		}
		// Used to make a 1 second delay for specific drone actions
		// such as taking off
		function runAction(action, args) {
			setBusy(true);
			action.apply(client, args);
			client.after(1000, function () {
				setBusy(false);
			});
		}
		var type = action.type;
		// toggle is used for takeOff/land
		if (type === 'toggle') {
			console.log('toggle');
			if (flight) {
				console.log('\tland');
				runAction(client.land);
				flight = false;
			} else {
				console.log('\ttakeoff');
				client.disableEmergency();
				runAction(client.takeoff);
				flight = true;
			}
		}
		// Perform a backflip
		else if (type === 'flip') {
			console.log('flip');
			if (flight) {
				runAction(client.animate("flipBehind", 150));
			}
		}
		// Move drone forward
		else if (type === 'forward') {
			console.log('forward');
			 	client.front(speed);
		}
		// Move drone backward
		else if (type === 'backward') {
			console.log('backward');
			 	client.back(speed);
		}
		// Move drone left
		else if (type === 'left') {
			console.log('left');
			 	client.left(speed);
		}
		// Move drone right
		else if (type === 'right') {
			console.log('right');
			 	client.right(speed);
		}
		// Gain altitude
	 else if (type === 'up') {
			console.log('up');
			client.up(speed);
		}
		// Reduce altitude
		else if (type === 'down') {
			console.log('down');
			client.down(speed);
		}
		// Keep the drone hovering in its current coordinates
		if (!action.left && !action.right && !action.forward && !action.backward && !action.up && !action.down) {
			console.log('hovering');
			client.stop();
		}
	});
});
// Listen for connections from client based on
// port 3000
server.listen(3000);
