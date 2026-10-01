import type { ComponentProps } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, Sparkles } from '@react-three/drei'
import { useInView } from '../../../hooks/useInView'
import CameraRig from '../CameraRig'
import Embers from '../Embers'
import LightBeam from './LightBeam'
import MirrorBall from './MirrorBall'
import StageFloor from './StageFloor'

const beams: ComponentProps<typeof LightBeam>[] = [
  { position: [-5.5, 4.6, -2], color: '#c9a24a', angle: 0.55, phase: 0 },
  { position: [-2.6, 4.9, -3], color: '#f0d080', angle: 0.2, phase: 1.4, opacity: 0.45 },
  { position: [0, 5.1, -4], color: '#a87a2e', angle: 0, phase: 2.2, opacity: 0.4, sweep: 0.25 },
  { position: [2.6, 4.9, -3], color: '#e8c97a', angle: -0.2, phase: 3.1, opacity: 0.45 },
  { position: [5.5, 4.6, -2], color: '#e2bd6d', angle: -0.55, phase: 4.2, opacity: 0.3 },
]

interface Props {
  mirrorBall?: boolean
  floor?: boolean
}

/** Concert-hall hero: warm sweeping stage beams, rising embers and an optional mirror ball. */
export default function StageScene({ mirrorBall = true, floor = true }: Props) {
  const [ref, inView] = useInView<HTMLDivElement>()

  return (
    <div ref={ref} className="absolute inset-0">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.6, 9], fov: 42 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        frameloop={inView ? 'always' : 'never'}
      >
        <fog attach="fog" args={['#0f0b07', 9, 24]} />
        <ambientLight intensity={0.15} />

        {beams.map((b, i) => (
          <LightBeam key={i} {...b} />
        ))}

        {mirrorBall && (
          <>
            {/* Local studio lighting for the mirror ball reflections — no HDR download needed */}
            <Environment resolution={128}>
              <Lightformer form="rect" intensity={6} color="#e8c97a" position={[4, 2, 4]} scale={[6, 3, 1]} />
              <Lightformer form="rect" intensity={5} color="#e2bd6d" position={[-5, 1, 3]} scale={[5, 3, 1]} />
              <Lightformer form="rect" intensity={4} color="#ffffff" position={[0, 6, 2]} scale={[8, 2, 1]} />
              <Lightformer form="ring" intensity={4} color="#a87a2e" position={[0, -3, 4]} scale={4} />
            </Environment>
            <MirrorBall position={[1.6, 3.5, -1]} />
          </>
        )}
        {floor && <StageFloor />}

        <Embers count={170} area={[16, 10, 6]} />
        <Sparkles count={60} scale={[12, 6, 4]} size={3.2} speed={0.25} color="#e2bd6d" opacity={0.5} />

        <CameraRig strength={[0.9, 0.35]} target={[0, 0.8, 0]} base={[0, 0.6, 9]} />
      </Canvas>
    </div>
  )
}
