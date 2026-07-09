import { useState } from 'react'
import Cutscene from './components/Cutscene'
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
        <Game onExit={() => setScene('cutscene')} />
      )}
    </div>
  )
}

export default App
