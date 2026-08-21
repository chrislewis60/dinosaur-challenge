import { useRef, useEffect } from 'react'
import { useAudio } from './AudioContext'

/**
 * Hook for playing sound effects
 * @param {string} src - Path to the sound file
 * @param {object} options - Sound options
 * @param {number} options.baseVolume - Base volume level (0.0 to 1.0)
 * @param {boolean} options.loop - Whether to loop the sound
 * @returns {object} - { play, stop, isPlaying }
 */
export function useSound(src, { baseVolume = 1.0, loop = false } = {}) {
  const { sfxVolume, masterVolume } = useAudio()
  const audioRef = useRef(null)
  const isPlayingRef = useRef(false)

  useEffect(() => {
    audioRef.current = new Audio(src)
    audioRef.current.loop = loop
    
    audioRef.current.addEventListener('error', () => {
      console.warn(`🔊 Sound file not found: ${src}`)
    })

    audioRef.current.addEventListener('ended', () => {
      isPlayingRef.current = false
    })

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [src, loop])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = baseVolume * sfxVolume * masterVolume
    }
  }, [baseVolume, sfxVolume, masterVolume])

  const play = () => {
    if (audioRef.current && !isPlayingRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.volume = baseVolume * sfxVolume * masterVolume
      const playPromise = audioRef.current.play()
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          isPlayingRef.current = true
        }).catch(err => {
          console.warn('Audio playback prevented:', err.message)
        })
      }
    }
  }

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      isPlayingRef.current = false
    }
  }

  return { play, stop, isPlaying: isPlayingRef.current }
}

/**
 * Hook for managing multiple sound effects
 */
export function useSoundManager() {
  const soundsRef = useRef(new Map())
  const { sfxVolume, masterVolume } = useAudio()

  useEffect(() => {
    return () => {
      soundsRef.current.forEach(audio => {
        audio.pause()
      })
      soundsRef.current.clear()
    }
  }, [])

  const play = (src, baseVolume = 1.0) => {
    let audio = soundsRef.current.get(src)
    
    if (!audio) {
      audio = new Audio(src)
      audio.addEventListener('error', () => {
        console.warn(`🔊 Sound file not found: ${src}`)
      })
      soundsRef.current.set(src, audio)
    }

    audio.currentTime = 0
    audio.volume = baseVolume * sfxVolume * masterVolume
    
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Audio playback prevented:', err.message)
      })
    }
  }

  return { play }
}
