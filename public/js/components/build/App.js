'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');

function intersect(x1, x2, y2, radius) {
	if (x1 < x2 - radius || x1 > x2 + radius) {
		return null;
	}

	var dx = x2 - x1;
	var dy = Math.sqrt(radius * radius - dx * dx);
	var angle = Math.atan2(dy, dx);
	return {
		x: x2 + Math.cos(angle) * radius,
		y: y2 + Math.sin(angle) * radius
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
			var canvas = _this.refs.canvas;
			var ctx = _this.ctx;
			ctx.fillStyle = 'black';
			ctx.strokeStyle = 'white';

			var sensorDistance = canvas.width / App.NUM_SENSORS;
			var radius = canvas.width * 0.075;

			var heights = [];
			for (var i = 0; i < App.NUM_SENSORS; i++) {
				if (_this.isMouseDown) {
					var x = i * sensorDistance + sensorDistance * 0.5;
					var p = intersect(x, _this.mouseX, _this.mouseY, radius);
					if (p) {
						heights.push(p.y);
					} else {
						heights.push(0);
					}
				} else {
					heights.push(0);
				}
			}

			ctx.fillRect(0, 0, _this.refs.canvas.width, _this.refs.canvas.height);
			for (var i = 0; i < App.NUM_SENSORS; i++) {
				var x = i * sensorDistance + sensorDistance * 0.5;
				ctx.beginPath();
				ctx.moveTo(x, canvas.height);
				ctx.lineTo(x, heights[i]);
				ctx.stroke();
				ctx.closePath();
			}

			if (_this.isMouseDown) {
				ctx.beginPath();
				ctx.arc(_this.mouseX, _this.mouseY, radius, 0, 2 * Math.PI, false);
				ctx.fill();
				ctx.stroke();
			}

			_this.updateOSC(heights);

			requestAnimationFrame(_this.draw);
		}, _this.resize = function () {
			_this.refs.canvas.width = window.innerWidth;
			_this.refs.canvas.height = window.innerHeight;
		}, _this.mousedown = function (event) {
			_this.isMouseDown = true;
			_this.mouseX = event.clientX;
			_this.mouseY = event.clientY;
		}, _this.mouseup = function (event) {
			_this.isMouseDown = false;
			_this.mouseX = event.clientX;
			_this.mouseY = event.clientY;
		}, _this.mousemove = function (event) {
			_this.mouseX = event.clientX;
			_this.mouseY = event.clientY;
		}, _this.updateOSC = function (heights) {
			// Normalize data
			for (var i = 0; i < heights.length; i++) {
				heights[i] = Math.max(0, Math.min(1, (canvas.height - heights[i]) / canvas.height));
			}

			$.ajax({
				url: '/data',
				method: 'POST',
				data: { data: JSON.stringify(heights) }
			}).done(function () {}).fail(function (resp) {
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

			// Handle animation
			this.ctx = this.refs.canvas.getContext('2d');
			requestAnimationFrame(this.draw);
		}
	}]);

	return App;
})(React.Component);

App.NUM_SENSORS = 10;

ReactDOM.render(React.createElement(App, null), document.getElementById('root'));