import { MissionProvider } from '@features/mission/MissionContext'
import SpaceScene from '@features/space-scene/SpaceScene'
import HUD from '@components/HUD/HUD'

export default function App() {
  return (
    <MissionProvider>
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <SpaceScene />
        </div>
        <HUD />
      </div>
    </MissionProvider>
  )
}
