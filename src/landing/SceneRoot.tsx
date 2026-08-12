import { CameraRig } from "./CameraRig"
import { PostFX } from "./effects/PostFX"
import { SceneManager } from "./SceneManager"
import { Student } from "./characters/Student"

/** Scene-wide lights — background color and fog are owned by the SceneManager. */
function SceneSetup() {
  return (
    <>
      <ambientLight intensity={0.62} />
      <hemisphereLight args={["#dbe9ff", "#c9d6c4", 0.75]} />
      <directionalLight position={[6, 10, 5]} intensity={1.6} color="#fff4e0" />
      <directionalLight position={[-7, 4, -6]} intensity={0.55} color="#cdd9ff" />
    </>
  )
}

export function SceneRoot() {
  return (
    <>
      <SceneSetup />
      <CameraRig />
      <SceneManager />
      <Student />
      <PostFX />
    </>
  )
}
