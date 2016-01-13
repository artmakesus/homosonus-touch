'use strict';

let React = require('react');
let ReactDOM = require('react-dom');
let $ = require('jquery');

let circles = [];

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
	static NUM_SENSORS = 10
	static CIRCLE_RADIUS_FACTOR = 0.05
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
		let ctx = this.ctx;
		ctx.fillStyle = 'black';
		ctx.strokeStyle = 'white';

		let sensorDistance = canvas.width / App.NUM_SENSORS;

		let heights = [];
		for (let i = 0; i < App.NUM_SENSORS; i++) {
			if (circles && circles.length > 0) {
				let x = i * sensorDistance + sensorDistance * 0.5;
				let p = intersect(x, circles);
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

		let canvasWidth = canvas.width;
		let canvasHeight = canvas.height;
		for (let i = 0; i < App.NUM_SENSORS; i++) {
			let x = i * sensorDistance + sensorDistance * 0.5;
			ctx.beginPath();
			ctx.moveTo(x, canvas.height);
			ctx.lineTo(x, heights[i]);
			ctx.stroke();
			ctx.closePath();

			let normalizedHeight = Math.max(0, Math.min(1, (canvas.height - heights[i]) / canvas.height));
			ctx.font = '16px sans-serif';
			ctx.fillStyle = 'white';
			ctx.fillText(normalizedHeight.toFixed(2), x + 8, 24);
		}

		for (let i in circles) {
			ctx.fillStyle = 'black';
			ctx.beginPath();
			ctx.arc(circles[i].x * canvas.width, circles[i].y * canvas.height, circles[i].radius, 0, 2 * Math.PI, false);
			ctx.fill();
			ctx.stroke();
		}

		this.updateOSC(heights);

		requestAnimationFrame(this.draw);
	}
	resize = () => {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		for (let i in circles) {
			circles[i].radius = canvas.width * App.CIRCLE_RADIUS_FACTOR;
		}
	}
	mousedown = (event) => {
		this.isMouseDown = true;
		for (let i in circles) {
			let result = contains(event.clientX, event.clientY, circles[i]);
			if (!result.isContaining) {
				continue;
			}

			if (result.isContaining) {
				this.draggedCircle = {
					dx: result.dx,
					dy: result.dy,
					circle: i,
				};
				return;
			}
		}

		this.draggedCircle = null;
	}
	mouseup = (event) => {
		this.isMouseDown = false;
	}
	mousemove = (event) => {
		if (this.isMouseDown) {
			let c = this.draggedCircle;
			if (c) {
				circles[c.circle].x = (event.clientX + c.dx) / canvas.width;
				circles[c.circle].y = (event.clientY + c.dy) / canvas.height;
			}
		}
	}
	dblclick = (event) => {
		circles.push({
			x: event.clientX / canvas.width,
			y: event.clientY / canvas.height,
			radius: canvas.width * App.CIRCLE_RADIUS_FACTOR,
		});
	}
	keyup = (event) => {
		let key = event.which || event.keyCode;
		switch (key) {
		case 8:
			if (this.draggedCircle) {
				circles.splice(this.draggedCircle.circle, 1);
			}
			break;
		}
	}
	updateOSC = (heights) => {
		// Normalize data
		for (let i = 0; i < heights.length; i++) {
			heights[i] = Math.max(0, Math.min(1, (canvas.height - heights[i]) / canvas.height));
		}

		$.ajax({
			url: '/data',
			method: 'POST',
			data: { heights: JSON.stringify(heights) },
		}).done(function() {
			// do nothing
		}).fail(function(resp) {
			console.log('Failed');
		});
	}
}

ReactDOM.render(<App />, document.getElementById('root'));
