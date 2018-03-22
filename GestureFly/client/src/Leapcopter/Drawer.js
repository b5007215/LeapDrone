// This script is used to display the hand animation
define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/_base/array',
	'dijit/_WidgetBase',
	'put-selector/put',
	'dojo/topic'
], function (declare, lang, array, _WidgetBase, put, topic) {
	var colors = ['#3F686A', '#9D455B', '#5E8C9B', '#713DC3', '#F8FA1B'];

	// Generate a random number
	function random(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	}
	// Specifiy the size of the hand animation
	return declare(_WidgetBase, {
		width: 640,
		height: 360,
		actionInterval: 500,
		action: null,

		postMixInProperties: function () {
			this.inherited(arguments);
			// Retrieve actions using Faye
			topic.subscribe('remote/frame', lang.hitch(this, 'update'));
			topic.subscribe('remote/action', lang.hitch(this, 'setAction'));
		},

		buildRendering: function () {
			this.inherited(arguments);
			// Use to display the video stream
			this.canvas = put(this.domNode, 'canvas', {
				height: this.height,
				width: this.width
			});
			this.context = this.canvas.getContext('2d');
		},
		// Sets the current action of the drone
		setAction: function (action) {
			if (!action.type || (this.action && this.action.type === action.type || action.type === 'idle')) { return; }
			if (this.actionHandle) {
				clearTimeout(this.actionHandle);
			}
			// Used to specifiy the location of the animation on the screen
			this.action = {
				type: action.type,
				text: action.type,
				x: this.width * 0.50,
				y: this.height * 0.80,
				color: colors[random(0, colors.length)]
			};
			this.actionHandle = setTimeout(lang.hitch(this, function () {
				this.action = null;
				this.actionHandle = null;
			}), this.actionInterval);
		},

		// Update drone action
		update: function (frame) {
			var c = this.context;

			c.clearRect(0, 0, this.width, this.height);

			var action = this.action;
			if (action) {
				c.font = '20pt MarkerFelt-Thin, Comic Sans MS';
				c.fillStyle = action.color;
				c.fillText(action.text, action.x, action.y);
				c.stroke();
			}

			array.forEach(frame.hands, function (hand) {
				var handPos = this._toScene(frame, hand.palmPosition);

				array.forEach(hand.fingers, function (finger) {
					var fingerPos = this._toScene(frame, finger.tipPosition);

					// draw the connection
					c.strokeStyle = '#ffa040';
					c.lineWidth = 3;
					c.beginPath();
					c.moveTo(handPos[0], handPos[1]);
					c.lineTo(fingerPos[0], fingerPos[1]);
					c.closePath();
					c.stroke();

					// draw the finger
					c.fillStyle = '#39AECF';
					c.lineWidth = 5;
					c.beginPath();
					c.arc(fingerPos[0], fingerPos[1], 20, 0, Math.PI * 2);
					c.closePath();
					c.fill();

					// draw the hand
					c.fillStyle = '#FF5A40';
					c.beginPath();
					c.arc(handPos[0], handPos[1], 40, 0, Math.PI * 2);
					c.closePath();
					c.fill();
				}, this);
			}, this);
		},

		_toScene: function (frame, leapPos) {
			var iBox = frame.interactionBox;

			var left = iBox.center[0] - iBox.size[0] / 2,
				top = iBox.center[1] + iBox.size[1] / 2,
				x = leapPos[0] - left,
				y = leapPos[1] - top;

			x /= iBox.size[0];
			y /= iBox.size[1];

			x *= this.width;
			y *= this.height;

			return [x, -y];
		}

	});
});
