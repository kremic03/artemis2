import { useMemo } from 'react'
import { ShaderMaterial, Color, AdditiveBlending, FrontSide, Quaternion, Vector3 } from 'three'
import { EARTH_RADIUS, KSC_NORMAL } from '@shared/constants/trajectory'

const LOCAL_UP = new Vector3(0, 1, 0)

// ─── Fresnel atmosphere shader ────────────────────────────────────────────────
const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vNormal  = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3  innerColor;
  uniform vec3  outerColor;
  uniform float innerPower;
  uniform float outerPower;
  uniform float opacity;

  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float cosAngle = abs(dot(normalize(vNormal), normalize(vViewDir)));

    // Edge = low cosAngle → strong glow; center = high cosAngle → transparent
    float inner = pow(1.0 - cosAngle, innerPower);
    float outer = pow(1.0 - cosAngle, outerPower);

    vec3 color = mix(innerColor, outerColor, outer);
    float alpha = inner * opacity;

    gl_FragColor = vec4(color, alpha);
  }
`

// ─── Inner (blue-white) atmosphere ring ───────────────────────────────────────
function AtmosphereLayer({ radius, innerColor, outerColor, innerPower, outerPower, opacity }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          innerColor:  { value: new Color(innerColor) },
          outerColor:  { value: new Color(outerColor) },
          innerPower:  { value: innerPower },
          outerPower:  { value: outerPower },
          opacity:     { value: opacity },
        },
        transparent:  true,
        depthWrite:   false,
        blending:     AdditiveBlending,
        side:         FrontSide,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return (
    <mesh>
      <sphereGeometry args={[radius, 72, 36, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

export default function EarthAtmosphere() {
  const hemisphereQuat = useMemo(
    () => new Quaternion().setFromUnitVectors(LOCAL_UP, KSC_NORMAL.clone().normalize()),
    []
  )

  return (
    <group quaternion={hemisphereQuat} position={[0, 0, 0]}>
      {/* Limb brightening — thin bright cyan ring right at the horizon */}
      <AtmosphereLayer
        radius={EARTH_RADIUS + 0.06}
        innerColor="#bfe8ff"
        outerColor="#6fb8ff"
        innerPower={1.4}
        outerPower={2.4}
        opacity={0.82}
      />

      {/* Troposphere / stratosphere — tight blue haze */}
      <AtmosphereLayer
        radius={EARTH_RADIUS + 0.26}
        innerColor="#5bc8ff"
        outerColor="#2b7fd8"
        innerPower={2.0}
        outerPower={3.2}
        opacity={0.72}
      />

      {/* Exosphere — wide soft glow */}
      <AtmosphereLayer
        radius={EARTH_RADIUS + 0.80}
        innerColor="#1e58a8"
        outerColor="#081a44"
        innerPower={3.0}
        outerPower={4.6}
        opacity={0.42}
      />
    </group>
  )
}
