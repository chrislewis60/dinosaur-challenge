import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple WAV file with a beeping sound
function createSimpleWav(filename, frequency, duration) {
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
    header.writeUInt32LE(16, 16); // Subchunk size
    header.writeUInt16LE(1, 20); // Audio format (PCM)
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28);
    header.writeUInt16LE(numChannels * bytesPerSample, 32);
    header.writeUInt16LE(bytesPerSample * 8, 34);
    
    // data sub-chunk
    header.write('data', 36);
    header.writeUInt32LE(numSamples * numChannels * bytesPerSample, 40);
    
    // Audio data
    const audioData = Buffer.alloc(numSamples * bytesPerSample);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        let sample = 0;
        
        // Simple square wave with multiple frequencies for arcade feel
        if (filename.includes('arcade')) {
            const notes = [523, 587, 659, 523]; // C, D, E, C
            const noteIndex = Math.floor(t * 2) % notes.length;
            const freq = notes[noteIndex];
            sample = Math.sin(2 * Math.PI * freq * t) * 0.3;
        } else {
            // Low, ominous tone for warehouse
            sample = Math.sin(2 * Math.PI * 110 * t) * 0.2 + 
                     Math.sin(2 * Math.PI * 55 * t) * 0.15;
        }
        
        // Convert to 16-bit PCM
        const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
        audioData.writeInt16LE(intSample, i * bytesPerSample);
    }
    
    // Combine header and audio data
    const wav = Buffer.concat([header, audioData]);
    
    // Write file
    fs.writeFileSync(filename, wav);
    console.log(`Created ${filename}`);
}

// Create the music files
const musicDir = path.join(__dirname, 'public', 'music');
createSimpleWav(path.join(musicDir, 'arcade.mp3'), 440, 10);
createSimpleWav(path.join(musicDir, 'warehouse.mp3'), 110, 10);

console.log('Test music files created!');
