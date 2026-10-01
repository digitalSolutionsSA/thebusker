import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createRandom } from '../../../lib/random'

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  varying float vFlicker;
  void main() {
    vFlicker = 0.55 + 0.45 * sin(uTime * 6.0 + aPhase * 12.0);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

// Soft round spark: hot yellow core fading to orange
const fragmentShader = /* glsl */ `
  varying float vFlicker;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    vec3 col = mix(vec3(0.95, 0.68, 0.22), vec3(1.0, 0.94, 0.72), core * core);
    gl_FragColor = vec4(col, core * vFlicker);
  }
`

interface Props {
  count?: number
  /** width, height, depth of the area embers rise through */
  area?: [number, number, number]
}

/** Glowing sparks rising and flickering like embers off a fire pit. */
export default function Embers({ count = 140, area = [16, 9, 6] }: Props) {
  const points = useRef<THREE.Points>(null)
  const material = useRef<THREE.ShaderMaterial>(null)
  const [w, h, d] = area

  const { positions, sizes, phases, speeds } = useMemo(() => {
    const rand = createRandom(11)
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand() - 0.5) * w
      positions[i * 3 + 1] = (rand() - 0.5) * h
      positions[i * 3 + 2] = (rand() - 0.5) * d
      sizes[i] = 0.04 + rand() * 0.09
      phases[i] = rand() * Math.PI * 2
      speeds[i] = 0.25 + rand() * 0.6
    }
    return { positions, sizes, phases, speeds }
  }, [count, w, h, d])

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    if (material.current) material.current.uniforms.uTime.value = t
    const attr = points.current?.geometry.attributes.position
    if (!attr) return
    const arr = attr.array as Float32Array
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * delta
      arr[i * 3] += Math.sin(t * 0.8 + phases[i]) * delta * 0.15
      if (arr[i * 3 + 1] > h / 2) {
        arr[i * 3 + 1] = -h / 2
        arr[i * 3] = (Math.random() - 0.5) * w
      }
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
