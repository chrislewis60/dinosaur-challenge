import { createContext, useContext, useState, useEffect } from 'react'

const AudioContext = createContext()

export function AudioProvider({ children }) {
  const [musicVolume, setMusicVolume] = useState(() => {
    const saved = localStorage.getItem('musicVolume')
    return saved !== null ? parseFloat(saved) : 0.5
  })
  
  const [sfxVolume, setSfxVolume] = useState(() => {
    const saved = localStorage.getItem('sfxVolume')
    return saved !== null ? parseFloat(saved) : 0.7
  })

  const [masterVolume, setMasterVolume] = useState(() => {
    const saved = localStorage.getItem('masterVolume')
    return saved !== null ? parseFloat(saved) : 1.0
  })

  useEffect(() => {
    localStorage.setItem('musicVolume', musicVolume)
  }, [musicVolume])

  useEffect(() => {
    localStorage.setItem('sfxVolume', sfxVolume)
  }, [sfxVolume])

  useEffect(() => {
    localStorage.setItem('masterVolume', masterVolume)
  }, [masterVolume])

  return (
    <AudioContext.Provider value={{
      musicVolume,
      setMusicVolume,
      sfxVolume,
      setSfxVolume,
      masterVolume,
      setMasterVolume,
    }}>
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider')
  }
  return context
}
