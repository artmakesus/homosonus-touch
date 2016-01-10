let React = require('react');
let ReactDOM = require('react-dom');
let $ = require('jquery');

function intersect(x1, x2, y2, radius) {
	if (x1 < x2 - radius || x1 > x2 + radius) {
		return null;
	}

	let dx = x2 - x1;
	let dy = Math.sqrt(radius * radius - dx * dx);
	let angle = Math.atan2(dy, dx);
	return {
		x: x2 + Math.cos(angle) * radius,
		y: y2 + Math.sin(angle) * radius,
	};
}

class App extends React.Component {
	static NUM_SENSORS = 10
	render() {
		return (
			<canvas id='canvas' ref='canvas'></canvas>
		)
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

		// Handle animation
		this.ctx = this.refs.canvas.getContext('2d');
		requestAnimationFrame(this.draw);
	}
	draw = () => {
		let canvas = this.refs.canvas;
		let ctx = this.ctx;
		ctx.fillStyle = 'black';
		ctx.strokeStyle = 'white';

		let sensorDistance = canvas.width / App.NUM_SENSORS;
		let radius = canvas.width * 0.075;

		let heights = [];
		for (let i = 0; i < App.NUM_SENSORS; i++) {
			if (this.isMouseDown) {
				let x = i * sensorDistance + sensorDistance * 0.5;
				let p = intersect(x, this.mouseX, this.mouseY, radius);
				if (p) {
					heights.push(p.y);
				} else {
					heights.push(0);
				}
			} else {
				heights.push(0);
			}
		}

		ctx.fillRect(0, 0, this.refs.canvas.width, this.refs.canvas.height);
		for (let i = 0; i < App.NUM_SENSORS; i++) {
			let x = i * sensorDistance + sensorDistance * 0.5;
			ctx.beginPath();
			ctx.moveTo(x, canvas.height);
			ctx.lineTo(x, heights[i]);
			ctx.stroke();
			ctx.closePath();
		}

		if (this.isMouseDown) {
			ctx.beginPath();
			ctx.arc(this.mouseX, this.mouseY, radius, 0, 2 * Math.PI, false);
			ctx.fill();
			ctx.stroke();
		}

		this.updateOSC(heights);

		requestAnimationFrame(this.draw);
	}
	resize = () => {
		this.refs.canvas.width = window.innerWidth;
		this.refs.canvas.height = window.innerHeight;
	}
	mousedown = (event) => {
		this.isMouseDown = true;
		this.mouseX = event.clientX;
		this.mouseY = event.clientY;
	}
	mouseup = (event) => {
		this.isMouseDown = false;
		this.mouseX = event.clientX;
		this.mouseY = event.clientY;
	}
	mousemove = (event) => {
		this.mouseX = event.clientX;
		this.mouseY = event.clientY;
	}
	updateOSC = (heights) => {
		// Normalize data
		for (let i = 0; i < heights.length; i++) {
			heights[i] = Math.max(0, Math.min(1, (canvas.height - heights[i]) / canvas.height));
		}

		$.ajax({
			url: '/data',
			method: 'POST',
			data: { data: JSON.stringify(heights) },
		}).done(function() {
		}).fail(function(resp) {
			console.log('Failed');
		});
	}
}

ReactDOM.render(<App />, document.getElementById('root'));
