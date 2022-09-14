import * as THREE from "three";
import "./style.css";
import { SceneInit } from "./utils/SceneInit.module";
import stars from "/img/bg3.png";
import sunTexture from "/img/sun.jpg";
import mercuryTexture from "/img/mercury.jpg";
import venusTexture from "/img/venus.jpg";
import earthTexture from "/img/earth.jpg";
import marsTexture from "/img/mars.jpg";
import jupiterTexture from "/img/jupiter.jpg";
import saturnTexture from "/img/saturn.jpg";
import saturnRingTexture from "/img/saturnRing.png";
import uranusTexture from "/img/uranus.jpg";
import uranusRingTexture from "/img/uranusRing.png";
import neptuneTexture from "/img/neptune.jpg";
import gsap from "gsap";

// Init

const screen = new SceneInit();
screen.initScene();

const textureLoader = new THREE.TextureLoader();
const cameraPos = [1, 1, 65];

var flag = true,
	isVisible = true;
const EARTH_YEAR = 2 * Math.PI * (1 / 60) * (1 / 60);
screen.camera.position.set(...cameraPos);

var planets = [
	["Sun", 8, 0, 0.004, 0, sunTexture, 27.01],
	["Mercury", 3, 16, 0.004, 3, mercuryTexture, 0.38],
	["Venus", 4, 32, 0.002, 2, venusTexture, 0.91],
	["Earth", 5, 48, 0.01, 1, earthTexture, 1],
	["Mars", 4, 64, 0.02, 0.5, marsTexture, 0.38],
	["Jupiter", 8, 83, 0.03, 0.25, jupiterTexture, 2.38],
	[
		"Saturn",
		6,
		107,
		0.04,
		0.125,
		saturnTexture,
		1.06,
		{
			innerRadius: 7,
			outerRadius: 12,
			texture: saturnRingTexture,
		},
	],
	[
		"Uranus",
		6,
		138,
		0.05,
		0.0625,
		uranusTexture,
		0.92,
		{
			innerRadius: 6,
			outerRadius: 12,
			texture: uranusRingTexture,
		},
	],
	["Neptune", 6, 163, 0.06, 0.03125, neptuneTexture, 1.19],
];

// Function to create planets

const solarSystem = new THREE.Group();
screen.scene.add(solarSystem);

function createPlanet(i, name, size, position, meshR, sysR, texture, g, ring) {
	// Planet
	const mesh = new THREE.Mesh(
		new THREE.SphereGeometry(size),
		i ? new THREE.MeshStandardMaterial() : new THREE.MeshBasicMaterial()
	);
	mesh.material.map = textureLoader.load(texture);
	mesh.position.x += position;
	mesh.name = name;
	mesh.uuid = i;
	const system = i ? new THREE.Group() : solarSystem;
	system.add(mesh);
	screen.scene.add(system);
	let res = size;

	// Planet's Ring
	var ringMesh;
	if (ring) {
		ringMesh = new THREE.Mesh(
			new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, 32),
			new THREE.MeshBasicMaterial({
				map: textureLoader.load(ring.texture),
				side: THREE.DoubleSide,
				// wireframe: true,
			})
		);
		system.add(ringMesh);
		ringMesh.position.x = position;
		ringMesh.rotation.x = -0.5 * Math.PI;
		res += ring.outerRadius;
	}

	// Planet's orbit
	var orbitMesh;
	if (i) {
		orbitMesh = new THREE.Mesh(
			new THREE.RingGeometry(position + 0.5, position, 64),
			new THREE.MeshBasicMaterial({
				color: 0xffffff,
				side: THREE.DoubleSide,
				// wireframe: true,
			})
		);
		screen.scene.add(orbitMesh);
		orbitMesh.rotation.x = -0.5 * Math.PI;
	}

	// Adding button
	const header = document.getElementsByTagName("header")[0];
	let btn = document.createElement("button");
	btn.innerHTML = name;
	btn.setAttribute("id", i);
	header.appendChild(btn);
	btn.addEventListener("click", () => zoomTo(mesh));

	// object
	size = res;
	let pos = [position, 0, 0];
	planets[i] = {
		mesh: mesh,
		system: system,
		size: size,
		f: (wt, factor = 1) => {
			return wt * factor;
		},
		g: g,
		meshR: meshR,
		sysR: sysR,
		init: pos,
		ring: ringMesh,
		orbit: orbitMesh,
	};
}

