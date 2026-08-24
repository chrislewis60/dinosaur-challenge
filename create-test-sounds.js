import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple WAV file with various sound effects
function createWavSound(filename, soundType, duration) {
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
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
    
    // Audio data
    const audioData = Buffer.alloc(numSamples * bytesPerSample);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        let sample = 0;
        
        switch(soundType) {
            case 'click':
                // Sharp, short beep
                const clickEnv = Math.max(0, 1 - t / duration);
                sample = Math.sin(2 * Math.PI * 1200 * t) * clickEnv * 0.5;
                break;
                
            case 'sit':
            case 'stand':
                // Soft creak sound
                const creakEnv = Math.max(0, 1 - t / duration);
                sample = (Math.random() * 2 - 1) * creakEnv * 0.15;
                sample += Math.sin(2 * Math.PI * 120 * t) * creakEnv * 0.1;
                break;
                
            case 'footstep':
                // Thud sound
                const thudEnv = Math.max(0, 1 - t / (duration * 0.7));
                sample = (Math.random() * 2 - 1) * thudEnv * 0.3;
                sample += Math.sin(2 * Math.PI * 80 * t) * thudEnv * 0.2;
                break;
                
            case 'mission-start':
                // Rising digital beep
                const freq = 440 + (880 * (t / duration));
                const startEnv = Math.sin(Math.PI * t / duration);
                sample = Math.sin(2 * Math.PI * freq * t) * startEnv * 0.4;
                break;
                
            case 'door-lock':
                // Clicking/scraping sound
                const lockEnv = 0.3 + Math.sin(2 * Math.PI * 8 * t) * 0.2;
                sample = (Math.random() * 2 - 1) * lockEnv * 0.25;
                sample += Math.sin(2 * Math.PI * 200 * t) * 0.1;
                break;
                
            case 'door-open':
                // Creaking door
                const openEnv = Math.max(0, 1 - t / duration);
                sample = (Math.random() * 2 - 1) * openEnv * 0.2;
                sample += Math.sin(2 * Math.PI * 150 * t + Math.sin(t * 10) * 2) * openEnv * 0.15;
                break;
                
            case 'alarm':
                // Alternating siren
                const alarmFreq = (Math.floor(t * 4) % 2 === 0) ? 800 : 600;
                sample = Math.sin(2 * Math.PI * alarmFreq * t) * 0.5;
                break;
                
            case 'hack':
                // Rapid beeping
                const hackEnv = Math.sin(Math.PI * (t % 0.1) / 0.1);
                sample = Math.sin(2 * Math.PI * 1000 * t) * hackEnv * 0.3;
                sample += (Math.random() * 2 - 1) * 0.05;
                break;
                
            case 'success':
                // Triumphant ascending tones
                const notes = [523, 659, 784, 1047]; // C, E, G, C
                const noteIndex = Math.min(Math.floor(t / (duration / 4)), 3);
                const successEnv = Math.sin(Math.PI * ((t % (duration / 4)) / (duration / 4)));
                sample = Math.sin(2 * Math.PI * notes[noteIndex] * t) * successEnv * 0.4;
                break;
                
            case 'jump':
                // Whoosh sound
                const jumpEnv = Math.max(0, 1 - t / duration);
                sample = (Math.random() * 2 - 1) * jumpEnv * 0.3;
                sample += Math.sin(2 * Math.PI * (400 - 200 * t / duration) * t) * jumpEnv * 0.2;
                break;
                
            default:
                // Default beep
                sample = Math.sin(2 * Math.PI * 440 * t) * 0.3;
        }
        
        // Apply fade out to prevent clicking
        if (i > numSamples - 1000) {
            sample *= (numSamples - i) / 1000;
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

// Create sounds directory if it doesn't exist
const soundsDir = path.join(__dirname, 'public', 'sounds');
if (!fs.existsSync(soundsDir)) {
    fs.mkdirSync(soundsDir, { recursive: true });
}

// Create sound effects
const sounds = [
    { name: 'click.mp3', type: 'click', duration: 0.1 },
    { name: 'sit.mp3', type: 'sit', duration: 0.3 },
    { name: 'stand.mp3', type: 'stand', duration: 0.25 },
    { name: 'footstep.mp3', type: 'footstep', duration: 0.2 },
    { name: 'mission-start.mp3', type: 'mission-start', duration: 0.8 },
    { name: 'door-lock.mp3', type: 'door-lock', duration: 0.5 },
    { name: 'door-open.mp3', type: 'door-open', duration: 1.0 },
    { name: 'alarm.mp3', type: 'alarm', duration: 2.0 },
    { name: 'hack.mp3', type: 'hack', duration: 1.5 },
    { name: 'success.mp3', type: 'success', duration: 1.2 },
    { name: 'jump.mp3', type: 'jump', duration: 0.4 },
];

sounds.forEach(({ name, type, duration }) => {
    createWavSound(path.join(soundsDir, name), type, duration);
});

console.log('\n✅ Test sound effects created!');
console.log('📁 Location: public/sounds/');
console.log('🎮 Your game now has audio!');
