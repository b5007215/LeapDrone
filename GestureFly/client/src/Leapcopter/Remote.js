define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/topic'
], function (declare, lang, array, topic) {
	/*globals Leap*/

	return declare(null, {
		controller: null,
		enableGestures: true,

		constructor: function () {
			// init a new Leap controller
			this.controller = new Leap.Controller({
				enableGestures: this.enableGestures
			});
			this.controller.on('frame', lang.hitch(this, 'onFrame'));
		},

		start: function () {
			this.controller.connect();
		},

		stop: function () {},

		onFrame: function (frame) {
			topic.publish('remote/frame', frame);
			var action = {
				backward: 0,
				forward: 0,
				left: 0,
				right: 0,
				type: 'idle'
			};
			array.forEach(frame.gestures, function (gesture) {
				var type = gesture.type;
				// Set the gestures for different types of actions
				switch (type) {
				case 'circle':
					action.type = 'flip';
					break;
				case 'keyTap':
					action.type = 'toggle';
					break;
				}
			}, this);

			// Focus only on 1 hand
			var hand = frame.hands[0];
			if (action.type === 'idle' && hand) {
				var pitch = hand.pitch(),
					roll = hand.roll(),
					handPos = hand.stabilizedPalmPosition,
					y = handPos[1];
				// Check the pitch/roll of the current hand based on leap motion
				// and set the required action based on the value
				if (pitch > 0.5) {
					action.type = 'backward';
					action.backward = 1;
				}
				if (pitch < -0.1) {
					action.type = 'forward';
					action.forward = 1;
				}
				if (roll > 0.5) {
					action.type = 'left';
					action.left = 1;
				}
				if (roll < -0.5) {
					action.type = 'right';
					action.right = 1;
				}

				if (y < 100) {
					console.log('Down');
					action.type = 'down';
					action.down = 1;
				} else if (y > 400) {
					console.log('Up');
					action.type = 'up';
					action.up = 1;
				}
			}
			// publish using Faye to send the action to the backend
			topic.publish('remote/action', action);
		}
	});
});
