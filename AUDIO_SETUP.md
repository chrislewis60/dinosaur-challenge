# Audio Setup Guide

Your game now has a complete audio system with volume controls! This guide will help you add the music and sound effect files.

## 🎵 Music Files Required

Add these files to `public/music/`:

### Background Music
- **arcade.mp3** ✅ (already present) - Underground arcade scene
- **warehouse.mp3** ✅ (already present) - Warehouse stealth mission
- **cutscene.mp3** ⚠️ (NEW) - Opening story cutscene
- **mission.mp3** ⚠️ (NEW) - Mission briefing cutscene

**Suggested Styles:**
- **cutscene.mp3**: Cinematic, dramatic orchestral or synthwave intro music
- **mission.mp3**: Tense, suspenseful electronic music (think spy movie)

## 🔊 Sound Effects Required

Add these files to `public/sounds/`:

### UI & Interaction Sounds
- **click.mp3** - Button click sound (sharp, digital beep)
- **interact.mp3** - General interaction feedback (optional)

### Character Actions
- **sit.mp3** - Sitting down sound (chair creak/cushion)
- **stand.mp3** - Standing up sound (subtle chair noise)
- **footstep.mp3** - Walking sound (optional for future use)
- **jump.mp3** - Jump sound (optional for future use)

### Mission Sounds
- **mission-start.mp3** - Mission activation sound (digital/tech startup)
- **door-lock.mp3** - Lock picking sound (clicking, scraping, mechanical)
- **door-open.mp3** - Door unlocking/opening (latch click, creak)
- **alarm.mp3** - Guard detection alarm (urgent beeping/siren)
- **hack.mp3** - Terminal hacking sound (rapid keyboard typing, beeps)
- **success.mp3** - Mission complete sound (triumphant chime/fanfare)

## 🎛️ Volume Controls

A volume control panel is now available in the top-right corner:
- **Master Volume** - Overall game audio level
- **Music** - Background music volume (affects all music tracks)
- **Sound FX** - Sound effects volume (affects all game sounds)

Volume settings are saved automatically to localStorage.

## 📦 Where to Find Audio Files

### Free Music Sources
- **Incompetech** (Kevin MacLeod) - https://incompetech.com/music/
- **Purple Planet Music** - https://www.purple-planet.com/
- **Free Music Archive** - https://freemusicarchive.org/
- **Bensound** - https://www.bensound.com/
- **OpenGameArt.org** - https://opengameart.org/

### Free Sound Effects
- **Freesound.org** - https://freesound.org/
- **Zapsplat** - https://www.zapsplat.com/
- **Mixkit.co** - https://mixkit.co/free-sound-effects/
- **BBC Sound Effects** - https://sound-effects.bbcrewind.co.uk/
- **Sonniss** - https://sonniss.com/gameaudiogdc (free annual packs)

## 💡 Audio Tips

1. **File Format**: MP3 is recommended for best browser compatibility
2. **File Size**: Keep sound effects under 500KB, music under 5MB
3. **Volume Levels**: Normalize your audio files to avoid clipping
4. **Length**: 
   - Sound effects: 0.5-2 seconds
   - Button clicks: < 0.5 seconds
   - Music loops: 1-3 minutes (set to loop seamlessly)

## 🛠️ Testing Without Files

The game will work without audio files! Missing files will:
- Show helpful console warnings
- Not block gameplay
- Allow you to test the game silently

## 📝 Implementation Details

### Current Sound Triggers
- ✅ Button clicks (start game, skip cutscenes, exit)
- ✅ Sitting/standing at arcade machine
- ✅ Mission start (clicking arcade screen when ready)
- ✅ Lock picking (continuous while holding F)
- ✅ Door opening (when lock is fully picked)
- ✅ Guard detection alarm
- ✅ Terminal hacking (F key at server)
- ✅ Mission success

### Music Playback
- ✅ Arcade scene - plays while game is active
- ✅ Warehouse scene - plays until mission complete
- ✅ Cutscenes - plays throughout story sequences
- ✅ Smooth fade in/out transitions
- ✅ Respects volume settings from control panel

## 🚀 Quick Start

1. Create folders if they don't exist:
   ```
   public/sounds/
   ```

2. Download/create your audio files

3. Place music files in `public/music/`

4. Place sound effects in `public/sounds/`

5. Start your dev server and test!

## 🎮 Usage

The audio system is fully integrated:
- Volume controls appear in top-right corner (🔊 button)
- All sounds respect master volume and individual channel volumes
- Settings persist across sessions
- No additional setup required - just add the files!

Enjoy your enhanced gaming experience! 🦖🎵
