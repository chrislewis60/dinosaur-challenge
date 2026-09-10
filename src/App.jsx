import { useState } from 'react'
import Cutscene from './components/Cutscene'
import MissionCutscene from './components/MissionCutscene'
import Level2Cutscene from './components/Level2Cutscene'
import CompletionCutscene from './components/CompletionCutscene'
import Game from './components/Game'
import WarehouseLevel from './components/WarehouseLevel'
import PoliceStationLevel from './components/PoliceStationLevel'
import './App.css'

function App() {
  const [scene, setScene] = useState('cutscene')
  const [warehouseCompleted, setWarehouseCompleted] = useState(false)
  const [policeStationCompleted, setPoliceStationCompleted] = useState(false)

  const startMissionBySelection = (selectedIndex) => {
    if (selectedIndex === 1 && warehouseCompleted) {
      setScene('level2-cutscene')
      return
    }
    setScene('mission-cutscene')
  }

  return (
    <div id="game-root">
      {scene === 'cutscene' && (
        <Cutscene onStart={() => setScene('game')} />
      )}
      {scene === 'game' && (
        <Game
          onExit={() => setScene('cutscene')}
          onMissionStart={startMissionBySelection}
          levelCompleted={warehouseCompleted && policeStationCompleted}
          warehouseCompleted={warehouseCompleted}
          policeStationCompleted={policeStationCompleted}
        />
      )}
      {scene === 'mission-cutscene' && (
        <MissionCutscene onComplete={() => setScene('warehouse')} />
      )}
      {scene === 'warehouse' && (
        <WarehouseLevel 
          onExit={() => setScene('game')} 
          onComplete={() => {
            setWarehouseCompleted(true)
            setScene('level2-cutscene')
          }}
        />
      )}
      {scene === 'level2-cutscene' && (
        <Level2Cutscene onComplete={() => setScene('police-station')} />
      )}
      {scene === 'police-station' && (
        <PoliceStationLevel 
          onExit={() => setScene('game')} 
          onComplete={() => {
            setPoliceStationCompleted(true)
            setScene('completion-cutscene')
          }}
        />
      )}
      {scene === 'completion-cutscene' && (
        <CompletionCutscene onComplete={() => setScene('game')} />
      )}
    </div>
  )
}

export default App
