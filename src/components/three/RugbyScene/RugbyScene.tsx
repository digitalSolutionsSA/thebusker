import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, Sparkles } from '@react-three/drei'
import { useInView } from '../../../hooks/useInView'
import RugbyBall from './RugbyBall'
import Confetti from './Confetti'

/** Bok Town hero: a spinning match ball in stadium light with ticker-tape confetti. */
export default function RugbyScene() {
  const [ref, inView] = useInView<HTMLDivElement>()

  return (
    <div ref={ref} className="absolute inset-0">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 6], fov: 40 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        frameloop={inView ? 'always' : 'never'}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[4, 6, 5]} intensity={2.4} color="#fff3d6" />
        <pointLight position={[-4, -1, 3]} intensity={18} distance={12} color="#1c8a4a" />
        <pointLight position={[3, -2, 2]} intensity={10} distance={10} color="#ffc72c" />

        <Environment resolution={64}>
          <Lightformer form="rect" intensity={3} color="#ffffff" position={[0, 5, 2]} scale={[6, 1, 1]} />
          <Lightformer form="rect" intensity={2} color="#ffc72c" position={[4, 0, 3]} scale={[2, 4, 1]} />
          <Lightformer form="rect" intensity={2} color="#1c8a4a" position={[-4, 0, 3]} scale={[2, 4, 1]} />
        </Environment>

        <RugbyBall />
        <Confetti />
        <Sparkles count={70} scale={[10, 6, 4]} size={3} speed={0.3} color="#ffc72c" opacity={0.7} />
      </Canvas>
    </div>
  )
}
