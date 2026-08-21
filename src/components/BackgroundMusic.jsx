import { useEffect, useRef } from 'react'
import { useAudio } from './AudioContext'

/**
 * BackgroundMusic component
 * Plays looping background music with fade in/out transitions
 * Shows helpful console messages when files are missing
 * 
 * @param {string} src - URL or path to the audio file
 * @param {number} volume - Volume level (0.0 to 1.0)
 * @param {boolean} play - Whether to play the music
 */
export default function BackgroundMusic({ src, volume = 0.3, play = true }) {
  const audioRef = useRef(null)
  const fadingRef = useRef(false)
  const { musicVolume, masterVolume } = useAudio()

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(src)
      audioRef.current.loop = true
      audioRef.current.volume = 0
      
      // Log when music file is missing
      audioRef.current.addEventListener('error', (e) => {
        console.warn(`🎵 Music file not found: ${src}`)
        console.log('📁 Add your music files to: public/music/')
        console.log('   - arcade.mp3 (for the arcade scene)')
        console.log('   - warehouse.mp3 (for the warehouse scene)')
        console.log('💡 See public/music/README.md for free music sources')
      })
      
      // Log successful load
      audioRef.current.addEventListener('canplaythrough', () => {
        console.log(`🎵 Music loaded: ${src}`)
      })
    }

    const audio = audioRef.current
    const targetVolume = volume * musicVolume * masterVolume

    if (play && audio.paused) {
      // Fade in
      audio.volume = 0
      const playPromise = audio.play()
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('🎵 Music playing:', src)
        }).catch(err => {
          console.log('⚠️ Audio blocked by browser:', err.message)
          console.log('💡 Click anywhere on the page to start audio')
        })
      }
      
      let vol = 0
      const fadeIn = setInterval(() => {
        if (vol < targetVolume) {
          vol = Math.min(vol + 0.02, targetVolume)
          audio.volume = vol
        } else {
          clearInterval(fadeIn)
        }
      }, 50)

      return () => clearInterval(fadeIn)
    } else if (!play && !audio.paused) {
      // Fade out
      fadingRef.current = true
      let vol = audio.volume
      const fadeOut = setInterval(() => {
        if (vol > 0) {
          vol = Math.max(vol - 0.02, 0)
          audio.volume = vol
        } else {
          audio.pause()
          clearInterval(fadeOut)
          fadingRef.current = false
        }
      }, 50)

      return () => clearInterval(fadeOut)
    }
  }, [play, src, volume, musicVolume, masterVolume])

  // Update volume when settings change during playback
  useEffect(() => {
    if (audioRef.current && !audioRef.current.paused && !fadingRef.current) {
      const targetVolume = volume * musicVolume * masterVolume
      audioRef.current.volume = targetVolume
    }
  }, [musicVolume, masterVolume, volume])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return null
}
