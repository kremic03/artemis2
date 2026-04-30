import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import SceneCamera from './SceneCamera'
import SceneLights from './SceneLights'
import Earth from './objects/Earth'
import Rocket from './objects/Rocket'
import TwinkleStars from './objects/TwinkleStars'
import AnimationDriver from './AnimationDriver'
import { CANVAS_CONFIG, STAR_LAYERS } from '@shared/constants/scene'

export default function SpaceScene() {
  return (
    <Canvas
      camera={CANVAS_CONFIG.camera}
      gl={CANVAS_CONFIG.gl}
      dpr={CANVAS_CONFIG.dpr}
      style={{ background: CANVAS_CONFIG.background }}
    >
      <Suspense fallback={null}>
        <AnimationDriver />
        <SceneCamera />
        <SceneLights />

        {STAR_LAYERS.map((layer, index) => (
          <Stars
            key={index}
            radius={layer.radius}
            depth={layer.depth}
            count={layer.count}
            factor={layer.factor}
            fade
            saturation={layer.saturation}
          />
        ))}

        <TwinkleStars count={1400} radius={900} size={1.9} />

        <Earth />
        <Rocket />
      </Suspense>
    </Canvas>
  )
}
