import './style.css';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TextureLoader } from 'three';

/**
 * Base
 */
// Debug
//const gui = new dat.GUI();

const ballFollower = document.querySelector('.ballFollower');
// Canvas
const gameWrapper = document.querySelector('.gameContainer');
const lostGame = document.querySelector('.lostGame');
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**Update All MAterials */
const updateAllMaterials = () => {
	scene.traverse((child) => {
		if (
			child instanceof THREE.Mesh &&
			child.material instanceof THREE.MeshStandardMaterial
		) {
			child.material.needsUpdate = true;
			child.castShadow = true;
			child.receiveShadow = true;
		}
	});
};

/**Models */

const gltfLoader = new GLTFLoader();
let racket;

gltfLoader.load(
	'https://uploads-ssl.webflow.com/602e8a5e1ca547507804f0b0/631b3e2ca0927ff3a0383a64_RACKET.glb.txt',
	(gltf) => {
		scene.add(gltf.scene);
		racket = gltf.scene;
		racket.rotation.y = 0.5;
		racket.receiveShadow = true;
		updateAllMaterials();
		// objects.push(...racket.children);
	}
);

const ballTexture = new TextureLoader().load(
	'https://uploads-ssl.webflow.com/602e8a5e1ca547507804f0b0/631b0e559148ed0242f71049_asiPong.png'
);
ballTexture.wrapS = THREE.MirroredRepeatWrapping;
ballTexture.wrapT = THREE.MirroredRepeatWrapping;
ballTexture.repeat.x = 2;
let BallMaterial = new THREE.MeshStandardMaterial({
	map: ballTexture,
});

const ball = new THREE.Mesh(
	new THREE.SphereGeometry(0.3, 32, 32),
	BallMaterial
);
scene.add(ball);

/**PHYSICS */
const defaultMaterial = new CANNON.Material('concrete');
const defaultContactMaterial = new CANNON.ContactMaterial(
	defaultMaterial,
	defaultMaterial,
	{
		restitution: 0.7,
	}
);
const world = new CANNON.World();
world.solver.iterations = 1000;
world.solver.tolarence = 0.0001;
world.gravity.set(0, -9.82, 0);
const sphereShape = new CANNON.Sphere(0.3);
const sphereBody = new CANNON.Body({
	mass: 1,
	position: new CANNON.Vec3(0, 6, 0),
	shape: sphereShape,
});
world.addBody(sphereBody);

const racketShape = new CANNON.Cylinder(1, 1, 0.15, 64);
const racketBody = new CANNON.Body();

racketBody.mass = 0;
racketBody.addShape(racketShape);
world.addBody(racketBody);

world.addContactMaterial(defaultContactMaterial);
world.defaultContactMaterial = defaultContactMaterial;

sphereBody.applyForce(new CANNON.Vec3(-5, 0, 0), sphereBody.position);

/**
 * Collision
 */

const hitSound = new Audio(
	'https://firebasestorage.googleapis.com/v0/b/yarmix-7c34e.appspot.com/o/hit.mp3?alt=media&token=e4017741-2b27-4c5f-90a4-cac54c3a3bef'
);

let counter = document.querySelector('.counter');
let counterNumber = 1;
const collision = () => {
	if (Math.abs(sphereBody.velocity.y) > 1) {
		counter.innerHTML = counterNumber;
		counterNumber++;
		hitSound.play();
	}
};

