define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/topic'
], function (declare, lang, topic) {
	/*globals io*/
	// Drone options for controlling the states
	return declare(null, {
		_connected: false,
		busy: false,
		active: true,
		isFyling: false,
		emergency: false,
		remote: null,
		socket: null,
		// Attach the url to socket port
		url: 'ws://localhost:3001',

		constructor: function () {
			topic.subscribe('remote/action', lang.hitch(this, 'sendAction'));

			this.socket = io.connect(this.url);
			this.socket.on('status', lang.hitch(this, 'updateStatus'));
		},
		// Updates the status of the drone on the socket server
		updateStatus: function (status) {
			if (status.connected) {
				this._connected = true;
			}
			if (typeof status.busy !== 'undefined') {
				this.busy = status.busy;
			}
		},
		// Display the action after sending it to the socket
		sendAction: function (action) {
			if (!this._connected || this.busy) { return; }
			var type = action.type;
			if (type === 'toggle') {
				this.isFlying = !this.isFlying;
			}

			if (this.active) {
				this.socket.emit('action', action);
			}
		}
	});
});
