interface LandingConfig {
  modelStudent: string
  modelTeacher: string
  modelParentA: string
  modelParentB: string
  modelRobot: string
  studentClips: { idle: string; wave: string; walk: string; float: string; sit: string; think: string; celebrate: string }
  teacherClips: { idle: string; write: string; sit: string }
  parentClips: { idle: string; clap: string }
}

function env(name: string, fallback: string): string {
  const value = import.meta.env[name]
  return typeof value === "string" && value.length > 0 ? value : fallback
}

function clip(role: string, name: string, fallback: string): string {
  return env(`VITE_LANDING_CLIP_${role}_${name}`, fallback)
}

export const landingConfig: LandingConfig = {
  modelStudent: env("VITE_LANDING_MODEL_STUDENT", "/models/student.glb"),
  modelTeacher: env("VITE_LANDING_MODEL_TEACHER", "/models/teacher.glb"),
  modelParentA: env("VITE_LANDING_MODEL_PARENT_A", "/models/parent-a.glb"),
  modelParentB: env("VITE_LANDING_MODEL_PARENT_B", "/models/parent-b.glb"),
  modelRobot: env("VITE_LANDING_MODEL_ROBOT", "/models/robot.glb"),
  studentClips: {
    idle: clip("STUDENT", "IDLE", "Idle"),
    wave: clip("STUDENT", "WAVE", "Wave"),
    walk: clip("STUDENT", "WALK", "Walk"),
    float: clip("STUDENT", "FLOAT", "t-pose"),
    sit: clip("STUDENT", "SIT", "Sit"),
    think: clip("STUDENT", "THINK", "Think"),
    celebrate: clip("STUDENT", "CELEBRATE", "Celebrate"),
  },
  teacherClips: {
    idle: clip("TEACHER", "IDLE", "Idle"),
    write: clip("TEACHER", "WRITE", "Write"),
    sit: clip("TEACHER", "SIT", "Sit"),
  },
  parentClips: {
    idle: clip("PARENT", "IDLE", "Idle"),
    clap: clip("PARENT", "CLAP", "Clap"),
  },
}

export const ALL_LANDING_MODELS = [
  landingConfig.modelStudent,
  landingConfig.modelParentA,
  landingConfig.modelParentB,
  landingConfig.modelRobot,
]