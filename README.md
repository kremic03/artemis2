# Artemis II — Interactive 3D Mission Simulation

A browser-based 3D simulation of the Artemis II crewed lunar flyby mission, built with React and Three.js (via `@react-three/fiber`).

## Tech Stack

| Tool | Role |
|------|------|
| [Vite](https://vitejs.dev) | Build & dev server |
| [React 18](https://react.dev) | UI & component tree |
| [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) | React renderer for Three.js |
| [@react-three/drei](https://github.com/pmndrs/drei) | Helpers (GLTF loader, OrbitControls, Stars…) |
| [Three.js](https://threejs.org) | 3D engine |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── app/                    # Root component, providers
├── components/
│   ├── HUD/                # Mission HUD overlay (phase, telemetry)
│   ├── controls/           # Buttons (LaunchButton, etc.)
│   └── overlay/            # Fullscreen overlays (intro, splashdown)
├── features/
│   ├── space-scene/        # Three.js Canvas, camera, lights, celestial objects
│   │   └── objects/        # Earth, Moon, star field
│   ├── rocket/             # Rocket model + physics hook
│   └── mission/            # Mission phase state (Context + hooks)
├── shared/
│   ├── constants/          # mission phases, camera presets, body dimensions
│   ├── hooks/              # useAnimationLoop, useMissionTimer
│   └── utils/              # formatMET, formatDistance, formatVelocity
├── assets/
│   ├── models/             # (bundled .glb files — small assets only)
│   └── textures/           # (bundled textures — small assets only)
└── styles/
    └── global.css

public/
├── models/                 # Large .glb files served statically
└── textures/               # Large texture maps (earth, moon, stars)
```

## Adding 3D Models

1. Export your model from Blender as `.glb`.
2. Place it in `public/models/` (e.g. `public/models/sls_rocket.glb`).
3. In `RocketModel.jsx`, uncomment the `useGLTF` block and remove the placeholder geometry.

## Adding Textures

Place texture files in `public/textures/` and reference them with:

```js
const texture = useTexture('/textures/earth_day.jpg')
```

## Mission Phases

| Phase | Description |
|-------|-------------|
| `idle` | Pre-launch, awaiting command |
| `launch` | Liftoff and ascent |
| `max_q` | Maximum aerodynamic pressure |
| `orbit` | Earth orbit insertion |
| `trans_lunar` | Trans-Lunar Injection burn |
| `lunar_flyby` | Lunar close approach |
| `return` | Return trajectory |
| `splashdown` | Pacific Ocean recovery |
