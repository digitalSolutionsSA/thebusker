import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Embers({ count = 400 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null)

  const [positions, speeds] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8
      speeds[i] = 0.15 + Math.random() * 0.4
    }
    return [positions, speeds]
  }, [count])

  useFrame((_, delta) => {
    const geom = pointsRef.current?.geometry
    if (!geom) return
    const arr = geom.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * delta
      if (arr[i * 3 + 1] > 5) {
        arr[i * 3 + 1] = -5
        arr[i * 3] = (Math.random() - 0.5) * 18
      }
    }
    geom.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#e8c27a"
        transparent
        opacity={0.75}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

export default function EmberScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      className="!absolute inset-0"
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.6} />
      <Embers />
    </Canvas>
  )
}
