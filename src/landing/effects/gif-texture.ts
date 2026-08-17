import { useCallback, useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { decompressFrames, parseGIF } from "gifuct-js"

interface DecodedGif {
  width: number
  height: number
  frames: ImageData[]
  /** per-frame display time in milliseconds */
  delays: number[]
}

/** decoded frames + the canvas texture that streams them. */
interface LoadedGif {
  decoded: DecodedGif
  texture: THREE.CanvasTexture
  canvas: HTMLCanvasElement
}

const decodeCache = new Map<string, Promise<LoadedGif | null>>()

/** Composite the (possibly partial, disposal-encoded) GIF frames onto one full canvas each. */
function compositeGif(gif: ReturnType<typeof parseGIF>): DecodedGif {
  const frames = decompressFrames(gif, true)
  const { width, height } = gif.lsd
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("GIF: 2d context unavailable")

  const frameData: ImageData[] = []
  const delays: number[] = []
  let previous: ImageData | null = null

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]

    // apply the PREVIOUS frame's disposal before drawing the current one
    if (i > 0) {
      const prev = frames[i - 1]
      if (prev.disposalType === 2) {
        ctx.clearRect(prev.dims.left, prev.dims.top, prev.dims.width, prev.dims.height)
      } else if (prev.disposalType === 3 && previous) {
        ctx.putImageData(previous, 0, 0)
      }
    }

    // if THIS frame may need to be restored later, snapshot what precedes it
    if (frame.disposalType === 3) {
      previous = ctx.getImageData(0, 0, width, height)
    }

    const patchCanvas = document.createElement("canvas")
    patchCanvas.width = frame.dims.width
    patchCanvas.height = frame.dims.height
    const pctx = patchCanvas.getContext("2d")
    if (!pctx) throw new Error("GIF: patch context unavailable")
    pctx.putImageData(
      new ImageData(new Uint8ClampedArray(frame.patch), frame.dims.width, frame.dims.height),
      0,
      0,
    )
    ctx.drawImage(patchCanvas, frame.dims.left, frame.dims.top)

    frameData.push(ctx.getImageData(0, 0, width, height))
    delays.push(Math.max(1, frame.delay))
  }

  if (frameData.length === 0) throw new Error("GIF: no drawable frames")
  return { width, height, frames: frameData, delays }
}

async function decodeGif(url: string): Promise<LoadedGif | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const gif = parseGIF(await res.arrayBuffer())
    const decoded = compositeGif(gif)
    const canvas = document.createElement("canvas")
    canvas.width = decoded.width
    canvas.height = decoded.height
    const ctx = canvas.getContext("2d")
    if (ctx) ctx.putImageData(decoded.frames[0], 0, 0)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    return { decoded, texture, canvas }
  } catch (err) {
    console.error(`GIF decode failed for ${url}`, err)
    return null
  }
}

/**
 * Decodes an animated GIF into a scrubbed THREE.CanvasTexture.
 * - `texture` / `loaded`: null/false until decode finishes; a failed decode
 *   leaves them falsy so callers can fall back to static geometry.
 * - `update(t)`: call every frame with elapsed seconds to advance the animation.
 * - Decodes are cached at module level (StrictMode-safe, loaded once).
 */
export function useGifTexture(url: string | null) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null)
  const [aspect, setAspect] = useState(1)
  const [loaded, setLoaded] = useState(false)
  const textureRef = useRef<THREE.CanvasTexture | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const decodedRef = useRef<DecodedGif | null>(null)
  const lastIdxRef = useRef(-1)

  useEffect(() => {
    if (!url) return
    let active = true
    lastIdxRef.current = -1
    let pending = decodeCache.get(url)
    if (!pending) {
      pending = decodeGif(url)
      decodeCache.set(url, pending)
    }
    pending.then((r) => {
      if (!active || !r) return
      decodedRef.current = r.decoded
      canvasRef.current = r.canvas
      textureRef.current = r.texture
      lastIdxRef.current = 0
      setAspect(r.decoded.width / r.decoded.height)
      setTexture(r.texture)
      setLoaded(true)
    })
    return () => {
      active = false
    }
  }, [url])

  const update = useCallback((time: number) => {
    const d = decodedRef.current
    const canvas = canvasRef.current
    const tex = textureRef.current
    if (!d || !canvas || !tex || d.frames.length === 0) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const cycle = d.delays.reduce((a, b) => a + b, 0)
    if (cycle <= 0) return
    let acc = (time * 1000) % cycle
    let idx = 0
    for (let i = 0; i < d.delays.length; i++) {
      if (acc < d.delays[i]) {
        idx = i
        break
      }
      acc -= d.delays[i]
    }
    if (idx === lastIdxRef.current) return
    lastIdxRef.current = idx
    ctx.putImageData(d.frames[idx], 0, 0)
    tex.needsUpdate = true
  }, [])

  return {
    texture,
    update,
    /** width / height of the source gif (1 until loaded). */
    aspect,
    loaded,
  }
}
