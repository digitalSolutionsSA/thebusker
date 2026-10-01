import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  /** how far the camera drifts with the pointer */
  strength?: [number, number]
  target?: [number, number, number]
  base?: [number, number, number]
}

const lookAt = new THREE.Vector3()

/** Eases the camera toward the pointer for a subtle parallax feel. */
export default function CameraRig({ strength = [0.8, 0.4], target = [0, 0.5, 0], base = [0, 0.6, 9] }: Props) {
  useFrame(({ camera, pointer }, delta) => {
    const k = 1 - Math.pow(0.02, delta)
    camera.position.x += (base[0] + pointer.x * strength[0] - camera.position.x) * k
    camera.position.y += (base[1] + pointer.y * strength[1] - camera.position.y) * k
    camera.position.z += (base[2] - camera.position.z) * k
    camera.lookAt(lookAt.set(...target))
  })
  return null
}
