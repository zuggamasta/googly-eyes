import * as THREE from "three";
import { randFloat } from "three/src/math/MathUtils.js";

let scene: THREE.Scene;

let draggable: THREE.Object3D;


const moveMouse = new THREE.Vector2(); // create once


window.addEventListener("touch", (event) => {
  const touch: any = event.touches ? event.touches[0] : event;

  console.log(scene);
  if (draggable != null) {
    console.log(`dropping draggable ${draggable.userData.name}`);
    draggable.rotateY(randFloat(-180, 180));
    draggable = null as any;
    return;
  }

  console.log();
  if (found[0].object.userData.draggable) {
    draggable = found[0].object;
    console.log(`found draggable ${draggable.userData.name}`);
  } else if (found[0].object.parent.userData.draggable) {
    draggable = found[0].object.parent;
    console.log(`found draggable ${draggable.userData.name}`);
  }

});


window.addEventListener("mousemove", (event) => {
  moveMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  moveMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

function dragObject() {
  if (draggable != null) {
    const found = intersect(moveMouse);
    if (found.length > 0) {
      for (let i = 0; i < found.length; i++) {
        if (!found[i].object.userData.ground) continue;

        let target = found[i].point;
        draggable.position.x = target.x;
        draggable.position.z = target.z;
      }
    }
  }
}