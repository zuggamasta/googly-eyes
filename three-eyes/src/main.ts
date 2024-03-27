// Import all three.js and all extras
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { randFloat } from "three/src/math/MathUtils.js";


// install lil-gui
import { GUI } from "lil-gui";

// install GSAP animation library
import { gsap } from "gsap";

// install html2canvas library
// import html2canvas from "html2canvas";

// install Rive
import * as rive from "@rive-app/canvas";


let clock: THREE.Clock = new THREE.Clock();
let app: HTMLElement;

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

const pi = 3.14159265359;
const raycaster = new THREE.Raycaster(); // create once
const clickMouse = new THREE.Vector2(); // create once

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
  document.getElementById("rive").setAttribute("style", "display:none");
  r.cleanup();

  initInstancing()
}

function init() {
  const gui = new GUI();
  gui.hide();

  initScene();
  loadHDR();
  loadGLB();
  createFloor();
  initRender();
  update();
}

function initScene() {
  // Scene
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.set(0, 200, 0);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
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
  
}


function instanceObject(inputEvent) {
  inputEvent.stopPropagation();
  inputEvent.preventDefault();

  // THREE RAYCASTER
  clickMouse.x = (inputEvent.clientX / window.innerWidth) * 2 - 1;
  clickMouse.y = -(inputEvent.clientY / window.innerHeight) * 2 + 1;
  const found = intersect(clickMouse);

  if (found.length > 0) {

    cloneObject(eye,found);
  }
}

function cloneObject (threeObject,found){
  let copyObject = threeObject.clone();
    copyObject.position.set(
      found[0].point.x,
      found[0].point.y,
      found[0].point.z
    );
    copyObject.rotation.set(
      0,
      -pi/2+randFloat(-1,1),
      0
    );
    let endScale = randFloat(3,8)
    copyObject.scale.set(
      endScale,
      endScale,
      endScale,
    )
    
    let startrot = randFloat(-pi/2-pi,pi-pi/2);
    gsap.from(copyObject.rotation, { duration: 1.33, y:startrot, ease: "elastic.out(1.66, 0.5)"});
    gsap.from(copyObject.scale, { duration: .66, x:0.2, y:0, z:0.3, ease: "elastic.out(1, 0.3)" });

    scene.add(copyObject);
}


function initInstancing(){
  window.addEventListener('touchstart', instanceObject)
  window.addEventListener('click', instanceObject)
}

// function saveScreenshot(){
//   html2canvas(app).then(function(canvas) {
//     // Convert the canvas to a data URL
//     var imgData = canvas.toDataURL("image/jpeg");
//     // Trigger the download
//     downloadImage(imgData, "website_screenshot.jpg");
//   });
// }


// function downloadImage(dataUrl, filename) {
//   var link = document.createElement('a');
//   link.href = dataUrl;
//   link.download = filename;
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
// }

function update() {
  requestAnimationFrame(update);
  delta = clock.getDelta();
  delta *= 1;
  renderer.render(scene, camera);
}


function intersect(pos: THREE.Vector2) {
  raycaster.setFromCamera(pos, camera);
  return raycaster.intersectObjects(scene.children);
}


const r = new rive.Rive({
  src: "rive/intro.riv",
  canvas: document.getElementById("rive") as HTMLCanvasElement,  
  autoplay: true,
  stateMachines: "Intro",

  onLoad: () => {
    r.resizeDrawingSurfaceToCanvas();
  },
});

init();
