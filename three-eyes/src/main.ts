import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GUI } from "lil-gui";
import { Vector3 } from "three";
import { randFloat } from "three/src/math/MathUtils.js";

let clock: THREE.Clock = new THREE.Clock();
let app: HTMLElement;

// const container: HTMLElement = document.getElementById("container")!;
// container.addEventListener("click", onMouseClick);
// function onMouseClick() {
//   console.log("onMouseClick()")
// }

const container: HTMLElement = document.getElementById("container")!;

let renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  imageholder: THREE.Mesh,
  eye: THREE.Object3D,
  delta: number;

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
const raycaster = new THREE.Raycaster(); // create once
const clickMouse = new THREE.Vector2(); // create once
var draggable: THREE.Object3D;

function createFloor() {
  let pos = { x: 0, y: -1, z: 3 };
  let scale = { x: 1000, y: 0.01, z: 1000 };

  imageholder = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0,
      transparent: true,
    })
  );
  imageholder.position.set(pos.x, pos.y, pos.z);
  imageholder.scale.set(scale.x, scale.y, scale.z);
  imageholder.castShadow = true;
  imageholder.receiveShadow = true;
  scene.add(imageholder);

  imageholder.userData.ground = true;
}

function loadHDR() {
  const hdrLoader = new RGBELoader();

  hdrLoader
    .setPath("textures/")
    .load("studio_small_09_1k.hdr", function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
    });
}

function loadGLB() {
  const loader = new GLTFLoader();

  // Player Model
  loader.load("glb/eyes.glb", function (gltf) {
    eye = gltf.scene;
    //originalModel.getObjectByName("Inside")!.castShadow = true;
    //originalModel.getObjectByName("Base")!.receiveShadow = true;
    eye.userData.draggable = true;
    eye.userData.name = "EYE";

    eye.scale.x = 10;
    eye.scale.y = 10;
    eye.scale.z = 10;

    // dont add eye to scene, we only instance after 
    // scene.add(eye);
  });
}

document.getElementById("imageInput").addEventListener("change", function (e) {
  e.preventDefault(); // Prevent the form from submitting normally
  const fileInput: any = document.getElementById("imageInput");
  const file: any = fileInput.files[0];
  const reader = new FileReader();

  reader.onloadend = function () {
    const base64String = reader.result;
    displayImage(base64String);
  };

  reader.readAsDataURL(file); // Read the file as a Base64 encoded string
});

function displayImage(base64String) {
  const imgElement = document.createElement("img");
  imgElement.setAttribute("style", "object-fit:cover");
  imgElement.setAttribute("style", "width:100%");
  imgElement.setAttribute("style", "max-width:100%");
  imgElement.src = base64String;
  container.appendChild(imgElement);
  document.getElementById("pseudoButton").setAttribute("style", "display:none");
  initInstancing()
}

function init() {
  const gui = new GUI();
  gui.hide();

  // Scene
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  //camera.position.z = 10
  camera.position.set(0, 200, 0);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  loadHDR();
  loadGLB();
  createFloor();
  initRender();
  update();
}

function initRender() {
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(devicePixelRatio);
  // console.log(devicePixelRatio);
  // renderer.shadowMap.enabled = true;
  // renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMappingExposure = 2;
  renderer.domElement.id = "canvas";
  app = document.getElementById("app")!;
  app.appendChild(renderer.domElement);
}

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function intersect(pos: THREE.Vector2) {
  raycaster.setFromCamera(pos, camera);
  return raycaster.intersectObjects(scene.children);
}

function initInstancing(){
  window.addEventListener("click", (event) => {
    console.log(scene);
    if (draggable != null) {
      console.log(`dropping draggable ${draggable.userData.name}`);
      draggable.rotateY(randFloat(-180, 180));
      draggable = null as any;
      return;
    }
  
    // THREE RAYCASTER
    clickMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    clickMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
    const found = intersect(clickMouse);
    if (found.length > 0) {
      let copyObject = eye.clone();
      copyObject.position.set(
        found[0].point.x,
        found[0].point.y,
        found[0].point.z
      );
  
      scene.add(copyObject);
  
      console.log();
      if (found[0].object.userData.draggable) {
        draggable = found[0].object;
        console.log(`found draggable ${draggable.userData.name}`);
      } else if (found[0].object.parent.userData.draggable) {
        draggable = found[0].object.parent;
        console.log(`found draggable ${draggable.userData.name}`);
      }
    }
  });
  
  window.addEventListener("touch", (event) => {
    const touch: any = event.touches ? event.touches[0] : event;
  
    // Calculate the mouse position
    clickMouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    clickMouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
  
    const found = intersect(clickMouse);
    if (found.length > 0) {
      let copyObject = eye.clone();
      copyObject.position.set(
        found[0].point.x,
        found[0].point.y,
        found[0].point.z
      );
  
      scene.add(copyObject);
    };
  });
  
}

function update() {
  requestAnimationFrame(update);
  delta = clock.getDelta();
  eye.rotateOnAxis(new Vector3(0, 1, 0), delta * 3);
  let uniform = randFloat(5, 15);
  eye.scale.x = uniform;
  eye.scale.y = uniform;
  eye.scale.z = uniform;

  renderer.render(scene, camera);
}

init();
