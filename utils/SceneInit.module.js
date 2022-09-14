import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export class SceneInit {
	constructor(canvas) {
		this.canvas = canvas;
	}

	initScene() {
		this.fov = 60;
		this.camera = new THREE.PerspectiveCamera(
			this.fov,
			window.innerWidth / window.innerHeight,
			0.1,
			8000
		);
		// this.camera.position.z = 10;

		this.clock = new THREE.Clock();
		this.scene = new THREE.Scene();

		this.uniforms = {
			u_time: { type: "f", value: 1.0 },
			colorB: { type: "vec3", value: new THREE.Color(0xfff000) },
			colorA: { type: "vec3", value: new THREE.Color(0xffffff) },
		};

		this.renderer = new THREE.WebGLRenderer(
			this.canvas ? { canvas: this.canvas } : {}
		);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(this.renderer.domElement);

		this.controls = new OrbitControls(
			this.camera,
			this.renderer.domElement
		);
		// this.controls.enablePan = false;

		window.addEventListener("resize", () => this.onWindowResize(), false);
	}

	animate() {
		window.requestAnimationFrame(this.animate.bind(this));
		this.render();
		this.controls.update();
	}

	render() {
		this.uniforms.u_time.value += this.clock.getDelta();
		this.renderer.render(this.scene, this.camera);
	}

	onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}
}
