# Audio Setup Guide

Your game now has immersive sound effects integrated throughout! **Test sound files have been automatically generated!**

## ✅ Current Status

### Music Files (public/music/)
- ✅ **arcade.mp3** - Background music for arcade room
- ✅ **warehouse.mp3** - Background music for warehouse mission

### Sound Effects (public/sounds/)
- ✅ **click.mp3** - Button click sound
- ✅ **sit.mp3** - Sitting down sound  
- ✅ **stand.mp3** - Standing up sound
- ✅ **footstep.mp3** - Walking sound (plays every 0.45s while moving)
- ✅ **mission-start.mp3** - Mission activation sound
- ✅ **door-lock.mp3** - Lock picking sound (loops while holding F)
- ✅ **door-open.mp3** - Door unlocking/opening
- ✅ **alarm.mp3** - Guard detection alarm
- ✅ **hack.mp3** - Terminal hacking sound
- ✅ **success.mp3** - Mission complete sound
- ✅ **jump.mp3** - Jump sound (optional)

## 🎮 How to Hear the Audio

1. **Start the game**: Make sure your dev server is running (`npm run dev`)
2. **Click "CLICK TO START"**: This is IMPORTANT - browsers require a user interaction to start audio
3. **Listen**: You should now hear the arcade background music and sound effects!

## 🔇 Troubleshooting

If you can't hear audio:

1. **Check browser console** (F12) for audio warnings
2. **Verify you clicked "CLICK TO START"** - this is required by browsers for audio playback
3. **Check volume settings** - Press ESC in-game to access volume controls
4. **Check browser audio** - Make sure your browser tab isn't muted
5. **Try clicking anywhere** - Some browsers need a click to enable audio

## 🎵 Replace with Better Audio (Optional)

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
- ✅ **Footsteps** - Plays automatically every 0.45s while moving (WASD)
- ✅ Sitting/standing at arcade machine
- ✅ Mission start (clicking arcade screen when ready)
- ✅ **Lock picking** - Continuous sound loop while holding F at the door
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
 and automatic:
- Footsteps play while moving
- Lock picking sounds loop while holding F
- All UI interactions have click sounds
- Music changes with each scene
- No configuration needssions
- No additional setup required - just add the files!

Enjoy your enhanced gaming experience! 🦖🎵
