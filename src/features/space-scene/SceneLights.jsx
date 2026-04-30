/**
 * SceneLights — Sun as a directional light + minimal ambient.
 * Sun is positioned far along +X axis (to the right of Earth as seen from camera).
 */
export default function SceneLights() {
  return (
    <>
      {/* Ambient fill — keeps nightside readable without flattening contrast */}
      <ambientLight intensity={0.05} color="#09152d" />

      {/* Hemispheric tint — subtle cold/warm split for more cinematic shading */}
      <hemisphereLight
        args={['#a9d8ff', '#04070f', 0.18]}
      />

      {/* Sun — primary directional light */}
      <directionalLight
        position={[300, 60, 80]}
        intensity={3.1}
        color="#fff4dc"
      />

      {/* Very faint fill from the anti-sun direction */}
      <directionalLight
        position={[-80, -40, -60]}
        intensity={0.08}
        color="#102040"
      />

      {/* Earth albedo bounce */}
      <pointLight
        position={[0, 0, 0]}
        intensity={0.38}
        color="#2c5ea8"
        distance={24}
        decay={2}
      />

      {/* Warm sun-side bloom near the outbound corridor */}
      <pointLight
        position={[120, 18, 26]}
        intensity={0.28}
        color="#ffb86b"
        distance={220}
        decay={2}
      />
    </>
  )
}
