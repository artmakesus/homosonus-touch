'use strict'

import React from 'react'
import ReactDOM from 'react-dom'
import $ from 'jquery'

let frontCircles = [],
    backCircles = [];

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
	static NUM_SENSORS = 10;
	static CIRCLE_RADIUS_FACTOR = 0.05;
	render() {
		return <canvas id='canvas' ref='canvas'></canvas>
	}
	componentDidMount() {
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
	draw = () => {
		let sensorDistance = canvas.width / App.NUM_SENSORS;
		let frontHeights = [],
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

			let normalizedHeight = Math.max(0, Math.min(1, (canvas.height - backHeights[i]) / canvas.height));
			ctx.font = '16px sans-serif';
			ctx.fillStyle = 'red';
			ctx.fillText(normalizedHeight.toFixed(2), x + 8, 24);
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

			let normalizedHeight = Math.max(0, Math.min(1, (canvas.height - frontHeights[i]) / canvas.height));
			ctx.font = '16px sans-serif';
			ctx.fillStyle = 'green';
			ctx.fillText(normalizedHeight.toFixed(2), x + 8, 48);
		}

		for (let i in frontCircles) {
			this.drawCircle(frontCircles[i]);
		}

		this.updateOSC(frontHeights, backHeights);

		requestAnimationFrame(this.draw);
	};
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
			if (this.draggingFrontCircle) {
				continue;
			}

			console.log('test:', i);

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
		this.draggingFrontCircle = false;
	};
	mousemove = (event) => {
		if (this.isMouseDown) {
			let isFrontCircle = this.draggingFrontCircle;
			let c = this.draggedCircle;
			if (c) {
				let x = (event.clientX + c.dx) / canvas.width;
				let y = (event.clientY + c.dy) / canvas.height;
				if (isFrontCircle) {
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
				frontCircles.splice(this.draggedCircle.circle, 1);
			}
			break;
		case 49:
			this.addFrontCircle();
			break;
		case 50:
			this.addBackCircle();
			break;
		default:
			console.log(key);
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
