import * as THREE from "three"
import { shaderMaterial } from "@react-three/drei"
import { extend } from "@react-three/fiber"

/**
 * One piece of genuinely custom GLSL on the page: three offset noise samples
 * (classic warp) layered with rotating spiral arms and ring bands, pushed
 * through a power curve so the detail stays sparse and bright against a dark
 * indigo space — the swirl reads as churning structure, not a gradient.
 */
const PortalSwirlMaterial = shaderMaterial(
  {
    uTime: 0,
    uSpeed: 1.0,
    uColorA: new THREE.Color(2.0, 1.5, 3.0),
    uColorB: new THREE.Color(1.2, 1.0, 2.2),
    uIntensity: 1.0,
  },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float uTime;
    uniform float uSpeed;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform float uIntensity;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    void main() {
      vec2 uv = vUv - 0.5;
      float radius = length(uv);
      float angle = atan(uv.y, uv.x);

      float t = uTime * uSpeed;
      // three scrolling noise layers at different speeds/scales
      float n1 = noise(vec2(angle * 2.0 + t * 0.8, radius * 6.0 - t * 0.45));
      float n2 = noise(vec2(angle * 4.0 - t * 0.45 + 5.0, radius * 10.0 + t * 0.6 + 11.0));
      float n3 = noise(vec2(angle * 8.0 + t * 0.3 + 23.0, radius * 16.0 - t * 0.3 + 7.0));
      float warp = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

      // rotating spiral arms (4) + concentric ring bands — the "texture swirls"
      float arms = 0.5 + 0.5 * sin(angle * 4.0 - t * 3.2);
      float rings = 0.5 + 0.5 * sin(radius * 26.0 - t * 2.4);
      float bands = 0.5 + 0.5 * sin(radius * 52.0 + t * 1.3);

      float detail = clamp(warp * 0.9 + arms * 0.55 + rings * 0.4 + bands * 0.25, 0.0, 1.6);

      // dark indigo space + sparse bright swirl — high contrast keeps the
      // structure visible; a power curve widens the dark gaps between strands
      vec3 color = vec3(0.07, 0.045, 0.19);
      color += uColorA * pow(detail, 1.5) * 1.7;

      // thin hot rim at the portal mouth
      color += uColorB * smoothstep(0.4, 0.49, radius) * 0.9;

      // only the very outer edge fades — detail survives across the whole disc
      color *= smoothstep(0.52, 0.46, radius);

      color *= uIntensity;

      gl_FragColor = vec4(color, 1.0);
    }
  `
)

extend({ PortalSwirlMaterial })

declare module "@react-three/fiber" {
  interface ThreeElements {
    portalSwirlMaterial: ThreeElements["shaderMaterial"] & {
      uTime?: number
      uSpeed?: number
      uColorA?: THREE.Color
      uColorB?: THREE.Color
      uIntensity?: number
    }
  }
}

export { PortalSwirlMaterial }
