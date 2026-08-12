import * as THREE from "three"

/**
 * Live scene state shared with the DOM overlay layer (read inside scroll
 * subscribers, never in React render). The camera reference and the robot's
 * world position are republished every frame by CameraRig and Robot.
 */
export const viewState = {
  camera: null as THREE.Camera | null,
}

export const robotState = {
  pos: new THREE.Vector3(),
}