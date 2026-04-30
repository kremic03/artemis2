import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import SceneCamera from './SceneCamera'
import SceneLights from './SceneLights'
import Earth from './objects/Earth'
import EarthAtmosphere from './objects/EarthAtmosphere'
import Moon from './objects/Moon'
import LaunchPad from './objects/LaunchPad'
import TwinkleStars from './objects/TwinkleStars'
import Trajectory from './Trajectory'
import WaypointMarkers from './WaypointMarkers'
import AnimationDriver from './AnimationDriver'
import RocketController from '@features/rocket/RocketController'
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

        {/* Space background — dual layer for parallax depth */}
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

        {/* Foreground twinkling stars — small bright field nearer the camera */}
        <TwinkleStars count={1400} radius={900} size={1.9} />

        {/* Earth + atmospheric glow */}
        <Earth />
        <EarthAtmosphere />

        {/* Launch pad structure */}
        <LaunchPad />

        {/* Moon */}
        <Moon />

        {/* Mission trajectory */}
        <Trajectory />

        {/* Numbered waypoints */}
        <WaypointMarkers />

        {/* Rocket */}
        <RocketController />
      </Suspense>
    </Canvas>
  )
}
