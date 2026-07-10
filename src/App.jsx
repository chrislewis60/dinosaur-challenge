import { useState } from 'react'
import Cutscene from './components/Cutscene'
import MissionCutscene from './components/MissionCutscene'
import Game from './components/Game'
import WarehouseLevel from './components/WarehouseLevel'
import './App.css'

function App() {
  const [scene, setScene] = useState('cutscene')

  return (
    <div id="game-root">
      {scene === 'cutscene' && (
        <Cutscene onStart={() => setScene('game')} />
      )}
      {scene === 'game' && (
        <Game
          onExit={() => setScene('cutscene')}
          onMissionStart={() => setScene('mission-cutscene')}
        />
      )}
      {scene === 'mission-cutscene' && (
        <MissionCutscene onComplete={() => setScene('warehouse')} />
      )}
      {scene === 'warehouse' && (
        <WarehouseLevel onExit={() => setScene('cutscene')} />
      )}
    </div>
  )
}

export default App