sphereBody.addEventListener('collide', collision);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
	width: gameWrapper.offsetWidth,
	height: gameWrapper.offsetHeight,
};
window.addEventListener('resize', () => {
	// Update sizes
	sizes.width = gameWrapper.offsetWidth;
	sizes.height = gameWrapper.offsetHeight;

	// Update camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
	35,
	sizes.width / sizes.height,
	0.1,
	100
);
camera.position.set(0, 2, 10);
scene.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.setClearColor(0x46515d, 1);

/**
 * Animate
 */

/**Mouse */
// let enableSelection = false;
let mouse = new THREE.Vector2();
// raycaster = new THREE.Raycaster();

let mouseMove = false;

window.addEventListener('pointermove', (event) => {
	if (mouseMove) {
		mouse.x = (event.layerX / sizes.width) * 2 - 1;
		mouse.y = -(event.layerY / sizes.height) * 2 + 1;
	}
});
if (sizes.width < sizes.height) {
	// /**Mobile Controls */
	const dragrack = new THREE.Mesh(
		new THREE.BoxGeometry(2, 0.2, 3),
		new THREE.MeshStandardMaterial({
			visible: false,
		})
	);
	dragrack.position.y = 0.1;
	// dragrack.position.z = 1;
	scene.add(dragrack);
	const objects = [];
	objects.push(dragrack);
	const controls = new DragControls(objects, camera, renderer.domElement);
	controls.transformGroup = true;

	controls.addEventListener('drag', (event) => {
		dragrack.rotation.z = mouse.x * 0.3;
		racketBody.quaternion.z = dragrack.quaternion.z;
		dragrack.rotation.y = mouse.x;
		racket.position.copy(dragrack.position);
		racket.rotation.copy(dragrack.rotation);
		racket.position.y = dragrack.position.y - 0.08;
		racketBody.position.copy(dragrack.position);
	});
}

/**cannon debuger */
// const cannonDebuger = new CannonDebugger(scene, world, {
// 	color: 0xff0000,
// });

let lost = false;
const clock = new THREE.Clock();
let oldElapsedTime = 0;

function tick() {
	if (lost) {
		return;
	} else {
		const elapsedTime = clock.getElapsedTime();
		const deltaTime = elapsedTime - oldElapsedTime;

		oldElapsedTime = elapsedTime;
		if (!mouseMove) {
			racket.position.set(0, 0, 0);
		}
		ball.quaternion.copy(sphereBody.quaternion);
		if (sizes.width > sizes.height) {
			if (racket && mouseMove) {
				racket.position.x = mouse.x * 6;
				racket.position.y = mouse.y * 4 + 2;
				racketBody.position.copy(racket.position);
				racketBody.position.y = racket.position.y + 0.08;
				racket.rotation.z = mouse.x * 0.3;
				racketBody.quaternion.z = racket.quaternion.z;
				racket.rotation.y = mouse.x;
			}
		}
		if (ball.position.y > 5.5) {
			ballFollower.style.display = 'block';
			if (sizes.width > sizes.height) {
				ballFollower.style.marginLeft =
					ball.position.x * (sizes.width / 6) + 'px';
			} else {
				ballFollower.style.marginLeft =
					ball.position.x * (sizes.width / 1.5) + 'px';
			}
		} else {
			ballFollower.style.display = 'none';
		}
		if (sphereBody.position.y < -1.5) {
			lost = true;
			resetGameMenu();
		}

		//upadte Physics

		world.step(1 / 240, deltaTime);
		ball.position.copy(sphereBody.position);
		// cannonDebuger.update();
		// Update controls
		// controls.update();

		// Render
		renderer.render(scene, camera);

		// Call tick again on the next frame
		window.requestAnimationFrame(tick);
	}
}

let startGameBtn = document.querySelector('.startGame');
startGameBtn.addEventListener('click', startGame);
let replayGameBtn = document.querySelector('.replay');
replayGameBtn.addEventListener('click', resetGame);

let score = document.querySelector('.score');

function startGame() {
	startGameBtn.style.display = 'none';
	tick();
	setTimeout(() => {
		mouseMove = true;
	}, 20);

	document.querySelector('.scroll-trigger').click();
}
function resetGameMenu() {
	if (counterNumber === 0) {
		score.innerHTML = 0;
	}
	score.innerHTML = counterNumber - 1;
	lostGame.style.display = 'block';
	mouseMove = false;

	document.querySelector('.scroll-trigger').click();
}
function resetGame() {
	lost = false;
	counterNumber = 1;
	counter.innerHTML = 0;
	lostGame.style.display = 'none';
	sphereBody.position.set(0, 6, 0);
	sphereBody.velocity.setZero();
	sphereBody.force.setZero();
	sphereBody.angularVelocity.setZero();
	sphereBody.applyForce(new CANNON.Vec3(-5, 0, 0), sphereBody.position);
	world.gravity.set(0, 0, 0);

	mouseMove = true;

	tick();

	setTimeout(() => {
		world.gravity.set(0, -9.82, 0);
	}, 500);
	document.querySelector('.scroll-trigger').click();
}
