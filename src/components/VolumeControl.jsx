import { useState } from 'react'
import { useAudio } from './AudioContext'
import './VolumeControl.css'

export default function VolumeControl() {
  const [isOpen, setIsOpen] = useState(false)
  const { musicVolume, setMusicVolume, sfxVolume, setSfxVolume, masterVolume, setMasterVolume } = useAudio()

  return (
    <div className="volume-control">
      <button 
        className="volume-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Volume Settings"
      >
        🔊
      </button>
      
      {isOpen && (
        <div className="volume-panel">
          <div className="volume-header">AUDIO SETTINGS</div>
          
          <div className="volume-slider-group">
            <label>
              <span className="volume-label">Master</span>
              <span className="volume-value">{Math.round(masterVolume * 100)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={masterVolume * 100}
              onChange={(e) => setMasterVolume(e.target.value / 100)}
              className="volume-slider"
            />
          </div>

          <div className="volume-slider-group">
            <label>
              <span className="volume-label">Music</span>
              <span className="volume-value">{Math.round(musicVolume * 100)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={musicVolume * 100}
              onChange={(e) => setMusicVolume(e.target.value / 100)}
              className="volume-slider"
            />
          </div>

          <div className="volume-slider-group">
            <label>
              <span className="volume-label">Sound FX</span>
              <span className="volume-value">{Math.round(sfxVolume * 100)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={sfxVolume * 100}
              onChange={(e) => setSfxVolume(e.target.value / 100)}
              className="volume-slider"
            />
          </div>
        </div>
      )}
    </div>
  )
}
