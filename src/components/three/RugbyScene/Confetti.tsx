import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createRandom } from '../../../lib/random'

const palette = ['#0b6b3a', '#1c8a4a', '#ffc72c', '#ffe08a', '#ffffff']

interface Piece {
  position: THREE.Vector3
  rotation: THREE.Euler
  spin: THREE.Vector3
  fall: number
  sway: number
  phase: number
}

/** Green-and-gold ticker tape drifting down, drawn as one instanced mesh. */
export default function Confetti({ count = 220 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const pieces = useMemo<Piece[]>(() => {
    // Seeded so the layout is stable between renders
    const rand = createRandom(7)
    return Array.from({ length: count }, () => ({
      position: new THREE.Vector3((rand() - 0.5) * 14, rand() * 10 - 5, (rand() - 0.5) * 6 - 1),
      rotation: new THREE.Euler(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI),
      spin: new THREE.Vector3(rand() * 3, rand() * 3, rand() * 2),
      fall: 0.4 + rand() * 0.8,
      sway: 0.2 + rand() * 0.5,
      phase: rand() * Math.PI * 2,
    }))
  }, [count])

  useLayoutEffect(() => {
    const color = new THREE.Color()
    pieces.forEach((_, i) => mesh.current?.setColorAt(i, color.set(palette[i % palette.length])))
    if (mesh.current?.instanceColor) mesh.current.instanceColor.needsUpdate = true
  }, [pieces])

  useFrame(({ clock }, delta) => {
    if (!mesh.current) return
    const t = clock.elapsedTime
    pieces.forEach((p, i) => {
      p.position.y -= p.fall * delta
      p.position.x += Math.sin(t * p.sway + p.phase) * delta * 0.3
      if (p.position.y < -5) p.position.y = 5
      p.rotation.x += p.spin.x * delta
      p.rotation.y += p.spin.y * delta
      p.rotation.z += p.spin.z * delta
      dummy.position.copy(p.position)
      dummy.rotation.copy(p.rotation)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.07, 0.16]} />
      <meshStandardMaterial side={THREE.DoubleSide} roughness={0.4} metalness={0.3} />
    </instancedMesh>
  )
}
