'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// Configuration
var bUseOSC = false;
var bSimulate = false;
var fadeSpeed = 0.2;
var ambientFadeInSpeed = 0.2;
var ambientFadeOutSpeed = 1.4;

var sounds = {};
var soundModels = [{ ref: 'ambient', src: 'sounds/ambient.wav' }, { ref: 'back0', src: 'sounds/user1/c0.wav' }, { ref: 'back1', src: 'sounds/user1/e0.wav' }, { ref: 'back2', src: 'sounds/user1/ds0.wav' }, { ref: 'back3', src: 'sounds/user1/b0.wav' }, { ref: 'back4', src: 'sounds/user1/g0.wav' }, { ref: 'back5', src: 'sounds/user1/c1.wav' }, { ref: 'back6', src: 'sounds/user1/e1.wav' }, { ref: 'back7', src: 'sounds/user1/ds1.wav' }, { ref: 'back8', src: 'sounds/user1/b1.wav' }, { ref: 'back9', src: 'sounds/user1/g1.wav' }, { ref: 'back10', src: 'sounds/user1/c2.wav' }, { ref: 'back11', src: 'sounds/user1/e2.wav' }, { ref: 'back12', src: 'sounds/user1/ds2.wav' }, { ref: 'back13', src: 'sounds/user1/b2.wav' }, { ref: 'back14', src: 'sounds/user1/g2.wav' }, { ref: 'front0', src: 'sounds/user2/c00.wav' }, { ref: 'front1', src: 'sounds/user2/e00.wav' }, { ref: 'front2', src: 'sounds/user2/ds00.wav' }, { ref: 'front3', src: 'sounds/user2/b00.wav' }, { ref: 'front4', src: 'sounds/user2/g00.wav' }, { ref: 'front5', src: 'sounds/user2/c11.wav' }, { ref: 'front6', src: 'sounds/user2/e11.wav' }, { ref: 'front7', src: 'sounds/user2/ds11.wav' }, { ref: 'front8', src: 'sounds/user2/b11.wav' }, { ref: 'front9', src: 'sounds/user2/g11.wav' }, { ref: 'front10', src: 'sounds/user2/c22.wav' }, { ref: 'front11', src: 'sounds/user2/e22.wav' }, { ref: 'front12', src: 'sounds/user2/ds22.wav' }, { ref: 'front13', src: 'sounds/user2/b22.wav' }, { ref: 'front14', src: 'sounds/user2/g22.wav' }];

var frontCircles = [],
    frontHeights = [],
    frontVolumes = [],
    backCircles = [],
    backHeights = [],
    backVolumes = [],
    ambientVolume = 0;

var now = 0,
    then = 0,
    delta = 0;

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

