import { useState } from 'react'
import Cutscene from './components/Cutscene'
import MissionCutscene from './components/MissionCutscene'
import Game from './components/Game'
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
        <MissionCutscene onComplete={() => setScene('game')} />
      )}
    </div>
  )
}

export default App