// Lights

const sunLight = new THREE.PointLight(0xffffff, 2, 300);
screen.scene.add(sunLight);

const myLight = new THREE.AmbientLight(0xffffff, 0.8);
screen.scene.add(myLight);
myLight.visible = false;

// Adding planets

planets.forEach((e, i) => {
	createPlanet(i, ...e);
});

document.body.addEventListener("keydown", function (e) {
	if (e.keyCode == 27) {
		if (isVisible) return;

		myLight.visible = false;
		flag = true;
		document.addEventListener("mousedown", onMouseDown);

		planets.forEach((e) => {
			e.mesh.position.set(...e.init);
			e.mesh.visible = true;
			if (e.orbit) {
				e.orbit.visible = true;
			}
			if (e.ring) {
				e.ring.position.set(...e.init);
				e.ring.visible = true;
			}
		});

		gsap.timeline({
			defaults: {
				duration: 1.5,
				ease: "ease.out",
			},
		})
			.to(screen.controls.target, cameraPos)
			.to(
				screen.camera.position,
				{
					x: cameraPos[0],
					y: cameraPos[1],
					z: cameraPos[2],
				},
				0
			);
		isVisible = true;
	}
});

// Raycaster & MouseDown Event

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function setFromCamera(raycaster, coords, origin) {
	raycaster.ray.origin.copy(screen.camera.position);
	raycaster.ray.direction
		.set(coords.x, coords.y, 0.5)
		.unproject(screen.camera)
		.sub(screen.camera.position)
		.normalize();
}

function onMouseDown(event) {
	// Current Cursor positions
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	setFromCamera(raycaster, mouse, screen.camera);
	// Selecting intersecting objects
	var obs = planets.map((e) => {
		return e.system;
	});
	var intersects = raycaster.intersectObjects(obs);

	if (intersects.length) {
		zoomTo(intersects[0].object);
	}
}

var selected;
const input = document.getElementById("inpt");
const res = document.getElementById("res");
input.addEventListener("keyup", displayNewWt);
input.addEventListener("change", displayNewWt);
function displayNewWt() {
	if (!isVisible) {
		res.innerHTML =
			"Your weight on " +
			selected.mesh.name +
			": " +
			(input.value * selected.g).toFixed(2);
	}
}

function zoomTo(obj) {
	for (let i = 0; i < planets.length; ++i) {
		planets[i].mesh.visible = false;
		if (planets[i].orbit) {
			planets[i].orbit.visible = false;
		}
		if (planets[i].ring) {
			planets[i].ring.visible = false;
		}
	}
	obj.visible = true;
	if (planets[obj.uuid].ring) {
		planets[obj.uuid].ring.visible = true;
		planets[obj.uuid].ring.position.set(0, 0, 0);
	}
	isVisible = false;

	flag = false; // Pause the planets rotation around sun
	myLight.visible = true; // Make the AmbientLight visible

	// Zoom to the selected planet

	var r = obj.geometry.boundingSphere.radius;

	obj.position.set(0, 0, 0);
	screen.camera.lookAt(obj.position);

	selected = planets[obj.uuid];

	gsap.timeline({
		defaults: {
			duration: 1.5,
			ease: "ease.out",
		},
	})
		.to(screen.controls.target, obj.position)
		.to(
			screen.camera.position,
			{
				x: obj.position.x + r * 2,
				y: 1,
				z: obj.position.z + r * 3,
			},
			0
		);

	document.removeEventListener("mousedown", onMouseDown); // removing add event listener for now
	displayNewWt(); // displaying updated weight
}

document.addEventListener("mousedown", onMouseDown);

// window.addEventListener("wheel", zoom);

screen.controls.minZoom = 1;
screen.controls.maxZoom = 1;

// AxesHelper

// const axesHelper = new THREE.AxesHelper(150);
// screen.scene.add(axesHelper);

const cubeTextureLoader = new THREE.CubeTextureLoader();
screen.scene.background = cubeTextureLoader.load([
	stars,
	stars,
	stars,
	stars,
	stars,
	stars,
]);

screen.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const render = (time) => {
	planets.forEach((e) => {
		e.mesh.rotateY(e.meshR);
		if (flag) {
			e.system.rotateY(EARTH_YEAR * e.sysR);
		}
	});
	if (isVisible) {
		res.innerHTML = "";
	}

	requestAnimationFrame(render);
};

render();

screen.animate();
