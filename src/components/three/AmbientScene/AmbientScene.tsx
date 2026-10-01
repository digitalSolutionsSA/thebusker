import { Canvas } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { useInView } from '../../../hooks/useInView'
import CameraRig from '../CameraRig'
import Embers from '../Embers'
import LightBeam from '../StageScene/LightBeam'

interface Props {
  tone?: 'ember' | 'gold'
}

/** Lightweight backdrop for inner page headers: two soft beams and floating specks. */
export default function AmbientScene({ tone = 'ember' }: Props) {
  const [ref, inView] = useInView<HTMLDivElement>()
  const main = tone === 'ember' ? '#c9a24a' : '#e2bd6d'
  const accent = tone === 'ember' ? '#a87a2e' : '#e8c97a'

  return (
    <div ref={ref} className="absolute inset-0">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        frameloop={inView ? 'always' : 'never'}
      >
        <LightBeam position={[-4, 4.5, -2]} color={main} angle={0.45} sweep={0.2} speed={0.3} opacity={0.4} />
        <LightBeam position={[4, 4.5, -2]} color={accent} angle={-0.45} sweep={0.2} speed={0.3} phase={2} opacity={0.32} />
        <Embers count={110} area={[14, 8, 5]} />
        <Sparkles count={40} scale={[12, 6, 4]} size={3} speed={0.2} color="#e2bd6d" opacity={0.5} />
        <CameraRig strength={[0.6, 0.3]} target={[0, 0, 0]} base={[0, 0, 8]} />
      </Canvas>
    </div>
  )
}
