'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');

var circles = [];

function intersect(x1, circles, radius) {
	if (!circles || circles.length == 0) {
		return null;
	}

	var finalX = -999999;
	var finalY = -999999;
	for (var i in circles) {
		var x2 = circles[i].x * canvas.width;
		var y2 = circles[i].y * canvas.height;
		var _radius = circles[i].radius;
		if (x1 < x2 - _radius || x1 > x2 + _radius) {
			continue;
		}

		var dx = x2 - x1;
		var dy = Math.sqrt(_radius * _radius - dx * dx);
		var angle = Math.atan2(dy, dx);

		var x = x2 + Math.cos(angle) * _radius;
		var y = y2 + Math.sin(angle) * _radius;
		if (y > finalY) {
			finalX = x;
			finalY = y;
		}
	}

	if (finalX <= -999999 && finalY <= -999999) {
		return null;
	}
	return { x: finalX, y: finalY };
}

function contains(mouseX, mouseY, circle) {
	var dx = circle.x * canvas.width - mouseX;
	var dy = circle.y * canvas.height - mouseY;
	return {
		dx: dx,
		dy: dy,
		isContaining: Math.sqrt(dx * dx + dy * dy) < canvas.width * App.CIRCLE_RADIUS_FACTOR
	};
}

var App = (function (_React$Component) {
	_inherits(App, _React$Component);

	function App() {
		var _Object$getPrototypeO;

		var _temp, _this, _ret;

		_classCallCheck(this, App);

		for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
			args[_key] = arguments[_key];
		}

		return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(App)).call.apply(_Object$getPrototypeO, [this].concat(args))), _this), _this.draw = function () {
			var ctx = _this.ctx;
			ctx.fillStyle = 'black';
			ctx.strokeStyle = 'white';

			var sensorDistance = canvas.width / App.NUM_SENSORS;

			var heights = [];
			for (var i = 0; i < App.NUM_SENSORS; i++) {
				if (circles && circles.length > 0) {
					var x = i * sensorDistance + sensorDistance * 0.5;
					var p = intersect(x, circles);
					if (p) {
						heights.push(p.y);
					} else {
						heights.push(0);
					}
				} else {
					heights.push(0);
				}
			}

			ctx.fillRect(0, 0, canvas.width, canvas.height);

			var canvasWidth = canvas.width;
			var canvasHeight = canvas.height;
			for (var i = 0; i < App.NUM_SENSORS; i++) {
				var x = i * sensorDistance + sensorDistance * 0.5;
				ctx.beginPath();
				ctx.moveTo(x, canvas.height);
				ctx.lineTo(x, heights[i]);
				ctx.stroke();
				ctx.closePath();

				var normalizedHeight = Math.max(0, Math.min(1, (canvas.height - heights[i]) / canvas.height));
				ctx.font = '16px sans-serif';
				ctx.fillStyle = 'white';
				ctx.fillText(normalizedHeight.toFixed(2), x + 8, 24);
			}

			for (var i in circles) {
				ctx.fillStyle = 'black';
				ctx.beginPath();
				ctx.arc(circles[i].x * canvas.width, circles[i].y * canvas.height, circles[i].radius, 0, 2 * Math.PI, false);
				ctx.fill();
				ctx.stroke();
			}

			_this.updateOSC(heights);

			requestAnimationFrame(_this.draw);
		}, _this.resize = function () {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			for (var i in circles) {
				circles[i].radius = canvas.width * App.CIRCLE_RADIUS_FACTOR;
			}
		}, _this.mousedown = function (event) {
			_this.isMouseDown = true;
			for (var i in circles) {
				var result = contains(event.clientX, event.clientY, circles[i]);
				if (!result.isContaining) {
					continue;
				}

				if (result.isContaining) {
					_this.draggedCircle = {
						dx: result.dx,
						dy: result.dy,
						circle: i
					};
					return;
				}
			}

			_this.draggedCircle = null;
		}, _this.mouseup = function (event) {
			_this.isMouseDown = false;
		}, _this.mousemove = function (event) {
			if (_this.isMouseDown) {
				var c = _this.draggedCircle;
				if (c) {
					circles[c.circle].x = (event.clientX + c.dx) / canvas.width;
					circles[c.circle].y = (event.clientY + c.dy) / canvas.height;
				}
			}
		}, _this.dblclick = function (event) {
			circles.push({
				x: event.clientX / canvas.width,
				y: event.clientY / canvas.height,
				radius: canvas.width * App.CIRCLE_RADIUS_FACTOR
			});
		}, _this.keyup = function (event) {
			var key = event.which || event.keyCode;
			switch (key) {
				case 8:
					if (_this.draggedCircle) {
						circles.splice(_this.draggedCircle.circle, 1);
					}
					break;
			}
		}, _this.updateOSC = function (heights) {
			// Normalize data
			for (var i = 0; i < heights.length; i++) {
				heights[i] = Math.max(0, Math.min(1, (canvas.height - heights[i]) / canvas.height));
			}

			$.ajax({
				url: '/data',
				method: 'POST',
				data: { heights: JSON.stringify(heights) }
			}).done(function () {
				// do nothing
			}).fail(function (resp) {
				console.log('Failed');
			});
		}, _temp), _possibleConstructorReturn(_this, _ret);
	}

	_createClass(App, [{
		key: 'render',
		value: function render() {
			return React.createElement('canvas', { id: 'canvas', ref: 'canvas' });
		}
	}, {
		key: 'componentDidMount',
		value: function componentDidMount() {
			// Handle window resize
			this.resize();
			window.addEventListener('resize', this.resize);

			// Handle mouse
			window.addEventListener('mousedown', this.mousedown);
			window.addEventListener('mouseup', this.mouseup);
			window.addEventListener('mousemove', this.mousemove);
			window.addEventListener('dblclick', this.dblclick);
			window.addEventListener('keyup', this.keyup);

			// Handle animation
			this.ctx = canvas.getContext('2d');
			requestAnimationFrame(this.draw);
		}
	}]);

	return App;
})(React.Component);

App.NUM_SENSORS = 10;
App.CIRCLE_RADIUS_FACTOR = 0.05;

ReactDOM.render(React.createElement(App, null), document.getElementById('root'));