import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * TwinkleStars — custom points layer that twinkles each star independently.
 * Each star gets its own random phase + frequency so the field appears alive
 * without any star flickering in sync with its neighbours.
 */
export default function TwinkleStars({
  count  = 1400,
  radius = 900,
  size   = 1.6,
}) {
  const pointsRef = useRef()

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const seeds     = new Float32Array(count)
    const sizes     = new Float32Array(count)
    const colors    = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // Uniform distribution on a sphere (Marsaglia)
      const u = Math.random() * 2 - 1
      const theta = Math.random() * Math.PI * 2
      const r = Math.sqrt(1 - u * u)
      positions[i * 3]     = radius * r * Math.cos(theta)
      positions[i * 3 + 1] = radius * u
      positions[i * 3 + 2] = radius * r * Math.sin(theta)

      seeds[i] = Math.random() * 100
      sizes[i] = size * (0.5 + Math.random() * 1.5)

      // Mostly white with a scattering of warm/cool tints
      const tint = Math.random()
      if (tint < 0.75) {
        colors[i * 3]     = 1.0
        colors[i * 3 + 1] = 1.0
        colors[i * 3 + 2] = 1.0
      } else if (tint < 0.88) {
        colors[i * 3]     = 1.0       // warm
        colors[i * 3 + 1] = 0.85
        colors[i * 3 + 2] = 0.65
      } else {
        colors[i * 3]     = 0.70      // cool
        colors[i * 3 + 1] = 0.82
        colors[i * 3 + 2] = 1.0
      }
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('seed',     new THREE.BufferAttribute(seeds, 1))
    g.setAttribute('baseSize', new THREE.BufferAttribute(sizes, 1))
    g.setAttribute('color',    new THREE.BufferAttribute(colors, 3))
    return g
  }, [count, radius, size])

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime:    { value: 0 },
      uScreen:  { value: 1.0 },
    },
    vertexShader: /* glsl */`
      attribute float seed;
      attribute float baseSize;
      attribute vec3 color;
      uniform float uTime;
      varying vec3 vColor;
      varying float vTwinkle;
      void main() {
        vColor = color;
        // Each star has its own phase+frequency; blend two sines for organic variance.
        float phase = seed * 6.2831;
        float f1 = 1.0 + fract(seed * 0.73) * 1.6;
        float f2 = 1.6 + fract(seed * 0.41) * 2.0;
        float a = 0.5 + 0.5 * sin(uTime * f1 + phase);
        float b = 0.5 + 0.5 * sin(uTime * f2 + phase * 1.7 + 0.6);
        vTwinkle = mix(a, b, 0.5);
        // Most stars stay bright; small random subset dims hard for a "blink"
        float dimFloor = fract(seed * 0.29) < 0.08 ? 0.25 : 0.65;
        vTwinkle = mix(dimFloor, 1.0, vTwinkle);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = baseSize * (1.0 + 0.35 * vTwinkle) * (300.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */`
      varying vec3 vColor;
      varying float vTwinkle;
      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        if (d > 0.5) discard;
        // Gaussian-ish falloff
        float core = smoothstep(0.5, 0.0, d);
        float glow = smoothstep(0.5, 0.15, d);
        float alpha = (core * 0.7 + glow * 0.3) * vTwinkle;
        gl_FragColor = vec4(vColor * (0.6 + 0.4 * vTwinkle), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [])

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime()
  })

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
}
