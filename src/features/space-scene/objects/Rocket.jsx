/**
 * Rocket.jsx — Artemis 2 / SLS Block 1
 *
 * Hi-fi schematic model built from Three.js primitives, mounted as a
 * react-three-fiber <primitive>. Real proportions (meters), scaled down
 * to fit the Earth scene (EARTH_RADIUS = 5 scene units ≈ 6 371 km).
 *
 * Props:
 *   scale        — scene scale factor (default 0.005 → rocket ~0.49 units tall)
 *   showFlame    — engine plume on/off (default false)
 *   showLabels   — annotation sprites (default false)
 *   exploded     — 0..1 exploded-view amount (default 0)
 *   rotationSpeed — auto-spin rad/s (default 0)
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { KSC_SURFACE, KSC_NORMAL } from '@shared/constants/trajectory'

// Orientation: rotate rocket's +Y to align with KSC outward normal
const _up     = new THREE.Vector3(0, 1, 0)
const KSC_QUAT = new THREE.Quaternion().setFromUnitVectors(_up, KSC_NORMAL.clone().normalize())

// ─── geometry helpers ──────────────────────────────────────────────────────────
const cyl  = (rTop, rBot, h, mat, segs = 48) =>
  new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, segs, 1, false), mat)
const cone = (r, h, mat, segs = 48) =>
  new THREE.Mesh(new THREE.ConeGeometry(r, h, segs), mat)
const torus = (r, tube, mat) =>
  new THREE.Mesh(new THREE.TorusGeometry(r, tube, 12, 32), mat)

function buildRocket() {
  // ── materials ──────────────────────────────────────────────────────────────
  const M = {
    coreOrange:    new THREE.MeshStandardMaterial({ color: 0xc26a3a, roughness: 0.78, metalness: 0.05 }),
    coreOrangeDark:new THREE.MeshStandardMaterial({ color: 0xa05126, roughness: 0.85, metalness: 0.05 }),
    srbWhite:      new THREE.MeshStandardMaterial({ color: 0xe8e6df, roughness: 0.6,  metalness: 0.05 }),
    srbWhiteDk:    new THREE.MeshStandardMaterial({ color: 0xc7c4ba, roughness: 0.7,  metalness: 0.05 }),
    black:         new THREE.MeshStandardMaterial({ color: 0x111418, roughness: 0.5,  metalness: 0.2  }),
    darkGrey:      new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.55, metalness: 0.4  }),
    metal:         new THREE.MeshStandardMaterial({ color: 0x8a8e96, roughness: 0.35, metalness: 0.85 }),
    metalDark:     new THREE.MeshStandardMaterial({ color: 0x4a4e56, roughness: 0.45, metalness: 0.8  }),
    orionWhite:    new THREE.MeshStandardMaterial({ color: 0xf2f0eb, roughness: 0.55, metalness: 0.1  }),
    orionGold:     new THREE.MeshStandardMaterial({ color: 0xc9a15a, roughness: 0.4,  metalness: 0.8  }),
    solarBlue:     new THREE.MeshStandardMaterial({ color: 0x1a2b5c, roughness: 0.35, metalness: 0.6,
                                                     emissive: 0x0a1530, emissiveIntensity: 0.2 }),
    solarFrame:    new THREE.MeshStandardMaterial({ color: 0xb8b8b8, roughness: 0.45, metalness: 0.7  }),
    red:           new THREE.MeshStandardMaterial({ color: 0xc23a2a, roughness: 0.6,  metalness: 0.1  }),
  }

  const root = new THREE.Group()

  const G = {
    core: new THREE.Group(), srbL: new THREE.Group(), srbR: new THREE.Group(),
    lvsa: new THREE.Group(), icps: new THREE.Group(), osa:  new THREE.Group(),
    service: new THREE.Group(), orion: new THREE.Group(), las: new THREE.Group(),
    flame: new THREE.Group(),
  }
  Object.values(G).forEach(g => root.add(g))

  const restY = {}

  // ── Core Stage ────────────────────────────────────────────────────────────
  {
    const s = G.core; restY.core = 0
    const r = 4.2, hMain = 60.0, yBase = 4.6
    const tank = cyl(r, r, hMain, M.coreOrange); tank.position.y = yBase + hMain / 2; s.add(tank)
    const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 24, 0, Math.PI*2, 0, Math.PI/2.4), M.coreOrange)
    dome.position.y = yBase + hMain; s.add(dome)
    const band = cyl(r*1.005, r*1.005, 4.0, M.coreOrangeDark); band.position.y = yBase + hMain*0.55; s.add(band)
    const boattail = cyl(r, r*0.95, 4.6, M.darkGrey); boattail.position.y = 4.6/2; s.add(boattail)

    // fuel lines
    for (let i = 0; i < 4; i++) {
      const a = (i/4)*Math.PI*2 + Math.PI/4
      const pipe = cyl(0.18, 0.18, hMain*0.9, M.metal, 12)
      pipe.position.set(Math.cos(a)*(r+0.2), yBase+hMain*0.5, Math.sin(a)*(r+0.2)); s.add(pipe)
    }

    // RS-25 engines
    for (let i = 0; i < 4; i++) {
      const a = (i/4)*Math.PI*2 + Math.PI/4
      const ex = Math.cos(a)*1.7, ez = Math.sin(a)*1.7
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.15, 3.4, 32, 1, true), M.metal)
      bell.position.set(ex, 3.4/2+0.2, ez); s.add(bell)
      const rim = torus(1.15, 0.06, M.metalDark); rim.position.set(ex, 0.2, ez); rim.rotation.x = Math.PI/2; s.add(rim)
      const head = cyl(0.55, 0.495, 0.9, M.darkGrey); head.position.set(ex, 3.4+0.65, ez); s.add(head)
    }

    // decorative panels
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 8), new THREE.MeshStandardMaterial({ color: 0x111418 }))
    panel.position.set(0, yBase+hMain*0.78, r+0.01); s.add(panel)
    const worm  = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.6), new THREE.MeshStandardMaterial({ color: 0xc23a2a }))
    worm.position.set(0, yBase+hMain*0.42, r+0.01); s.add(worm)
  }
  const CORE_TOP = 4.6 + 60.0

  // ── SRBs ─────────────────────────────────────────────────────────────────
  function buildSRB(side) {
    const g = side === 'L' ? G.srbL : G.srbR
    restY[side === 'L' ? 'srbL' : 'srbR'] = 0
    const r = 1.85, hBody = 49.0, yBase = 1.6
    const segH = hBody / 5
    for (let i = 0; i < 5; i++) {
      const seg = cyl(r, r, segH*0.98, i%2===0 ? M.srbWhite : M.srbWhiteDk)
      seg.position.y = yBase + segH*(i+0.5); g.add(seg)
      const joint = torus(r*1.005, 0.08, M.metalDark)
      joint.position.y = yBase+segH*(i+1); joint.rotation.x = Math.PI/2; g.add(joint)
    }
    const frustum = cyl(r*0.55, r, 1.6, M.srbWhite); frustum.position.y = yBase+hBody+0.8; g.add(frustum)
    const nose = cone(r*0.55, 3.4, M.srbWhite); nose.position.y = yBase+hBody+1.6+1.7; g.add(nose)
    const skirt = cyl(r*1.05, r*1.05, 1.6, M.darkGrey); skirt.position.y = yBase/2; g.add(skirt)
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.1, 2.4, 32, 1, true), M.darkGrey)
    nozzle.position.y = 2.4/2 - 0.6; g.add(nozzle)
    const xSign = side === 'L' ? 1 : -1
    g.position.x = xSign * (4.2 + 1.85 + 0.4)
    for (const yy of [yBase+hBody*0.2, yBase+hBody*0.85]) {
      const strut = cyl(0.18, 0.18, 0.8, M.metal, 10)
      strut.rotation.z = Math.PI/2; strut.position.set(-xSign*(1.85+0.4), yy, 0); g.add(strut)
    }
  }
  buildSRB('L'); buildSRB('R')

  // ── LVSA ────────────────────────────────────────────────────────────────
  {
    const s = G.lvsa; restY.lvsa = 0
    const h = 4.8
    const adapter = cyl(2.5, 4.2, h, M.darkGrey); adapter.position.y = CORE_TOP+h/2; s.add(adapter)
    for (let i = 0; i < 16; i++) {
      const a = (i/16)*Math.PI*2
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.08, h*0.95, 0.08), M.metalDark)
      rib.position.set(Math.cos(a)*3.3, CORE_TOP+h/2, Math.sin(a)*3.3); s.add(rib)
    }
  }
  const LVSA_TOP = CORE_TOP + 4.8

  // ── ICPS ────────────────────────────────────────────────────────────────
  {
    const s = G.icps; restY.icps = 0
    const r = 2.5, h = 12.0
    const tank = cyl(r, r, h, M.srbWhite); tank.position.y = LVSA_TOP+h/2; s.add(tank)
    const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16, 0, Math.PI*2, 0, Math.PI/2.4), M.srbWhite)
    dome.position.y = LVSA_TOP+h; s.add(dome)
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.7, 1.6, 24, 1, true), M.metal)
    eng.position.y = LVSA_TOP-0.6; s.add(eng)
    const band = cyl(r*1.005, r*1.005, 0.5, M.darkGrey); band.position.y = LVSA_TOP+h*0.45; s.add(band)
  }
  const ICPS_TOP = LVSA_TOP + 12.0

  // ── OSA ─────────────────────────────────────────────────────────────────
  {
    const s = G.osa; restY.osa = 0
    const h = 1.5
    const a = cyl(2.5, 2.5, h, M.darkGrey); a.position.y = ICPS_TOP+h/2; s.add(a)
  }
  const OSA_TOP = ICPS_TOP + 1.5

  // ── Service Module ───────────────────────────────────────────────────────
  {
    const s = G.service; restY.service = 0
    const r = 2.5, h = 4.6
    const sm = cyl(r, r, h, M.orionWhite); sm.position.y = OSA_TOP+h/2; s.add(sm)
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.7, 1.2, 24, 1, true), M.metal)
    eng.position.y = OSA_TOP-0.5; s.add(eng)
    const wingL = 8, wingW = 2.2
    for (let i = 0; i < 4; i++) {
      const a = (i/4)*Math.PI*2 + Math.PI/4
      const wing = new THREE.Group()
      const panel = new THREE.Mesh(new THREE.BoxGeometry(wingL, 0.06, wingW), M.solarBlue)
      panel.position.x = wingL/2 + r; wing.add(panel)
      const frame = new THREE.Mesh(new THREE.BoxGeometry(wingL, 0.08, wingW*1.02), M.solarFrame)
      frame.position.x = wingL/2+r; frame.scale.y = 0.5; wing.add(frame)
      for (let k = 1; k <= 3; k++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, wingW), M.solarFrame)
        slat.position.set(r+(wingL*k/4), 0, 0); wing.add(slat)
      }
      wing.position.y = OSA_TOP+h*0.55; wing.rotation.y = a; s.add(wing)
    }
  }
  const SM_TOP = OSA_TOP + 4.6

  // ── Orion ─────────────────────────────────────────────────────────────
  {
    const s = G.orion; restY.orion = 0
    const h = 3.3
    const capsule = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 2.5, h, 32, 1, false), M.orionWhite)
    capsule.position.y = SM_TOP+h/2; s.add(capsule)
    const skirtT = torus(2.5, 0.12, M.darkGrey); skirtT.position.y = SM_TOP; skirtT.rotation.x = Math.PI/2; s.add(skirtT)
    const bay = cyl(0.6, 0.6, 0.5, M.darkGrey); bay.position.y = SM_TOP+h+0.25; s.add(bay)
    for (let i = 0; i < 4; i++) {
      const a = (i/4)*Math.PI*2
      const t = 0.55, rAt = 2.5+(0.6-2.5)*t
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.45), M.black)
      win.position.set(Math.cos(a)*(rAt+0.02), SM_TOP+h*t, Math.sin(a)*(rAt+0.02))
      win.lookAt(Math.cos(a)*10, win.position.y, Math.sin(a)*10); s.add(win)
    }
    const mli = cyl(0.62, 0.62, 0.4, M.orionGold); mli.position.y = SM_TOP+h+0.7; s.add(mli)
  }
  const ORION_TOP = SM_TOP + 3.3 + 0.5 + 0.4 + 0.1

  // ── LAS ──────────────────────────────────────────────────────────────
  {
    const s = G.las; restY.las = 0
    const bpc = cyl(0.6, 0.6, 1.0, M.orionWhite); bpc.position.y = ORION_TOP+0.5; s.add(bpc)
    const motor = cyl(0.55, 0.55, 5.5, M.red); motor.position.y = ORION_TOP+1.0+5.5/2; s.add(motor)
    for (let i = 0; i < 4; i++) {
      const a = (i/4)*Math.PI*2
      const n = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 0.7, 16, 1, true), M.darkGrey)
      n.position.set(Math.cos(a)*0.55, ORION_TOP+1.0+5.5*0.18, Math.sin(a)*0.55)
      n.rotation.z = Math.cos(a)*0.45; n.rotation.x = -Math.sin(a)*0.45; s.add(n)
    }
    const taper = cyl(0.18, 0.55, 1.6, M.red); taper.position.y = ORION_TOP+1.0+5.5+0.8; s.add(taper)
    const acm = cyl(0.22, 0.22, 0.6, M.orionGold); acm.position.y = ORION_TOP+1.0+5.5+1.6+0.3; s.add(acm)
    const tower = cyl(0.12, 0.12, 4.4, M.red); tower.position.y = ORION_TOP+1.0+5.5+1.6+0.6+4.4/2; s.add(tower)
    const tip = cone(0.12, 0.6, M.red); tip.position.y = ORION_TOP+1.0+5.5+1.6+0.6+4.4+0.3; s.add(tip)
  }

  // ── Flames ───────────────────────────────────────────────────────────
  const flameMeshes = []
  function makeFlame(x, z, scale = 1, color = 0xffcc66) {
    const grp = new THREE.Group()
    const innerMat = new THREE.MeshBasicMaterial({ color: 0xffffee, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false })
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.6*scale, 6*scale, 24, 1, true), innerMat)
    inner.rotation.x = Math.PI; inner.position.y = -3*scale; grp.add(inner)
    const outerMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false })
    const outer = new THREE.Mesh(new THREE.ConeGeometry(1.2*scale, 12*scale, 24, 1, true), outerMat)
    outer.rotation.x = Math.PI; outer.position.y = -6*scale; grp.add(outer)
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff8833, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false })
    const glow = new THREE.Mesh(new THREE.ConeGeometry(2.0*scale, 18*scale, 24, 1, true), glowMat)
    glow.rotation.x = Math.PI; glow.position.y = -9*scale; grp.add(glow)
    grp.position.set(x, 0, z)
    flameMeshes.push({ inner, outer, glow })
    return grp
  }
  for (let i = 0; i < 4; i++) {
    const a = (i/4)*Math.PI*2 + Math.PI/4
    G.flame.add(makeFlame(Math.cos(a)*1.7, Math.sin(a)*1.7, 0.8, 0xaaccff))
  }
  G.flame.add(makeFlame( (4.2+1.85+0.4), 0, 1.4, 0xffaa44))
  G.flame.add(makeFlame(-(4.2+1.85+0.4), 0, 1.4, 0xffaa44))
  G.flame.visible = false

  const EXPLODE_OFFSETS = { core:0, srbL:0, srbR:0, lvsa:10, icps:18, osa:24, service:30, orion:38, las:46 }

  return { root, G, flameMeshes, restY, EXPLODE_OFFSETS }
}

const SCALE = 0.005

export default function Rocket({
  showFlame    = false,
  showLabels   = false,
  exploded     = 0,
  rotationSpeed = 0,
}) {
  // Build rocket geometry AND apply world transform imperatively in useMemo.
  // This avoids r3f prop-application quirks with quaternion + position + scale
  // that can produce wrong matrix composition order.
  const { wrapper, G, flameMeshes, restY, EXPLODE_OFFSETS } = useMemo(() => {
    const built = buildRocket()

    // Shift inner root up by 0.6 m so SRB nozzle tips (lowest point at Y=-0.6 m)
    // sit exactly at the wrapper's local Y=0.
    built.root.position.y = 0.6

    // Wrapper holds position + orientation + scale — set all imperatively.
    // Surface offset: 0.25 scene units along KSC_NORMAL so the base is
    // clearly above the Earth mesh regardless of camera angle or depth precision.
    const wrapper = new THREE.Group()
    wrapper.position.copy(KSC_SURFACE).addScaledVector(KSC_NORMAL, 0.25)
    wrapper.quaternion.copy(KSC_QUAT)
    wrapper.scale.setScalar(SCALE)
    wrapper.add(built.root)

    return { wrapper, ...built }
  }, [])

  const groupRef = useRef(wrapper)

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const now = performance.now()

    // explode
    for (const k of Object.keys(EXPLODE_OFFSETS)) {
      G[k].position.y = (restY[k] || 0) + EXPLODE_OFFSETS[k] * exploded
    }
    G.srbL.position.x =  (4.2+1.85+0.4) + 6  * exploded
    G.srbR.position.x = -(4.2+1.85+0.4) - 6  * exploded

    // flame flicker
    G.flame.visible = showFlame
    if (showFlame) {
      flameMeshes.forEach(({ inner, outer, glow }, i) => {
        const ph = i * 0.7
        const f = 0.85 + Math.sin(now*0.02)*0.08 + Math.random()*0.05
        inner.material.opacity = 0.85 * f
        outer.material.opacity = 0.5  + Math.sin(now*0.03+ph)*0.08
        glow.material.opacity  = 0.32 + Math.sin(now*0.015+ph)*0.06
        inner.scale.y = 0.95 + Math.sin(now*0.04+ph)*0.08
        outer.scale.y = 0.95 + Math.sin(now*0.025+ph)*0.1
      })
    }

    // auto-rotate around surface normal (wrapper's local Y)
    if (rotationSpeed) {
      wrapper.rotateY(rotationSpeed * dt)
    }
  })

  return <primitive object={wrapper} />
}