var App = function (_React$Component) {
	_inherits(App, _React$Component);

	function App() {
		var _Object$getPrototypeO;

		var _temp, _this, _ret;

		_classCallCheck(this, App);

		for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
			args[_key] = arguments[_key];
		}

		return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(App)).call.apply(_Object$getPrototypeO, [this].concat(args))), _this), _this.state = {
			soundsLoaded: 0
		}, _this.fetchConfig = function () {
			_jquery2.default.ajax({
				url: '/config',
				method: 'GET',
				dataType: 'json'
			}).done(function (config) {
				bUseOSC = config.bUseOSC;
				bSimulate = config.bSimulate;

				if (bSimulate) {
					_this.initializeSounds();
				} else {
					if (bUseOSC) {
						_this.setState({ soundsLoaded: soundModels.length });
					} else {
						_this.initializeSounds();
					}
					setInterval(_this.fetchVolumes, 33);
				}
			}).fail(function (response) {
				console.log(response);
			});
		}, _this.fetchVolumes = function () {
			_jquery2.default.ajax({
				url: '/volumes',
				method: 'GET'
			}).done(function (volumes) {
				if (bUseOSC) {
					frontVolumes = volumes.frontVolumes;
					backVolumes = volumes.backVolumes;
					ambientVolume = volumes.ambientVolume;
				} else {
					for (var i = 0; i < frontHeights.length; i++) {
						sounds['front' + i].volume = volumes.frontVolumes[i];
						sounds['back' + i].volume = volumes.backVolumes[i];
						sounds['ambient'].volume = volumes.ambientVolume;
					}
				}
			}).fail(function (response) {
				console.log('failed to get volumes');
			});
		}, _this.initializeSounds = function () {
			for (var i in soundModels) {
				var soundModel = soundModels[i];
				var sound = new Audio(soundModel.src);
				sound.volume = 0;
				sound.addEventListener('loadeddata', function () {
					var soundsLoaded = _this.state.soundsLoaded + 1;
					_this.setState({ soundsLoaded: soundsLoaded });
				});
				sounds[soundModel.ref] = sound;
			}
		}, _this.initializeCanvas = function () {
			// Handle window resize
			_this.resize();
			window.addEventListener('resize', _this.resize);

			// Handle mouse
			if (bSimulate) {
				window.addEventListener('mousedown', _this.mousedown);
				window.addEventListener('mouseup', _this.mouseup);
				window.addEventListener('mousemove', _this.mousemove);
				window.addEventListener('dblclick', _this.dblclick);
				window.addEventListener('keyup', _this.keyup);
			}

			// Handle animation
			_this.ctx = canvas.getContext('2d');
			requestAnimationFrame(_this.draw);
		}, _this.draw = function () {
			if (then == 0) {
				then = Date.now();
			} else {
				then = now;
			}
			now = Date.now();
			delta = (now - then) * 0.001;

			var sensorDistance = canvas.width / App.NUM_SENSORS;
			frontHeights = [];
			backHeights = [];

			var ctx = _this.ctx;
			ctx.fillStyle = 'black';
			ctx.strokeStyle = 'white';

			for (var i = 0; i < App.NUM_SENSORS; i++) {
				if (frontCircles && frontCircles.length > 0) {
					var x = i * sensorDistance + sensorDistance * 0.5;
					var p = intersect(x, frontCircles);
					if (p) {
						frontHeights.push(p.y);
					} else {
						frontHeights.push(0);
					}
				} else {
					frontHeights.push(0);
				}

				if (backCircles && backCircles.length > 0) {
					var x = i * sensorDistance + sensorDistance * 0.5;
					var p = intersect(x, backCircles);
					if (p) {
						backHeights.push(p.y);
					} else {
						backHeights.push(0);
					}
				} else {
					backHeights.push(0);
				}
			}

			ctx.fillRect(0, 0, canvas.width, canvas.height);

			var canvasWidth = canvas.width;
			var canvasHeight = canvas.height;

			for (var i = 0; i < App.NUM_SENSORS; i++) {
				var x = i * sensorDistance + sensorDistance * 0.5;
				ctx.beginPath();
				ctx.moveTo(x - 1, canvas.height);
				ctx.lineTo(x - 1, backHeights[i]);
				ctx.strokeStyle = 'red';
				ctx.stroke();
				ctx.closePath();

				var value = bUseOSC ? backVolumes[i] : sounds['back' + i].volume;
				if (!isNaN(value)) {
					ctx.font = '16px sans-serif';
					ctx.fillStyle = 'red';
					ctx.fillText(value.toFixed(2), x + 8, 24);
				}
			}

			for (var i in backCircles) {
				_this.drawCircle(backCircles[i]);
			}

			for (var i = 0; i < App.NUM_SENSORS; i++) {
				var x = i * sensorDistance + sensorDistance * 0.5;
				ctx.beginPath();
				ctx.moveTo(x, canvas.height);
				ctx.lineTo(x, frontHeights[i]);
				ctx.strokeStyle = 'green';
				ctx.stroke();
				ctx.closePath();

				var value = bUseOSC ? frontVolumes[i] : sounds['front' + i].volume;
				if (!isNaN(value)) {
					ctx.font = '16px sans-serif';
					ctx.fillStyle = 'green';
					ctx.fillText(value.toFixed(2), x + 8, 48);
				}
			}

			for (var i in frontCircles) {
				_this.drawCircle(frontCircles[i]);
			}

			_this.normalizeHeights();
			if (bUseOSC) {
				_this.updateOSC(frontHeights, backHeights);
			} else {
				_this.updateSounds(frontHeights, backHeights);
			}

			requestAnimationFrame(_this.draw);
		}, _this.resize = function () {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			var radius = canvas.width * App.CIRCLE_RADIUS_FACTOR;

			for (var i in frontCircles) {
				frontCircles[i].radius = radius;
			}

			for (var i in backCircles) {
				backCircles[i].radius = radius;
			}
		}, _this.mousedown = function (event) {
			_this.isMouseDown = true;

			for (var i in frontCircles) {
				var result = contains(event.clientX, event.clientY, frontCircles[i]);
				if (!result.isContaining) {
					continue;
				}

				if (result.isContaining) {
					_this.draggedCircle = {
						dx: result.dx,
						dy: result.dy,
						circle: i
					};
					_this.draggingFrontCircle = true;
					return;
				}
			}

			for (var i in backCircles) {
				var result = contains(event.clientX, event.clientY, backCircles[i]);
				if (!result.isContaining) {
					continue;
				}

				if (result.isContaining) {
					_this.draggedCircle = {
						dx: result.dx,
						dy: result.dy,
						circle: i
					};
					_this.draggingFrontCircle = false;
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
					var x = (event.clientX + c.dx) / canvas.width;
					var y = (event.clientY + c.dy) / canvas.height;
					if (_this.draggingFrontCircle) {
						frontCircles[c.circle].x = x;
						frontCircles[c.circle].y = y;
					} else {
						backCircles[c.circle].x = x;
						backCircles[c.circle].y = y;
					}
				}
			}
			_this.x = event.clientX;
			_this.y = event.clientY;
		}, _this.dblclick = function (event) {
			_this.addFrontCircle();
		}, _this.keyup = function (event) {
			var key = event.which || event.keyCode;
			switch (key) {
				case 8:
					if (_this.draggedCircle) {
						if (_this.draggingFrontCircle) {
							frontCircles.splice(_this.draggedCircle.circle, 1);
						} else {
							backCircles.splice(_this.draggedCircle.circle, 1);
						}
					}
					break;
				case 49:
					_this.addFrontCircle();
					break;
				case 50:
					_this.addBackCircle();
					break;
				default:
					break;
			}
		}, _this.updateOSC = function (frontHeights, backHeights) {
			if (bSimulate) {
				// Normalize data
				for (var i = 0; i < frontHeights.length; i++) {
					frontHeights[i] = Math.max(0, Math.min(1, (canvas.height - frontHeights[i]) / canvas.height));
				}
				for (var i = 0; i < backHeights.length; i++) {
					backHeights[i] = Math.max(0, Math.min(1, (canvas.height - backHeights[i]) / canvas.height));
				}

				_jquery2.default.ajax({
					url: '/distances',
					method: 'POST',
					data: {
						frontHeights: JSON.stringify(frontHeights),
						backHeights: JSON.stringify(backHeights)
					}
				}).done(function () {
					// do nothing
				}).fail(function (resp) {
					console.log('Failed to send height data');
				});
			}
		}, _this.updateSounds = function (frontHeights, backHeights) {
			if (bSimulate) {
				var isTouching = false;
				var touchingIndexes = [];

				// Check for touch
				for (var i = 0; i < frontHeights.length; i++) {
					if (frontHeights[i] > 0.05 && frontHeights[i] < 0.95 && backHeights[i] > 0.05 && backHeights[i] < 0.95) {
						isTouching = true;
						touchingIndexes.push(i);
					}
				}

				// Adjust sound volumes
				for (var i = 0; i < frontHeights.length; i++) {
					var sound = sounds['front' + i];
					if ((isTouching == false || isTouching && touchingIndexes.indexOf(i) >= 0) && frontHeights[i] > 0.05 && frontHeights[i] < 0.95) {
						sound.volume = sound.volume + delta * fadeSpeed > 1 ? 1 : sound.volume + delta * fadeSpeed;
					} else {
						sound.volume = sound.volume - delta * fadeSpeed < 0 ? 0 : sound.volume - delta * fadeSpeed;
					}
				}
				for (var i = 0; i < backHeights.length; i++) {
					var sound = sounds['back' + i];
					if ((isTouching == false || isTouching && touchingIndexes.indexOf(i) >= 0) && backHeights[i] > 0.05 && backHeights[i] < 0.95) {
						sound.volume = sound.volume + delta * fadeSpeed > 1 ? 1 : sound.volume + delta * fadeSpeed;
					} else {
						sound.volume = sound.volume - delta * fadeSpeed < 0 ? 0 : sound.volume - delta * fadeSpeed;
					}
				}

				if (isTouching) {
					sounds['ambient'].volume = sounds['ambient'].volume - delta < 0 ? 0 : sounds['ambient'].volume - delta * ambientFadeOutSpeed;
				} else {
					sounds['ambient'].volume = sounds['ambient'].volume + delta > 1 ? 1 : sounds['ambient'].volume + delta * ambientFadeInSpeed;
				}
			}
		}, _this.addFrontCircle = function () {
			frontCircles.push({
				x: _this.x / canvas.width,
				y: _this.y / canvas.height,
				radius: canvas.width * App.CIRCLE_RADIUS_FACTOR
			});
		}, _this.addBackCircle = function () {
			backCircles.push({
				x: _this.x / canvas.width,
				y: _this.y / canvas.height,
				radius: canvas.width * App.CIRCLE_RADIUS_FACTOR
			});
		}, _this.drawCircle = function (c) {
			var ctx = _this.ctx;
			ctx.fillStyle = 'black';
			ctx.beginPath();
			ctx.arc(c.x * canvas.width, c.y * canvas.height, c.radius, 0, 2 * Math.PI, false);
			ctx.fill();
			ctx.stroke();
		}, _temp), _possibleConstructorReturn(_this, _ret);
	}

	_createClass(App, [{
		key: 'render',
		value: function render() {
			return _react2.default.createElement(
				'div',
				{ id: 'app' },
				this.state.soundsLoaded == soundModels.length ? _react2.default.createElement('canvas', { id: 'canvas', ref: 'canvas' }) : _react2.default.createElement(
					'p',
					null,
					'Loaded ',
					this.state.soundsLoaded,
					' sounds..'
				)
			);
		}
	}, {
		key: 'componentDidMount',
		value: function componentDidMount() {
			// Check whether app should send OSC messages (for SuperCollider)
			this.fetchConfig();
		}
	}, {
		key: 'componentDidUpdate',
		value: function componentDidUpdate() {
			if (this.state.soundsLoaded == soundModels.length) {
				if (!bUseOSC) {
					this.resetSounds();
				}
				this.initializeCanvas();
			}
		}
	}, {
		key: 'resetSounds',
		value: function resetSounds() {
			for (var i in soundModels) {
				var soundModel = soundModels[i];
				sounds[soundModel.ref].currentTime = 0;
			}
		}
	}, {
		key: 'normalizeHeights',
		value: function normalizeHeights() {
			if (bSimulate) {
				for (var i = 0; i < frontHeights.length; i++) {
					frontHeights[i] = Math.max(0, Math.min(1, (canvas.height - frontHeights[i]) / canvas.height));
					backHeights[i] = Math.max(0, Math.min(1, (canvas.height - backHeights[i]) / canvas.height));
				}
			}
		}
	}]);

	return App;
}(_react2.default.Component);

App.NUM_SENSORS = 15;
App.CIRCLE_RADIUS_FACTOR = 0.05;


_reactDom2.default.render(_react2.default.createElement(App, null), document.getElementById('root'));