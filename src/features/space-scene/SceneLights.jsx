export default function SceneLights() {
  return (
    <>
      {/* Sun — primary directional, comes from the right */}
      <directionalLight position={[5, 2, 5]} intensity={1.4} color="#fff4e0" />

      {/* Ambient — barely visible night side */}
      <ambientLight intensity={0.05} color="#202840" />

      {/* Rim fill — blue tint on night side so it reads as Earth not a void */}
      <directionalLight position={[-5, -1, -3]} intensity={0.15} color="#3355aa" />
    </>
  )
}
