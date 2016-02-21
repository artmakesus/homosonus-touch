'use strict'

import React from 'react'
import ReactDOM from 'react-dom'
import $ from 'jquery'

// Configuration
let bUseOSC = false;
let bSimulate = false;
let bDrawVolumes = true; // If false, draw sensor distances
let fadeSpeed = 0.2;
let ambientFadeInSpeed = 0.2;
let ambientFadeOutSpeed = 1.4;

let frontCircles = [],
    frontHeights = [],
    backCircles = [],
    backHeights = [];

let now = 0, then = 0, delta = 0;

function intersect(x1, circles, radius) {
	if (!circles || circles.length == 0) {
		return null;
	}

	let finalX = -999999;
	let finalY = -999999;
	for (let i in circles) {
		let x2 = circles[i].x * canvas.width;
		let y2 = circles[i].y * canvas.height;
		let radius = circles[i].radius;
		if (x1 < x2 - radius || x1 > x2 + radius) {
			continue;
		}

		let dx = x2 - x1;
		let dy = Math.sqrt(radius * radius - dx * dx);
		let angle = Math.atan2(dy, dx);

		let x = x2 + Math.cos(angle) * radius;
		let y = y2 + Math.sin(angle) * radius;
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
	let dx = circle.x * canvas.width - mouseX;
	let dy = circle.y * canvas.height - mouseY;
	return {
		dx: dx,
		dy: dy,
		isContaining: Math.sqrt(dx * dx + dy * dy) < canvas.width * App.CIRCLE_RADIUS_FACTOR,
	}
}

class App extends React.Component {
	static NUM_SENSORS = 15;
	static CIRCLE_RADIUS_FACTOR = 0.05;
	render() {
		return (
			<div id='app'>
				{
					this.state.sounds.map(function(sound) {
						return <audio key={sound.ref}
									  id={sound.ref}
									  ref={sound.ref}
									  src={sound.src}
									  autoPlay
									  loop />
					})
				}
				{
					this.state.soundsLoaded == this.state.sounds.length ?
					<canvas id='canvas' ref='canvas'></canvas> :
					<p>Loaded {this.state.soundsLoaded} sounds..</p>
				}
			</div>
		)
	}
	state = {
		soundsLoaded: 0,
		sounds: [
			{ ref: 'ambient', src: 'sounds/ambient.wav' },
			{ ref: 'back0',   src: 'sounds/user1/c0.wav' },
			{ ref: 'back1',   src: 'sounds/user1/e0.wav' },
			{ ref: 'back2',   src: 'sounds/user1/ds0.wav' },
			{ ref: 'back3',   src: 'sounds/user1/b0.wav' },
			{ ref: 'back4',   src: 'sounds/user1/g0.wav' },
			{ ref: 'back5',   src: 'sounds/user1/c1.wav' },
			{ ref: 'back6',   src: 'sounds/user1/e1.wav' },
			{ ref: 'back7',   src: 'sounds/user1/ds1.wav' },
			{ ref: 'back8',   src: 'sounds/user1/b1.wav' },
			{ ref: 'back9',   src: 'sounds/user1/g1.wav' },
			{ ref: 'back10',  src: 'sounds/user1/c2.wav' },
			{ ref: 'back11',  src: 'sounds/user1/e2.wav' },
			{ ref: 'back12',  src: 'sounds/user1/ds2.wav' },
			{ ref: 'back13',  src: 'sounds/user1/b2.wav' },
			{ ref: 'back14',  src: 'sounds/user1/g2.wav' },
			{ ref: 'front0',  src: 'sounds/user2/c00.wav' },
			{ ref: 'front1',  src: 'sounds/user2/e00.wav' },
			{ ref: 'front2',  src: 'sounds/user2/ds00.wav' },
			{ ref: 'front3',  src: 'sounds/user2/b00.wav' },
			{ ref: 'front4',  src: 'sounds/user2/g00.wav' },
			{ ref: 'front5',  src: 'sounds/user2/c11.wav' },
			{ ref: 'front6',  src: 'sounds/user2/e11.wav' },
			{ ref: 'front7',  src: 'sounds/user2/ds11.wav' },
			{ ref: 'front8',  src: 'sounds/user2/b11.wav' },
			{ ref: 'front9',  src: 'sounds/user2/g11.wav' },
			{ ref: 'front10', src: 'sounds/user2/c22.wav' },
			{ ref: 'front11', src: 'sounds/user2/e22.wav' },
			{ ref: 'front12', src: 'sounds/user2/ds22.wav' },
			{ ref: 'front13', src: 'sounds/user2/b22.wav' },
			{ ref: 'front14', src: 'sounds/user2/g22.wav' },
		],
	};
	componentDidMount() {
		// Initialize Sounds
		this.initializeSounds();

		// Check whether app should send OSC messages (for SuperCollider)
		this.fetchConfig();
	}
	componentDidUpdate() {
		if (this.state.soundsLoaded == this.state.sounds.length) {
			this.resetSounds();
			this.initializeCanvas();
		}
	}
	fetchConfig = () => {
		$.ajax({
			url: '/config',
			method: 'GET',
			dataType: 'json',
		}).done((config) => {
			bUseOSC = config.bUseOSC;
			bSimulate = config.bSimulate;
			if (bUseOSC == false && bSimulate == false) {
				this.fetchDistances();
			}
		}).fail((response) => {
			console.log(response);
		});
	};
	fetchDistances = () => {
		$.ajax({
			url: '/distances',
			method: 'GET',
			dataType: 'json',
		}).done((distances) => {
		}).fail((response) => {
			console.log(response);
		});
	};
	initializeSounds = () => {
		for (let i in this.state.sounds) {
			let sound = this.state.sounds[i];
			this.refs[sound.ref].volume = 0;
			this.refs[sound.ref].addEventListener('loadeddata', () => {
				let soundsLoaded = this.state.soundsLoaded + 1;
				this.setState({ soundsLoaded: soundsLoaded });
			});
		}
	};
	resetSounds() {
		for (let i in this.state.sounds) {
			let sound = this.state.sounds[i];
			this.refs[sound.ref].currentTime = 0;
		}
	}
	initializeCanvas = () => {
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
	};
	draw = () => {
		if (then == 0) {
			then = Date.now();
		} else {
			then = now;
		}
		now = Date.now();
		delta = (now - then) * 0.001;

		let sensorDistance = canvas.width / App.NUM_SENSORS;
		frontHeights = [];
		backHeights = [];

		let ctx = this.ctx;
		ctx.fillStyle = 'black';
		ctx.strokeStyle = 'white';

		for (let i = 0; i < App.NUM_SENSORS; i++) {
			if (frontCircles && frontCircles.length > 0) {
				let x = i * sensorDistance + sensorDistance * 0.5;
				let p = intersect(x, frontCircles);
				if (p) {
					frontHeights.push(p.y);
				} else {
					frontHeights.push(0);
				}
			} else {
				frontHeights.push(0);
			}

			if (backCircles && backCircles.length > 0) {
				let x = i * sensorDistance + sensorDistance * 0.5;
				let p = intersect(x, backCircles);
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

		let canvasWidth = canvas.width;
		let canvasHeight = canvas.height;

		for (let i = 0; i < App.NUM_SENSORS; i++) {
			let x = i * sensorDistance + sensorDistance * 0.5;
			ctx.beginPath();
			ctx.moveTo(x - 1, canvas.height);
			ctx.lineTo(x - 1, backHeights[i]);
			ctx.strokeStyle = 'red';
			ctx.stroke();
			ctx.closePath();

			let value = bDrawVolumes ? this.refs['back' + i].volume :
			                           Math.max(0, Math.min(1, (canvas.height - backHeights[i]) / canvas.height));
			ctx.font = '16px sans-serif';
			ctx.fillStyle = 'red';
			ctx.fillText(value.toFixed(2), x + 8, 24);
		}

		for (let i in backCircles) {
			this.drawCircle(backCircles[i]);
		}

		for (let i = 0; i < App.NUM_SENSORS; i++) {
			let x = i * sensorDistance + sensorDistance * 0.5;
			ctx.beginPath();
			ctx.moveTo(x, canvas.height);
			ctx.lineTo(x, frontHeights[i]);
			ctx.strokeStyle = 'green';
			ctx.stroke();
			ctx.closePath();

			let value = bDrawVolumes ? this.refs['front' + i].volume :
			                           Math.max(0, Math.min(1, (canvas.height - frontHeights[i]) / canvas.height));
			ctx.font = '16px sans-serif';
			ctx.fillStyle = 'green';
			ctx.fillText(value.toFixed(2), x + 8, 48);
		}

		for (let i in frontCircles) {
			this.drawCircle(frontCircles[i]);
		}

		this.normalizeHeights();
		if (bUseOSC) {
			this.updateOSC(frontHeights, backHeights);
		} else {
			this.updateSounds(frontHeights, backHeights);
		}

		requestAnimationFrame(this.draw);
	};
	normalizeHeights() {
		for (let i = 0; i < frontHeights.length; i++) {
			frontHeights[i] = Math.max(0, Math.min(1, (canvas.height - frontHeights[i]) / canvas.height));
			backHeights[i] = Math.max(0, Math.min(1, (canvas.height - backHeights[i]) / canvas.height));
		}
	}
	resize = () => {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		let radius = canvas.width * App.CIRCLE_RADIUS_FACTOR;

		for (let i in frontCircles) {
			frontCircles[i].radius = radius;
		}

		for (let i in backCircles) {
			backCircles[i].radius = radius;
		}
	};
	mousedown = (event) => {
		this.isMouseDown = true;

		for (let i in frontCircles) {
			let result = contains(event.clientX, event.clientY, frontCircles[i]);
			if (!result.isContaining) {
				continue;
			}

			if (result.isContaining) {
				this.draggedCircle = {
					dx: result.dx,
					dy: result.dy,
					circle: i,
				};
				this.draggingFrontCircle = true;
				return;
			}
		}

		for (let i in backCircles) {
			let result = contains(event.clientX, event.clientY, backCircles[i]);
			if (!result.isContaining) {
				continue;
			}

			if (result.isContaining) {
				this.draggedCircle = {
					dx: result.dx,
					dy: result.dy,
					circle: i,
				};
				this.draggingFrontCircle = false;
				return;
			}
		}

		this.draggedCircle = null;
	};
	mouseup = (event) => {
		this.isMouseDown = false;
	};
	mousemove = (event) => {
		if (this.isMouseDown) {
			let c = this.draggedCircle;
			if (c) {
				let x = (event.clientX + c.dx) / canvas.width;
				let y = (event.clientY + c.dy) / canvas.height;
				if (this.draggingFrontCircle) {
					frontCircles[c.circle].x = x;
					frontCircles[c.circle].y = y;
				} else {
					backCircles[c.circle].x = x;
					backCircles[c.circle].y = y;
				}
			}
		}
		this.x = event.clientX;
		this.y = event.clientY;
	};
	dblclick = (event) => {
		this.addFrontCircle();
	};
	keyup = (event) => {
		let key = event.which || event.keyCode;
		switch (key) {
		case 8:
			if (this.draggedCircle) {
				if (this.draggingFrontCircle) {
					frontCircles.splice(this.draggedCircle.circle, 1);
				} else {
					backCircles.splice(this.draggedCircle.circle, 1);
				}
			}
			break;
		case 49:
			this.addFrontCircle();
			break;
		case 50:
			this.addBackCircle();
			break;
		default:
			break;
		}
	};
	updateOSC = (frontHeights, backHeights) => {
		// Normalize data
		for (let i = 0; i < frontHeights.length; i++) {
			frontHeights[i] = Math.max(0, Math.min(1, (canvas.height - frontHeights[i]) / canvas.height));
		}
		for (let i = 0; i < backHeights.length; i++) {
			backHeights[i] = Math.max(0, Math.min(1, (canvas.height - backHeights[i]) / canvas.height));
		}

		$.ajax({
			url: '/data',
			method: 'POST',
			data: {
				frontHeights: JSON.stringify(frontHeights),
				backHeights: JSON.stringify(backHeights),
			},
		}).done(function() {
			// do nothing
		}).fail(function(resp) {
			console.log('Failed to send height data');
		});
	};
	updateSounds = (frontHeights, backHeights) => {
		let isTouching = false;
		let touchingIndexes = [];

		// Check for touch
		for (let i = 0; i < frontHeights.length; i++) {
			if (frontHeights[i] > 0.05 && frontHeights[i] < 0.95 && backHeights[i] > 0.05 && backHeights[i] < 0.95) {
				isTouching = true;
				touchingIndexes.push(i);
			}
		}

		// Adjust sound volumes
		for (let i = 0; i < frontHeights.length; i++) {
			let sound = this.refs['front' + i];
			if ((isTouching == false || (isTouching && touchingIndexes.indexOf(i) >= 0)) &&
			    frontHeights[i] > 0.05 && frontHeights[i] < 0.95) {
				sound.volume = (sound.volume + delta * fadeSpeed) > 1 ? 1 : sound.volume + delta * fadeSpeed;
			} else {
				sound.volume = (sound.volume - delta * fadeSpeed) < 0 ? 0 : sound.volume - delta * fadeSpeed;
			}
		}
		for (let i = 0; i < backHeights.length; i++) {
			let sound = this.refs['back' + i];
			if ((isTouching == false || (isTouching && touchingIndexes.indexOf(i) >= 0)) &&
			    backHeights[i] > 0.05 && backHeights[i] < 0.95) {
				sound.volume = (sound.volume + delta * fadeSpeed) > 1 ? 1 : sound.volume + delta * fadeSpeed;
			} else {
				sound.volume = (sound.volume - delta * fadeSpeed) < 0 ? 0 : sound.volume - delta * fadeSpeed;
			}
		}

		if (isTouching) {
			this.refs.ambient.volume = this.refs.ambient.volume - delta < 0 ? 0 : this.refs.ambient.volume - delta * ambientFadeOutSpeed;
		} else {
			this.refs.ambient.volume = this.refs.ambient.volume + delta > 1 ? 1 : this.refs.ambient.volume + delta * ambientFadeInSpeed;
		}
	};
	addFrontCircle = () => {
		frontCircles.push({
			x: this.x / canvas.width,
			y: this.y / canvas.height,
			radius: canvas.width * App.CIRCLE_RADIUS_FACTOR,
		});
	};
	addBackCircle = () => {
		backCircles.push({
			x: this.x / canvas.width,
			y: this.y / canvas.height,
			radius: canvas.width * App.CIRCLE_RADIUS_FACTOR,
		});
	};
	drawCircle = (c) => {
		let ctx = this.ctx;
		ctx.fillStyle = 'black';
		ctx.beginPath();
		ctx.arc(c.x * canvas.width, c.y * canvas.height, c.radius, 0, 2 * Math.PI, false);
		ctx.fill();
		ctx.stroke();
	};
}

ReactDOM.render(<App />, document.getElementById('root'));
