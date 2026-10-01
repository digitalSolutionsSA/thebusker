import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Paints the leather, seams, stripes and "BOK TOWN" print onto a canvas texture. */
function createBallTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  // Leather: warm cream, a touch darker toward the tips
  const leather = ctx.createLinearGradient(0, 0, 0, 512)
  leather.addColorStop(0, '#cdbf9c')
  leather.addColorStop(0.25, '#f1e8d2')
  leather.addColorStop(0.75, '#f1e8d2')
  leather.addColorStop(1, '#cdbf9c')
  ctx.fillStyle = leather
  ctx.fillRect(0, 0, 1024, 512)

  // Pebble grain
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = `rgba(90, 70, 30, ${Math.random() * 0.06})`
    ctx.fillRect(Math.random() * 1024, Math.random() * 512, 2, 2)
  }

  // Green and gold bands near both tips
  const band = (y: number, h: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(0, y, 1024, h)
  }
  band(70, 18, '#ffc72c')
  band(92, 30, '#0b6b3a')
  band(390, 30, '#0b6b3a')
  band(424, 18, '#ffc72c')

  // Four panel seams with stitching
  for (let i = 0; i < 4; i++) {
    const x = i * 256
    ctx.fillStyle = '#7d6c47'
    ctx.fillRect(x - 3, 0, 6, 512)
    ctx.fillStyle = '#f7f1e2'
    for (let y = 6; y < 512; y += 16) ctx.fillRect(x - 1, y, 2, 8)
  }

  // Print on two opposite panels, running along the length of the ball
  const print = (cx: number) => {
    ctx.save()
    ctx.translate(cx, 256)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#0b6b3a'
    ctx.font = '800 46px Manrope, "Arial Black", Arial, sans-serif'
    ctx.fillText('BOK TOWN', 0, -8)
    ctx.fillStyle = '#c99a1a'
    ctx.font = '700 17px Manrope, Arial, sans-serif'
    ctx.fillText('THE BUSKER · V-TOWN', 0, 30)
    ctx.restore()
  }
  print(128)
  print(640)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

function createBallGeometry() {
  const points: THREE.Vector2[] = []
  const steps = 64
  for (let i = 0; i <= steps; i++) {
    const a = -Math.PI / 2 + (i / steps) * Math.PI
    const r = 0.72 * Math.pow(Math.cos(a), 0.78)
    points.push(new THREE.Vector2(Math.max(r, 0.0001), Math.sin(a) * 1.18))
  }
  return new THREE.LatheGeometry(points, 96)
}

export default function RugbyBall() {
  const group = useRef<THREE.Group>(null)
  const ball = useRef<THREE.Mesh>(null)
  const geometry = useMemo(() => createBallGeometry(), [])
  const texture = useMemo(() => createBallTexture(), [])

  useFrame(({ pointer, clock }, delta) => {
    if (ball.current) ball.current.rotation.y += delta * 0.6 // spiral spin
    if (group.current) {
      const k = 1 - Math.pow(0.03, delta)
      group.current.rotation.x += (-pointer.y * 0.35 - group.current.rotation.x) * k
      group.current.rotation.y += (pointer.x * 0.5 - group.current.rotation.y) * k
      group.current.position.y = Math.sin(clock.elapsedTime * 1.1) * 0.12
    }
  })

  return (
    <group ref={group}>
      <group rotation={[0.25, 0, -1.05]}>
        <mesh ref={ball} geometry={geometry} castShadow>
          <meshStandardMaterial map={texture} roughness={0.62} metalness={0.05} envMapIntensity={0.8} />
        </mesh>
      </group>
    </group>
  )
}
