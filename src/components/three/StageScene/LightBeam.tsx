import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

// Volumetric-looking cone: bright at the source, fading with distance and toward the edges.
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(vViewPosition)));
    float core = pow(facing, 2.5);
    float falloff = pow(vUv.y, 1.6);
    float flicker = 0.92 + 0.08 * sin(uTime * 3.0 + vUv.y * 12.0);
    float alpha = core * falloff * uOpacity * flicker;
    gl_FragColor = vec4(uColor * (0.6 + falloff), alpha);
  }
`

interface Props {
  position: [number, number, number]
  color: string
  /** base tilt in radians */
  angle: number
  /** sweep amplitude in radians */
  sweep?: number
  speed?: number
  phase?: number
  length?: number
  radius?: number
  opacity?: number
}

export default function LightBeam({
  position,
  color,
  angle,
  sweep = 0.35,
  speed = 0.4,
  phase = 0,
  length = 12,
  radius = 1.8,
  opacity = 0.55,
}: Props) {
  const group = useRef<THREE.Group>(null)
  const material = useRef<THREE.ShaderMaterial>(null)

  const geometry = useMemo(() => {
    const g = new THREE.ConeGeometry(radius, length, 48, 1, true)
    g.translate(0, -length / 2, 0) // apex at the origin, beam pointing down
    return g
  }, [length, radius])

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uTime: { value: 0 },
    }),
    [color, opacity],
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (material.current) material.current.uniforms.uTime.value = t
    if (group.current) {
      group.current.rotation.z = angle + Math.sin(t * speed + phase) * sweep
      group.current.rotation.x = Math.sin(t * speed * 0.7 + phase) * 0.15
    }
  })

  return (
    <group ref={group} position={position}>
      <mesh geometry={geometry} renderOrder={2}>
        <shaderMaterial
          ref={material}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* the lamp itself */}
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  )
}
