import * as THREE from "three"
import { SECTION_COUNT, sectionStart, sectionWidth, localProgress } from "./progress"

export type EnvKey = "skyA" | "gate" | "portal" | "tunnel" | "school" | "skyB"

/**
 * Pocket-world scene table. The student is always the center of interest:
 * camera offsets are relative to the student, so the hero can never be pushed
 * out of frame. Each scene also names the environment pocket that is visible.
 */
export interface SceneDef {
  camPos: [number, number, number]
  camTarget: [number, number, number]
  env: EnvKey
}

export const SCENES: SceneDef[] = [
  // 0 — The Hello: waving on a clear sky
  { camPos: [0, 1.15, 2.75], camTarget: [0, 1.35, 0], env: "skyA" },
  // 1 — The Fall: plunging together through the sky
  { camPos: [0.8, 1.3, 2.6], camTarget: [0, 1.3, 0], env: "skyA" },
  // 2 — The School Gate: walk-in from behind, gate ahead
  { camPos: [0, 1.25, -2.6], camTarget: [0, 1.2, 2], env: "gate" },
  // 3 — Portal part 1: approaching the ring, student dead-center
  { camPos: [0, 1.55, -2.8], camTarget: [0, 1.35, -6], env: "portal" },
  // 4 — Portal part 2: inside the tunnel, dead-center behind the student
  { camPos: [0, 1.5, 4.2], camTarget: [0, 1.35, 0], env: "tunnel" },
  // 5 — The school builds itself: drop + room assembly, 3/4 behind-right
  { camPos: [0.7, 1.25, 2.8], camTarget: [0, 1.2, 0.5], env: "school" },
  // 6 — Test 1: front shot, paper floats between camera and student
  { camPos: [0, 1.35, 3.4], camTarget: [0, 1.3, 1], env: "school" },
  // 7 — Robot talk: robot at screen right, camera front-right
  { camPos: [0.6, 1.3, 3.3], camTarget: [0, 1.25, 0.4], env: "school" },
  // 8 — Celebration: wide front shot back in the sky
  { camPos: [0, 1.5, 3.6], camTarget: [0, 1.35, 0], env: "skyB" },
  // 9 — Pricing finale: a touch higher and wider, room for the plan cards
  { camPos: [0, 1.55, 3.9], camTarget: [0, 1.35, 0], env: "skyB" },
]

/** World Y of each environment pocket (the story drops/rises between them). */
export const ENV_Y: Record<EnvKey, number> = {
  skyA: 0,
  gate: -14,
  portal: -14,
  tunnel: -14,
  school: -24,
  skyB: -10,
}

/** Live world position of the student — published each frame, read by the camera. */
export const heroState = { pos: new THREE.Vector3(0, 0, 0) }

export const SCENE_CAM_POS = SCENES.map((s) => new THREE.Vector3(...s.camPos))
export const SCENE_CAM_TARGET = SCENES.map((s) => new THREE.Vector3(...s.camTarget))
export const ENV_BY_BAND = SCENES.map((s) => s.env)

const ease = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function bandAt(global: number): number {
  for (let s = 0; s < SECTION_COUNT; s++) {
    if (global < sectionStart(s) + sectionWidth(s)) return s
  }
  return SECTION_COUNT - 1
}

function windowedBand(global: number, band: number, a: number, b: number): number {
  const p = localProgress(global, band)
  return ease(Math.min(1, Math.max(0, (p - a) / (b - a))))
}

/** World Y of the student + camera story — falls/rises between pockets. */
export function heightAt(global: number): number {
  const band = bandAt(global)
  switch (band) {
    case 0:
      return 0
    case 1:
      return lerp(0, ENV_Y.gate, windowedBand(global, 1, 0.08, 1)) // the fall
    case 2:
    case 3:
    case 4:
      return ENV_Y.gate
    case 5:
      return lerp(ENV_Y.gate, ENV_Y.school, windowedBand(global, 5, 0.08, 0.6)) // drop into the school, room builds
    case 6:
    case 7:
      return ENV_Y.school
    default:
      return ENV_Y.skyB // the rise (s8) and the pricing finale (s9) both resolve here
  }
}

/**
 * Environment swaps happen at the START of the destination band, masked by a
 * warp flash. The flash pulse is defined in GLOBAL scroll space around the
 * boundary, so it peaks exactly at the swap moment and dissolves out.
 */
export const TRANSITIONS: number[] = [2, 3, 4, 5, 8]

/** 0..1 warp-flash strength — triangular pulse centered on each env swap. */
export function warpStrength(global: number): number {
  let m = 0
  for (const toBand of TRANSITIONS) {
    const boundary = sectionStart(toBand)
    const d = (global - boundary) / sectionWidth(toBand)
    const tri = 1 - Math.abs(d) / 0.25
    m = Math.max(m, ease(Math.min(1, Math.max(0, tri))))
  }
  return m
}

/** Background color + fog per scene — swapped by the SceneManager. */
export const BACKGROUNDS: { color: string; fogNear: number; fogFar: number }[] = [
  { color: "#fceef5", fogNear: 26, fogFar: 75 },
  { color: "#fceef5", fogNear: 26, fogFar: 75 },
  { color: "#fceef5", fogNear: 26, fogFar: 75 },
  { color: "#07461f", fogNear: 16, fogFar: 50 },
  { color: "#021b0e", fogNear: 6, fogFar: 26 },
  { color: "#e6ecf7", fogNear: 14, fogFar: 42 },
  { color: "#e6ecf7", fogNear: 14, fogFar: 42 },
  { color: "#e6ecf7", fogNear: 14, fogFar: 42 },
  { color: "#fceef5", fogNear: 26, fogFar: 75 },
  { color: "#fceef5", fogNear: 26, fogFar: 75 },
]
