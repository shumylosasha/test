"use strict";

const particleCount = 500;
const particlePropCount = 9;
const particlePropsLength = particleCount * particlePropCount;
const rangeY = 100;
const rangeZ = 200;
const baseTTL = 50;
const rangeTTL = 200;
const baseHue = rand(360);
const rangeHue = 100;
const xOff = 0.00025;
const yOff = 0.00025;
const zOff = 0.00025;
const tOff = 0.0005;
const noiseSteps = ceil(rand(4)) + 4;
const backgroundColor = "hsla(0,0%,0%,0.5)";

let canvas;
let ctx;
let center;
let tick;
let simplex;
let particleProps;

function setup() {
	createCanvas();
	resize();
	initParticles();

	draw();
}

function initParticles() {
	tick = 0;
	simplex = new SimplexNoise();
	particleProps = new Float32Array(particlePropsLength);

	let i = 0;

	for (; i < particlePropsLength; i += particlePropCount) {
		initParticle(i);
	}
}

function initParticle(i) {
	let x, y, z, vx, vy, vz, life, ttl, speed, radius, hue;

	x = rand(canvas.a.width);
	y = center[1] + randIn(-rangeY, rangeY);
	z = rand(rangeZ);
	vx = 0;
	vy = 0;
	vz = 0;
	life = 0;
	ttl = baseTTL + rand(rangeTTL);
	speed = 0;

	particleProps.set([x, y, z, vx, vy, vz, life, ttl, speed], i);
}

function drawParticles() {
	let i = 0;

	for (; i < particlePropsLength; i += particlePropCount) {
		updateParticle(i);
	}
}

function updateParticle(i) {
	let n, theta, phi, x2, y2, z2, width, hue;

	let [x, y, z, vx, vy, vz, life, ttl, speed] = particleProps.get(
		i,
		particlePropCount
	);

	n = simplex.noise4D(x * xOff, y * yOff, z * zOff, tick * tOff) * noiseSteps;
	theta = n * TAU * 2;
	phi = (1 - n) * TAU;
	vx = lerp(vx, cos(theta) * cos(phi), 0.15);
	vy = lerp(vy, sin(phi), 0.15);
	vz = lerp(vz, sin(theta) * cos(phi), 0.15);
	x2 = x + vx * speed;
	y2 = y + vy * speed;
	z2 = z + vz * speed;
	width = 0.015 * z2 + 2;
	speed = lerp(speed, 0.05 * z2, 0.15);
	hue = baseHue + speed * 0.05 * rangeHue;

	drawParticle(x, y, z, x2, y2, life, ttl, width, hue);

	life++;

	particleProps.set([x2, y2, z2, vx, vy, vz, life, ttl, speed], i);

	(checkBounds(x, y, width) || life > ttl) && initParticle(i);
}

function drawParticle(x, y, z, x2, y2, life, ttl, width, hue) {
	ctx.a.save();
	ctx.a.lineWidth = width;
	ctx.a.strokeStyle = `hsla(${hue + clamp(z, 0, 180)},${clamp(
		z,
		10,
		60
	)}%,${clamp(z, 10, 50)}%,${fadeInOut(life, ttl) *
		(0.01 * clamp(z, 50, 100))})`;
	ctx.a.beginPath();
	ctx.a.moveTo(x, y);
	ctx.a.lineTo(x2, y2);
	ctx.a.stroke();
	ctx.a.closePath();
	ctx.a.restore();
}

function checkBounds(x, y, r) {
	return x > r + canvas.a.width || x < -r || y > r + canvas.a.height || y < -r;
}

function createCanvas() {
	canvas = {
		a: document.createElement("canvas"),
		b: document.createElement("canvas")
	};

	canvas.b.style = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	`;
	document.body.appendChild(canvas.b);
	ctx = {
		a: canvas.a.getContext("2d"),
		b: canvas.b.getContext("2d")
	};

	center = [];
}

function resize() {
	const { innerWidth, innerHeight } = window;

	canvas.a.width = innerWidth;
	canvas.a.height = innerHeight;

	ctx.a.drawImage(canvas.b, 0, 0);

	canvas.b.width = innerWidth;
	canvas.b.height = innerHeight;

	ctx.b.drawImage(canvas.a, 0, 0);

	center[0] = 0.5 * canvas.a.width;
	center[1] = 0.5 * canvas.a.height;
}

function renderGlow() {
	ctx.b.save();
	ctx.b.filter = "blur(8px) brightness(200%)";
	ctx.b.globalCompositeOperation = "lighter";
	ctx.b.drawImage(canvas.a, 0, 0);
	ctx.b.restore();

	ctx.b.save();
	ctx.b.filter = "blur(4px) brightness(200%)";
	ctx.b.globalCompositeOperation = "lighter";
	ctx.b.drawImage(canvas.a, 0, 0);
	ctx.b.restore();
}

function renderToScreen() {
	ctx.b.save();
	ctx.b.globalCompositeOperation = "lighter";
	ctx.b.drawImage(canvas.a, 0, 0);
	ctx.b.restore();
}

function drawBackground() {
	ctx.a.clearRect(0, 0, canvas.a.width, canvas.a.height);

	ctx.b.fillStyle = backgroundColor;
	ctx.b.fillRect(0, 0, canvas.a.width, canvas.a.height);
}

function draw() {
	tick++;

	drawBackground();
	drawParticles();
	renderGlow();
	renderToScreen();

	window.requestAnimationFrame(draw);
}

window.addEventListener("load", setup);
window.addEventListener("resize", resize);

