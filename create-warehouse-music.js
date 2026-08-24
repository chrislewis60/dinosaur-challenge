import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a suspenseful warehouse stealth music track
function createWarehouseMusic(filename, duration) {
    const sampleRate = 44100;
    const numSamples = sampleRate * duration;
    const numChannels = 1;
    const bytesPerSample = 2;
    
    // WAV header
    const header = Buffer.alloc(44);
    
    // RIFF chunk descriptor
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + numSamples * numChannels * bytesPerSample, 4);
    header.write('WAVE', 8);
    
    // fmt sub-chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28);
    header.writeUInt16LE(numChannels * bytesPerSample, 32);
    header.writeUInt16LE(bytesPerSample * 8, 34);
    
    // data sub-chunk
    header.write('data', 36);
    header.writeUInt32LE(numSamples * numChannels * bytesPerSample, 40);
    
    // Audio data - Create suspenseful, dark ambient music
    const audioData = Buffer.alloc(numSamples * bytesPerSample);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        let sample = 0;
        
        // Deep bass pulse (heartbeat-like)
        const bassFreq = 55; // Low A
        const pulseMod = Math.sin(2 * Math.PI * 0.8 * t) * 0.5 + 0.5; // Slow pulse
        sample += Math.sin(2 * Math.PI * bassFreq * t) * pulseMod * 0.25;
        
        // Sub-bass drone
        sample += Math.sin(2 * Math.PI * (bassFreq / 2) * t) * 0.15;
        
        // Tension building pad (minor chord)
        const padVolume = (Math.sin(2 * Math.PI * 0.1 * t) * 0.5 + 0.5) * 0.12;
        sample += Math.sin(2 * Math.PI * 220 * t) * padVolume; // A3
        sample += Math.sin(2 * Math.PI * 261.63 * t) * padVolume * 0.8; // C4 (minor third)
        sample += Math.sin(2 * Math.PI * 329.63 * t) * padVolume * 0.6; // E4
        
        // Atmospheric shimmer (high frequencies)
        const shimmerMod = Math.sin(2 * Math.PI * 0.2 * t) * 0.5 + 0.5;
        sample += Math.sin(2 * Math.PI * 1760 * t + Math.sin(t * 3) * 5) * shimmerMod * 0.08;
        
        // Tension riser every 4 seconds
        const riserPhase = (t % 8) / 8;
        if (riserPhase > 0.75) { // Last quarter of the cycle
            const riserProgress = (riserPhase - 0.75) * 4;
            const riserFreq = 100 + (riserProgress * 300);
            sample += Math.sin(2 * Math.PI * riserFreq * t) * riserProgress * 0.15;
        }
        
        // Occasional metallic hit (warehouse ambiance)
        const hitInterval = 4; // Every 4 seconds
        const hitPhase = t % hitInterval;
        if (hitPhase < 0.1) {
            const hitEnv = Math.max(0, 1 - hitPhase / 0.1);
            sample += (Math.random() * 2 - 1) * hitEnv * 0.2;
            sample += Math.sin(2 * Math.PI * 800 * t) * hitEnv * 0.15;
        }
        
        // Breathing effect (adds to tension)
        const breathCycle = Math.sin(2 * Math.PI * 0.15 * t) * 0.02;
        sample += breathCycle;
        
        // Apply overall volume envelope for smooth looping
        const loopEnvelope = 0.9; // Constant volume, easier looping
        sample *= loopEnvelope;
        
        // Soft limiter to prevent clipping
        sample = Math.max(-0.8, Math.min(0.8, sample));
        
        // Convert to 16-bit PCM
        const intSample = Math.floor(sample * 32767);
        audioData.writeInt16LE(intSample, i * bytesPerSample);
    }
    
    // Combine header and audio data
    const wav = Buffer.concat([header, audioData]);
    
    // Write file
    fs.writeFileSync(filename, wav);
    console.log(`✅ Created new warehouse music: ${filename}`);
}

// Create the new warehouse music (15 seconds for seamless looping)
const musicDir = path.join(__dirname, 'public', 'music');
createWarehouseMusic(path.join(musicDir, 'warehouse.mp3'), 16);

console.log('\n🎵 New warehouse music created!');
console.log('🔊 Features:');
console.log('   • Deep bass pulse (heartbeat effect)');
console.log('   • Dark ambient pads');
console.log('   • Tension risers');
console.log('   • Metallic warehouse ambiance');
console.log('   • Atmospheric shimmer');
console.log('\n🎮 Perfect for stealth gameplay!');
