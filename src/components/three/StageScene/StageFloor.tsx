import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Pooled light on the stage floor where the beams land.
const fragmentShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float d = length(p * vec2(1.0, 2.2));
    float pool = smoothstep(0.5, 0.0, d);
    float pulse = 0.85 + 0.15 * sin(uTime * 1.3);
    vec3 ember = vec3(0.85, 0.68, 0.3);
    vec3 gold = vec3(0.89, 0.74, 0.43);
    vec3 col = mix(ember, gold, smoothstep(0.0, 0.35, -p.y) * 0.35);
    gl_FragColor = vec4(col, pool * 0.45 * pulse);
  }
`

export default function StageFloor() {
  const material = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  useFrame(({ clock }) => {
    if (material.current) material.current.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.9, -1]}>
      <planeGeometry args={[22, 10]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
