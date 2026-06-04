// ==========================================
// Animal Stack (動物疊疊樂) - Core Game Code
// ==========================================

// Audio Files preloaded
const landAudio = new Audio('放上去的.mp3');
landAudio.volume = 0.9; // Strengthened volume as requested
const gameoverAudio = new Audio('失敗.mp3');
gameoverAudio.volume = 0.7; // Standard gameover volume
const collapseAudio = new Audio('動物塔倒掉.wav');
collapseAudio.volume = 0.9; // Clear collapse sound effect
const bgmAudio = new Audio('開場.mp3');
bgmAudio.loop = true;
bgmAudio.volume = 0.4; // Quieter BGM so SFX stand out!

function playBGM() {
    if (soundEnabled && bgmAudio.paused) {
        return bgmAudio.play();
    }
    return Promise.resolve();
}

function stopBGM() {
    bgmAudio.pause();
}

// Web Audio API Synthesizer for Retro Cute Sounds
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!soundEnabled) return;
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    if (type === 'drop') {
        // Cute upward "Boing"
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.15);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);

    } else if (type === 'land') {
        // Play local MP3 file for successful placement
        landAudio.currentTime = 0;
        landAudio.play().catch(e => console.log("Audio play failed:", e));

    } else if (type === 'fail') {
        // Play local WAV file for tower collapse / fall failure
        collapseAudio.currentTime = 0;
        collapseAudio.play().catch(e => console.log("Audio play failed:", e));

    } else if (type === 'cheer') {
        // Happy C-Major Arpeggio
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'sine';
            osc.frequency.value = freq;

            const startT = now + idx * 0.08;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.015, startT + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.22);

            osc.start(startT);
            osc.stop(startT + 0.22);
        });

    } else if (type === 'gameover') {
        // Play local MP3 file for game over
        gameoverAudio.currentTime = 0;
        gameoverAudio.play().catch(e => console.log("Audio play failed:", e));
    }
}

// ==========================================
// Animal Database & SVG rendering functions
// ==========================================
const ANIMAL_TEMPLATES = [
    {
        id: 'capybara',
        name: '水豚',
        width: 96,
        height: 70,
        mass: 1.8,
        shape: 'rectangle',
        color: '#a07050',
        draw: (ctx, w, h, expr) => {
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.beginPath();
            ctx.ellipse(0, h/2 - 4, w/2 - 6, 8, 0, 0, Math.PI*2);
            ctx.fill();

            // Boxy Body
            ctx.fillStyle = '#a07050';
            ctx.beginPath();
            ctx.roundRect(-w/2, -h/2 + 8, w, h - 10, 12);
            ctx.fill();

            // Head wrap (front-left)
            ctx.fillStyle = '#b6805d';
            ctx.beginPath();
            ctx.roundRect(-w/2 - 2, -h/2 + 4, w*0.48, h*0.62, [18, 14, 8, 14]);
            ctx.fill();

            // Snout nose
            ctx.fillStyle = '#7a5035';
            ctx.beginPath();
            ctx.arc(-w/2 + 6, -h/2 + h*0.38, 7, 0, Math.PI * 2);
            ctx.fill();

            // Tiny ears
            ctx.fillStyle = '#7a5035';
            ctx.beginPath();
            ctx.ellipse(w*0.06, -h/2 + 6, 8, 10, -Math.PI/12, 0, Math.PI*2);
            ctx.fill();

            // Tiny feet
            ctx.fillStyle = '#7a5035';
            ctx.fillRect(w*0.2, h/2 - 6, 12, 8);
            ctx.fillRect(-w*0.3, h/2 - 6, 12, 8);

            // Eyes & expressions
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';

            if (expr === 'falling') {
                ctx.strokeStyle = '#503020';
                ctx.beginPath();
                ctx.arc(-w*0.22, -h/2 + h*0.28, 5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = '#503020';
                ctx.beginPath();
                ctx.arc(-w*0.34, -h/2 + h*0.44, 4, 0, Math.PI * 2);
                ctx.fill();
            } else if (expr === 'landed' || expr === 'idle') {
                ctx.strokeStyle = '#503020';
                ctx.beginPath();
                ctx.moveTo(-w*0.28, -h/2 + h*0.28);
                ctx.lineTo(-w*0.16, -h/2 + h*0.28);
                ctx.stroke();
                
                ctx.strokeStyle = '#503020';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(-w*0.32, -h/2 + h*0.38, 4, 0, Math.PI);
                ctx.stroke();
            } else if (expr === 'unstable') {
                ctx.strokeStyle = '#503020';
                ctx.beginPath();
                ctx.moveTo(-w*0.28, -h/2 + h*0.26);
                ctx.bezierCurveTo(-w*0.25, -h/2 + h*0.31, -w*0.2, -h/2 + h*0.22, -w*0.17, -h/2 + h*0.28);
                ctx.stroke();
            } else if (expr === 'dizzy') {
                ctx.strokeStyle = '#503020';
                ctx.beginPath();
                ctx.moveTo(-w*0.26, -h/2 + h*0.22);
                ctx.lineTo(-w*0.18, -h/2 + h*0.34);
                ctx.moveTo(-w*0.18, -h/2 + h*0.22);
                ctx.lineTo(-w*0.26, -h/2 + h*0.34);
                ctx.stroke();
            }

            // Mandarin Orange on head
            ctx.fillStyle = '#ff9f1c';
            ctx.beginPath();
            ctx.arc(w*0.16, -h/2, 12, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#2ec4b6';
            ctx.beginPath();
            ctx.ellipse(w*0.16 + 5, -h/2 - 11, 4, 6, Math.PI/4, 0, Math.PI*2);
            ctx.fill();
        }
    },
    {
        id: 'cat',
        name: '貓咪',
        width: 96,
        height: 70,
        mass: 1.1,
        shape: 'rectangle',
        color: '#f39c12',
        draw: (ctx, w, h, expr) => {
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.beginPath();
            ctx.ellipse(0, h/2 - 4, w/2 - 6, 8, 0, 0, Math.PI*2);
            ctx.fill();

            // Boxy Body
            ctx.fillStyle = '#f39c12';
            ctx.beginPath();
            ctx.roundRect(-w/2, -h/2 + 8, w, h - 10, 12);
            ctx.fill();

            // Cat stripes
            ctx.fillStyle = '#d35400';
            ctx.fillRect(-6, -h/2 + 8, 12, 10);
            ctx.fillRect(w/2 - 8, -4, 8, 12);
            ctx.fillRect(-w/2, -4, 8, 12);

            // Pointy Ears
            ctx.fillStyle = '#f39c12';
            ctx.beginPath();
            ctx.moveTo(-w/3, -h/2 + 8);
            ctx.lineTo(-w/3 - 4, -h/2 - 6);
            ctx.lineTo(-w/3 + 15, -h/2 + 8);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#ff8a80';
            ctx.beginPath();
            ctx.moveTo(-w/3 + 2, -h/2 + 8);
            ctx.lineTo(-w/3 - 2, -h/2 - 2);
            ctx.lineTo(-w/3 + 11, -h/2 + 8);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#f39c12';
            ctx.beginPath();
            ctx.moveTo(w/3, -h/2 + 8);
            ctx.lineTo(w/3 + 4, -h/2 - 6);
            ctx.lineTo(w/3 - 15, -h/2 + 8);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#ff8a80';
            ctx.beginPath();
            ctx.moveTo(w/3 - 2, -h/2 + 8);
            ctx.lineTo(w/3 + 2, -h/2 - 2);
            ctx.lineTo(w/3 - 11, -h/2 + 8);
            ctx.closePath();
            ctx.fill();

            // Tail on the right
            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 7;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(w/2 - 4, 8, 10, -Math.PI/2, Math.PI/2);
            ctx.stroke();

            // Tiny feet
            ctx.fillStyle = '#d35400';
            ctx.fillRect(w*0.2, h/2 - 6, 12, 8);
            ctx.fillRect(-w*0.3, h/2 - 6, 12, 8);

            // Face Expressions
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#2c3e50';
            ctx.lineCap = 'round';

            if (expr === 'falling') {
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.arc(-w/4, -4, 4, 0, Math.PI*2);
                ctx.arc(w/4, -4, 4, 0, Math.PI*2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 4, 4, 0, Math.PI*2);
                ctx.stroke();
            } else if (expr === 'landed' || expr === 'idle') {
                ctx.beginPath();
                ctx.arc(-w/4, -6, 5, Math.PI, 0);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(w/4, -6, 5, Math.PI, 0);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(-3, 4, 3, 0, Math.PI);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(3, 4, 3, 0, Math.PI);
                ctx.stroke();
            } else if (expr === 'unstable') {
                ctx.beginPath();
                ctx.moveTo(-w/4 - 4, -7); ctx.lineTo(-w/4 + 4, -4);
                ctx.moveTo(w/4 + 4, -7); ctx.lineTo(w/4 - 4, -4);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-4, 4); ctx.lineTo(4, 4);
                ctx.stroke();
            } else if (expr === 'dizzy') {
                ctx.beginPath();
                ctx.moveTo(-w/4 - 4, -8); ctx.lineTo(-w/4 + 4, 0);
                ctx.moveTo(-w/4 + 4, -8); ctx.lineTo(-w/4 - 4, 0);
                ctx.moveTo(w/4 - 4, -8); ctx.lineTo(w/4 + 4, 0);
                ctx.moveTo(w/4 + 4, -8); ctx.lineTo(w/4 - 4, 0);
                ctx.stroke();
            }

            // Whiskers
            ctx.strokeStyle = '#d35400';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(-w/2 + 6, 0); ctx.lineTo(-w/2 - 2, -2);
            ctx.moveTo(-w/2 + 6, 4); ctx.lineTo(-w/2 - 2, 4);
            ctx.moveTo(w/2 - 6, 0); ctx.lineTo(w/2 + 2, -2);
            ctx.moveTo(w/2 - 6, 4); ctx.lineTo(w/2 + 2, 4);
            ctx.stroke();

            // Blush
            ctx.fillStyle = 'rgba(255, 138, 128, 0.6)';
            ctx.beginPath();
            ctx.arc(-w/4 - 6, 4, 5, 0, Math.PI*2);
            ctx.arc(w/4 + 6, 4, 5, 0, Math.PI*2);
            ctx.fill();
        }
    },
    {
        id: 'shiba',
        name: '柴犬',
        width: 96,
        height: 70,
        mass: 1.3,
        shape: 'rectangle',
        color: '#e67e22',
        draw: (ctx, w, h, expr) => {
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.beginPath();
            ctx.ellipse(0, h/2 - 4, w/2 - 6, 8, 0, 0, Math.PI*2);
            ctx.fill();

            // Boxy Body
            ctx.fillStyle = '#e67e22';
            ctx.beginPath();
            ctx.roundRect(-w/2, -h/2 + 8, w, h - 10, 12);
            ctx.fill();

            // White face panel
            ctx.fillStyle = '#fff9e6';
            ctx.beginPath();
            ctx.roundRect(-w/2 + 10, -h/2 + 18, w - 20, h - 22, 6);
            ctx.fill();

            // Ears
            ctx.fillStyle = '#e67e22';
            ctx.beginPath();
            ctx.moveTo(-w/3, -h/2 + 8);
            ctx.lineTo(-w/3 - 5, -h/2 - 5);
            ctx.lineTo(-w/3 + 15, -h/2 + 8);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#fff9e6';
            ctx.beginPath();
            ctx.moveTo(-w/3 + 3, -h/2 + 8);
            ctx.lineTo(-w/3 - 2, -h/2 - 1);
            ctx.lineTo(-w/3 + 11, -h/2 + 8);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#e67e22';
            ctx.beginPath();
            ctx.moveTo(w/3, -h/2 + 8);
            ctx.lineTo(w/3 + 5, -h/2 - 5);
            ctx.lineTo(w/3 - 15, -h/2 + 8);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#fff9e6';
            ctx.beginPath();
            ctx.moveTo(w/3 - 3, -h/2 + 8);
            ctx.lineTo(w/3 + 2, -h/2 - 1);
            ctx.lineTo(w/3 - 11, -h/2 + 8);
            ctx.closePath();
            ctx.fill();

            // Muzzle
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(0, 6, 14, 10, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.ellipse(0, 2, 5, 4, 0, 0, Math.PI*2);
            ctx.fill();

            // Feet
            ctx.fillStyle = '#d35400';
            ctx.fillRect(w*0.2, h/2 - 6, 12, 8);
            ctx.fillRect(-w*0.3, h/2 - 6, 12, 8);

            // Expressions
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#2c3e50';
            ctx.lineCap = 'round';

            if (expr === 'falling') {
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.arc(-w/4, -3, 4, 0, Math.PI*2);
                ctx.arc(w/4, -3, 4, 0, Math.PI*2);
                ctx.fill();
                ctx.fillStyle = '#d35400';
                ctx.beginPath();
                ctx.arc(0, 10, 5, 0, Math.PI);
                ctx.fill();
            } else if (expr === 'landed' || expr === 'idle') {
                ctx.beginPath();
                ctx.arc(-w/4, -4, 5, 0, Math.PI, true);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(w/4, -4, 5, 0, Math.PI, true);
                ctx.stroke();
                // Tongue
                ctx.fillStyle = '#ff7675';
                ctx.beginPath();
                ctx.roundRect(-4, 6, 8, 10, [0, 0, 4, 4]);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(-3, 6, 3, 0, Math.PI);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(3, 6, 3, 0, Math.PI);
                ctx.stroke();
            } else if (expr === 'unstable') {
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.arc(-w/4, -3, 3, 0, Math.PI*2);
                ctx.arc(w/4, -3, 3, 0, Math.PI*2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 10, 4, Math.PI, 0);
                ctx.stroke();
            } else if (expr === 'dizzy') {
                ctx.beginPath();
                ctx.moveTo(-w/4 - 4, -7); ctx.lineTo(-w/4 + 4, 1);
                ctx.moveTo(-w/4 + 4, -7); ctx.lineTo(-w/4 - 4, 1);
                ctx.moveTo(w/4 - 4, -7); ctx.lineTo(w/4 + 4, 1);
                ctx.moveTo(w/4 + 4, -7); ctx.lineTo(w/4 - 4, 1);
                ctx.stroke();
            }
        }
    },
    {
        id: 'duck',
        name: '小黃鴨',
        width: 96,
        height: 70,
        mass: 0.9,
        shape: 'rectangle',
        color: '#f1c40f',
        draw: (ctx, w, h, expr) => {
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.beginPath();
            ctx.ellipse(0, h/2 - 4, w/2 - 6, 8, 0, 0, Math.PI*2);
            ctx.fill();

            // Boxy Body
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.roundRect(-w/2, -h/2 + 8, w, h - 10, 12);
            ctx.fill();

            // Wing
            ctx.fillStyle = '#f39c12';
            ctx.beginPath();
            ctx.ellipse(w/2 - 12, 4, 12, 8, Math.PI/6, 0, Math.PI*2);
            ctx.fill();

            // Orange Beak on the left
            ctx.fillStyle = '#e67e22';
            ctx.beginPath();
            ctx.roundRect(-w/2 - 6, -3, 18, 12, [8, 3, 3, 8]);
            ctx.fill();

            // Tiny feet
            ctx.fillStyle = '#e67e22';
            ctx.fillRect(w*0.2, h/2 - 6, 12, 8);
            ctx.fillRect(-w*0.3, h/2 - 6, 12, 8);

            ctx.lineWidth = 3;
            ctx.strokeStyle = '#2c3e50';
            ctx.lineCap = 'round';

            if (expr === 'falling') {
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.arc(-w/4, -6, 4, 0, Math.PI*2);
                ctx.fill();
            } else if (expr === 'landed' || expr === 'idle') {
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.arc(-w/4, -6, 3.5, 0, Math.PI*2);
                ctx.fill();
            } else if (expr === 'unstable') {
                ctx.beginPath();
                ctx.moveTo(-w/4 - 4, -9); ctx.lineTo(-w/4 + 4, -6);
                ctx.stroke();
            } else if (expr === 'dizzy') {
                ctx.beginPath();
                ctx.moveTo(-w/4 - 4, -10); ctx.lineTo(-w/4 + 4, -2);
                ctx.moveTo(-w/4 + 4, -10); ctx.lineTo(-w/4 - 4, -2);
                ctx.stroke();
            }

            // Cheek blush
            ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
            ctx.beginPath();
            ctx.arc(-w/4 + 8, -2, 5, 0, Math.PI*2);
            ctx.fill();
        }
    },
    {
        id: 'penguin',
        name: '企鵝',
        width: 96,
        height: 70,
        mass: 1.4,
        shape: 'rectangle',
        color: '#2c3e50',
        draw: (ctx, w, h, expr) => {
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.beginPath();
            ctx.ellipse(0, h/2 - 4, w/2 - 6, 8, 0, 0, Math.PI*2);
            ctx.fill();

            // Boxy Body
            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.roundRect(-w/2, -h/2 + 8, w, h - 10, 12);
            ctx.fill();

            // White chest wrap
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(-w/2 + 10, -h/2 + 16, w - 20, h - 20, [8, 8, 6, 6]);
            ctx.fill();

            // Orange Beak on the left
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.moveTo(-w/2, -4);
            ctx.lineTo(-w/2 - 8, -4);
            ctx.lineTo(-w/2, 4);
            ctx.closePath();
            ctx.fill();

            // Flippers on side
            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.ellipse(w/2 - 3, 6, 6, 15, -Math.PI/12, 0, Math.PI*2);
            ctx.fill();

            // Feet
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.ellipse(-w/4, h/2 - 4, 8, 5, 0, 0, Math.PI*2);
            ctx.ellipse(w/4, h/2 - 4, 8, 5, 0, 0, Math.PI*2);
            ctx.fill();

            // Eyes
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#2c3e50';
            ctx.lineCap = 'round';

            if (expr === 'falling') {
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.arc(-w/4, -10, 4, 0, Math.PI*2);
                ctx.arc(0, -10, 4, 0, Math.PI*2);
                ctx.fill();
            } else if (expr === 'landed' || expr === 'idle') {
                ctx.beginPath();
                ctx.arc(-w/4, -12, 4, 0, Math.PI, true);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, -12, 4, 0, Math.PI, true);
                ctx.stroke();
            } else if (expr === 'unstable') {
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.arc(-w/4, -10, 2.5, 0, Math.PI*2);
                ctx.arc(0, -10, 2.5, 0, Math.PI*2);
                ctx.fill();
            } else if (expr === 'dizzy') {
                ctx.beginPath();
                ctx.moveTo(-w/4 - 4, -14); ctx.lineTo(-w/4 + 4, -6);
                ctx.moveTo(-w/4 + 4, -14); ctx.lineTo(-w/4 - 4, -6);
                ctx.moveTo(-4, -14); ctx.lineTo(4, -6);
                ctx.moveTo(4, -14); ctx.lineTo(-4, -6);
                ctx.stroke();
            }
        }
    },
    {
        id: 'frog',
        name: '青蛙',
        width: 96,
        height: 70,
        mass: 1.0,
        shape: 'rectangle',
        color: '#2ecc71',
        draw: (ctx, w, h, expr) => {
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.beginPath();
            ctx.ellipse(0, h/2 - 4, w/2 - 6, 8, 0, 0, Math.PI*2);
            ctx.fill();

            // Boxy Body
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.roundRect(-w/2, -h/2 + 8, w, h - 10, 12);
            ctx.fill();

            // Eyes bulging on top
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.arc(-w/3, -h/2 + 10, 12, 0, Math.PI*2);
            ctx.arc(w/3, -h/2 + 10, 12, 0, Math.PI*2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-w/3, -h/2 + 10, 7, 0, Math.PI*2);
            ctx.arc(w/3, -h/2 + 10, 7, 0, Math.PI*2);
            ctx.fill();

            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.arc(-w/3, -h/2 + 10, 3.5, 0, Math.PI*2);
            ctx.arc(w/3, -h/2 + 10, 3.5, 0, Math.PI*2);
            ctx.fill();

            // Tiny feet
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(w*0.2, h/2 - 6, 12, 8);
            ctx.fillRect(-w*0.3, h/2 - 6, 12, 8);

            // Cheek blush
            ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
            ctx.beginPath();
            ctx.arc(-w/4 - 4, 6, 6, 0, Math.PI*2);
            ctx.arc(w/4 + 4, 6, 6, 0, Math.PI*2);
            ctx.fill();

            ctx.lineWidth = 3;
            ctx.strokeStyle = '#2c3e50';
            ctx.lineCap = 'round';

            if (expr === 'falling') {
                ctx.beginPath();
                ctx.arc(0, 6, 5, 0, Math.PI*2);
                ctx.stroke();
            } else if (expr === 'landed' || expr === 'idle') {
                ctx.beginPath();
                ctx.arc(0, 2, 10, 0, Math.PI);
                ctx.stroke();
            } else if (expr === 'unstable') {
                ctx.beginPath();
                ctx.moveTo(-7, 5); ctx.lineTo(7, 5);
                ctx.stroke();
            } else if (expr === 'dizzy') {
                ctx.beginPath();
                ctx.moveTo(-6, 5);
                ctx.bezierCurveTo(-3, 1, 3, 9, 6, 5);
                ctx.stroke();
            }
        }
    },
    {
        id: 'panda',
        name: '熊貓',
        width: 96,
        height: 70,
        mass: 2.0,
        shape: 'rectangle',
        color: '#fbfcfc',
        draw: (ctx, w, h, expr) => {
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.beginPath();
            ctx.ellipse(0, h/2 - 4, w/2 - 6, 8, 0, 0, Math.PI*2);
            ctx.fill();

            // Black ears
            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.arc(-w/3, -h/2 + 10, 12, 0, Math.PI*2);
            ctx.arc(w/3, -h/2 + 10, 12, 0, Math.PI*2);
            ctx.fill();

            // Boxy Body
            ctx.fillStyle = '#fbfcfc';
            ctx.beginPath();
            ctx.roundRect(-w/2, -h/2 + 8, w, h - 10, 12);
            ctx.fill();

            // Black shoulders / arms
            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.roundRect(-w/2 - 2, h/6 - 2, w + 4, h/3 + 2, [0, 0, 10, 10]);
            ctx.fill();

            // Black feet
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(-w/3 - 6, h/2 - 6, 12, 8);
            ctx.fillRect(w/3 - 6, h/2 - 6, 12, 8);

            // Black eye patches
            ctx.fillStyle = '#2c3e50';
            ctx.save();
            ctx.translate(-w/5 - 2, -h/12);
            ctx.rotate(Math.PI/12);
            ctx.beginPath();
            ctx.ellipse(0, 0, 9, 13, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.translate(w/5 + 2, -h/12);
            ctx.rotate(-Math.PI/12);
            ctx.beginPath();
            ctx.ellipse(0, 0, 9, 13, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();

            // Snout white patch
            ctx.fillStyle = '#fbfcfc';
            ctx.beginPath();
            ctx.ellipse(0, h/12 + 2, 12, 8, 0, 0, Math.PI*2);
            ctx.fill();
            // Tiny nose
            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.ellipse(0, h/12, 4, 2.5, 0, 0, Math.PI*2);
            ctx.fill();

            // Blush
            ctx.fillStyle = 'rgba(255, 138, 128, 0.5)';
            ctx.beginPath();
            ctx.arc(-w/3 + 4, 6, 5, 0, Math.PI*2);
            ctx.arc(w/3 - 4, 6, 5, 0, Math.PI*2);
            ctx.fill();

            // Eyes & expressions
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#ffffff';
            ctx.lineCap = 'round';

            if (expr === 'falling') {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(-w/5 - 2, -h/12, 3, 0, Math.PI*2);
                ctx.arc(w/5 + 2, -h/12, 3, 0, Math.PI*2);
                ctx.fill();
                ctx.strokeStyle = '#2c3e50';
                ctx.beginPath();
                ctx.arc(0, h/12 + 4, 3, 0, Math.PI*2);
                ctx.stroke();
            } else if (expr === 'landed' || expr === 'idle') {
                // Happy closed eyes inside black patches
                ctx.beginPath();
                ctx.arc(-w/5 - 2, -h/12 - 2, 3, 0, Math.PI, true);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(w/5 + 2, -h/12 - 2, 3, 0, Math.PI, true);
                ctx.stroke();
                // Smiling mouth
                ctx.strokeStyle = '#2c3e50';
                ctx.beginPath();
                ctx.arc(-2, h/12 + 3, 2, 0, Math.PI);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(2, h/12 + 3, 2, 0, Math.PI);
                ctx.stroke();
            } else if (expr === 'unstable') {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(-w/5 - 2, -h/12, 2, 0, Math.PI*2);
                ctx.arc(w/5 + 2, -h/12, 2, 0, Math.PI*2);
                ctx.fill();
                ctx.strokeStyle = '#2c3e50';
                ctx.beginPath();
                ctx.moveTo(-3, h/12 + 4); ctx.lineTo(3, h/12 + 4);
                ctx.stroke();
            } else if (expr === 'dizzy') {
                ctx.beginPath();
                ctx.moveTo(-w/5 - 5, -h/12 - 3); ctx.lineTo(-w/5 + 1, -h/12 + 3);
                ctx.moveTo(-w/5 + 1, -h/12 - 3); ctx.lineTo(-w/5 - 5, -h/12 + 3);
                ctx.moveTo(w/5 - 1, -h/12 - 3); ctx.lineTo(w/5 + 5, -h/12 + 3);
                ctx.moveTo(w/5 + 5, -h/12 - 3); ctx.lineTo(w/5 - 1, -h/12 + 3);
                ctx.stroke();
            }
        }
    },
    {
        id: 'bunny',
        name: '兔子',
        width: 96,
        height: 70,
        mass: 1.0,
        shape: 'rectangle',
        color: '#ffffff',
        draw: (ctx, w, h, expr) => {
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.beginPath();
            ctx.ellipse(0, h/2 - 4, w/2 - 6, 6, 0, 0, Math.PI*2);
            ctx.fill();

            // Long white ears
            ctx.fillStyle = '#ffffff';
            ctx.save();
            ctx.translate(-w/4, -h/2 + 10);
            ctx.rotate(-Math.PI/24);
            ctx.beginPath();
            ctx.ellipse(0, -10, 8, 20, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#ffc0cb';
            ctx.beginPath();
            ctx.ellipse(0, -10, 4, 15, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();

            ctx.fillStyle = '#ffffff';
            ctx.save();
            ctx.translate(w/4, -h/2 + 10);
            ctx.rotate(Math.PI/24);
            ctx.beginPath();
            ctx.ellipse(0, -10, 8, 20, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#ffc0cb';
            ctx.beginPath();
            ctx.ellipse(0, -10, 4, 15, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();

            // Boxy Body
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(-w/2, -h/2 + 8, w, h - 10, 12);
            ctx.fill();

            // Little pink nose
            ctx.fillStyle = '#ff8da1';
            ctx.beginPath();
            ctx.moveTo(-3, 0);
            ctx.lineTo(3, 0);
            ctx.lineTo(0, 3);
            ctx.closePath();
            ctx.fill();

            // Little feet
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(-w/3, h/2 - 6, 12, 8);
            ctx.fillRect(w/3 - 12, h/2 - 6, 12, 8);

            // Cheek blush
            ctx.fillStyle = 'rgba(255, 182, 193, 0.6)';
            ctx.beginPath();
            ctx.arc(-w/4 - 6, 4, 5, 0, Math.PI*2);
            ctx.arc(w/4 + 6, 4, 5, 0, Math.PI*2);
            ctx.fill();

            // Eyes & expressions
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#2c3e50';
            ctx.lineCap = 'round';

            if (expr === 'falling') {
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.arc(-w/4, -6, 3, 0, Math.PI*2);
                ctx.arc(w/4, -6, 3, 0, Math.PI*2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 6, 3.5, 0, Math.PI*2);
                ctx.stroke();
            } else if (expr === 'landed' || expr === 'idle') {
                ctx.beginPath();
                ctx.arc(-w/4, -7, 4, 0, Math.PI, true);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(w/4, -7, 4, 0, Math.PI, true);
                ctx.stroke();
                // Bunny mouth
                ctx.beginPath();
                ctx.arc(-2, 5, 2, 0, Math.PI);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(2, 5, 2, 0, Math.PI);
                ctx.stroke();
            } else if (expr === 'unstable') {
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.arc(-w/4, -6, 2, 0, Math.PI*2);
                ctx.arc(w/4, -6, 2, 0, Math.PI*2);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(-4, 5); ctx.lineTo(4, 5);
                ctx.stroke();
            } else if (expr === 'dizzy') {
                ctx.beginPath();
                ctx.moveTo(-w/4 - 4, -9); ctx.lineTo(-w/4 + 4, -3);
                ctx.moveTo(-w/4 + 4, -9); ctx.lineTo(-w/4 - 4, -3);
                ctx.moveTo(w/4 - 4, -9); ctx.lineTo(w/4 + 4, -3);
                ctx.moveTo(w/4 + 4, -9); ctx.lineTo(w/4 - 4, -3);
                ctx.stroke();
            }
        }
    },
    {
        id: 'bear',
        name: '小熊',
        width: 96,
        height: 70,
        mass: 1.5,
        shape: 'rectangle',
        color: '#9c6543',
        draw: (ctx, w, h, expr) => {
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.beginPath();
            ctx.ellipse(0, h/2 - 4, w/2 - 6, 7, 0, 0, Math.PI*2);
            ctx.fill();

            // Bear ears
            ctx.fillStyle = '#9c6543';
            ctx.beginPath();
            ctx.arc(-w/3, -h/2 + 10, 12, 0, Math.PI*2);
            ctx.arc(w/3, -h/2 + 10, 12, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#e5b695';
            ctx.beginPath();
            ctx.arc(-w/3, -h/2 + 10, 6, 0, Math.PI*2);
            ctx.arc(w/3, -h/2 + 10, 6, 0, Math.PI*2);
            ctx.fill();

            // Boxy Body
            ctx.fillStyle = '#9c6543';
            ctx.beginPath();
            ctx.roundRect(-w/2, -h/2 + 8, w, h - 10, 12);
            ctx.fill();

            // Light muzzle snout
            ctx.fillStyle = '#e5b695';
            ctx.beginPath();
            ctx.ellipse(0, 6, 14, 10, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.ellipse(0, 3, 5, 3.5, 0, 0, Math.PI*2);
            ctx.fill();

            // Feet
            ctx.fillStyle = '#7a5035';
            ctx.fillRect(-w/3, h/2 - 6, 12, 8);
            ctx.fillRect(w/3 - 12, h/2 - 6, 12, 8);

            // Blush
            ctx.fillStyle = 'rgba(255, 138, 128, 0.4)';
            ctx.beginPath();
            ctx.arc(-w/4 - 6, 2, 5, 0, Math.PI*2);
            ctx.arc(w/4 + 6, 2, 5, 0, Math.PI*2);
            ctx.fill();

            // Eyes & expressions
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#2c3e50';
            ctx.lineCap = 'round';

            if (expr === 'falling') {
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.arc(-w/4, -4, 4, 0, Math.PI*2);
                ctx.arc(w/4, -4, 4, 0, Math.PI*2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 10, 3.5, 0, Math.PI*2);
                ctx.stroke();
            } else if (expr === 'landed' || expr === 'idle') {
                ctx.beginPath();
                ctx.arc(-w/4, -5, 4.5, Math.PI, 0);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(w/4, -5, 4.5, Math.PI, 0);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(-2, 7, 2, 0, Math.PI);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(2, 7, 2, 0, Math.PI);
                ctx.stroke();
            } else if (expr === 'unstable') {
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.arc(-w/4, -4, 3, 0, Math.PI*2);
                ctx.arc(w/4, -4, 3, 0, Math.PI*2);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(-3, 8); ctx.lineTo(3, 8);
                ctx.stroke();
            } else if (expr === 'dizzy') {
                ctx.beginPath();
                ctx.moveTo(-w/4 - 4, -8); ctx.lineTo(-w/4 + 4, -2);
                ctx.moveTo(-w/4 + 4, -8); ctx.lineTo(-w/4 - 4, -2);
                ctx.moveTo(w/4 - 4, -8); ctx.lineTo(w/4 + 4, -2);
                ctx.moveTo(w/4 + 4, -8); ctx.lineTo(w/4 - 4, -2);
                ctx.stroke();
            }
        }
    },
    {
        id: 'pig',
        name: '小豬',
        width: 96,
        height: 70,
        mass: 1.3,
        shape: 'rectangle',
        color: '#ffb6c1',
        draw: (ctx, w, h, expr) => {
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.beginPath();
            ctx.ellipse(0, h/2 - 4, w/2 - 6, 7, 0, 0, Math.PI*2);
            ctx.fill();

            // Flappy ears
            ctx.fillStyle = '#ff8da1';
            ctx.beginPath();
            ctx.moveTo(-w/2 + 6, -h/2 + 10);
            ctx.lineTo(-w/2 - 3, -h/2);
            ctx.lineTo(-w/2 + 20, -h/2 + 4);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(w/2 - 6, -h/2 + 10);
            ctx.lineTo(w/2 + 3, -h/2);
            ctx.lineTo(w/2 - 18, -h/2 + 4);
            ctx.closePath();
            ctx.fill();

            // Boxy Body
            ctx.fillStyle = '#ffb6c1';
            ctx.beginPath();
            ctx.roundRect(-w/2, -h/2 + 8, w, h - 10, 12);
            ctx.fill();

            // Snout snout
            ctx.fillStyle = '#ff8da1';
            ctx.beginPath();
            ctx.roundRect(-16, 2, 32, 20, 10);
            ctx.fill();
            ctx.fillStyle = '#831023';
            ctx.beginPath();
            ctx.arc(-6, 12, 3, 0, Math.PI*2);
            ctx.arc(6, 12, 3, 0, Math.PI*2);
            ctx.fill();

            // Feet
            ctx.fillStyle = '#ff8da1';
            ctx.fillRect(-w/3, h/2 - 6, 12, 8);
            ctx.fillRect(w/3 - 12, h/2 - 6, 12, 8);

            // Blush
            ctx.fillStyle = 'rgba(255, 105, 180, 0.4)';
            ctx.beginPath();
            ctx.arc(-w/4 - 6, 2, 5.5, 0, Math.PI*2);
            ctx.arc(w/4 + 6, 2, 5.5, 0, Math.PI*2);
            ctx.fill();

            // Eyes & expressions
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#2c3e50';
            ctx.lineCap = 'round';

            if (expr === 'falling') {
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.arc(-w/4, -4, 4, 0, Math.PI*2);
                ctx.arc(w/4, -4, 4, 0, Math.PI*2);
                ctx.fill();
            } else if (expr === 'landed' || expr === 'idle') {
                ctx.beginPath();
                ctx.arc(-w/4, -6, 4.5, 0, Math.PI, true);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(w/4, -6, 4.5, 0, Math.PI, true);
                ctx.stroke();
            } else if (expr === 'unstable') {
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.arc(-w/4, -4, 3, 0, Math.PI*2);
                ctx.arc(w/4, -4, 3, 0, Math.PI*2);
                ctx.fill();
            } else if (expr === 'dizzy') {
                ctx.beginPath();
                ctx.moveTo(-w/4 - 4, -9); ctx.lineTo(-w/4 + 4, -3);
                ctx.moveTo(-w/4 + 4, -9); ctx.lineTo(-w/4 - 4, -3);
                ctx.moveTo(w/4 - 4, -9); ctx.lineTo(w/4 + 4, -3);
                ctx.moveTo(w/4 + 4, -9); ctx.lineTo(w/4 - 4, -3);
                ctx.stroke();
            }
        }
    }
];

let animalBag = [];
function getNextAnimalFromBag() {
    if (animalBag.length === 0) {
        // Refill bag
        for (let i = 0; i < ANIMAL_TEMPLATES.length; i++) {
            animalBag.push(i);
        }
        // Shuffle bag (Fisher-Yates)
        for (let i = animalBag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [animalBag[i], animalBag[j]] = [animalBag[j], animalBag[i]];
        }
    }
    return animalBag.pop();
}

// ==========================================
// Game Engine Variables
// ==========================================
const { Engine, World, Bodies, Body, Composite, Events } = Matter;

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 800;

let canvas, ctx;
let previewCanvas, previewCtx;

let engine, world;
let gameLoopId = null;

// Game State: 'START', 'PLAYING', 'PAUSED', 'GAMEOVER'
let gameState = 'START';

// Score details
let score = 0; // stack height (meters)
let highscore = 0;
let stackedCount = 0;
let lives = 3;

// Spawner movement
let spawnerX = CANVAS_WIDTH / 2;
let spawnerDirection = 1;
let spawnerSpeed = 2.4;
let currentAnimalIndex = 0;
let nextAnimalIndex = 0;

// Camera
let cameraY = 0;
let targetCameraY = 0;

// Entities & Mechanics
let platform;
let activeAnimals = [];
let particles = [];
let screenShakeTime = 0;
let screenShakeIntensity = 0;

// Tower Wobble Globals
let towerWobbleAngle = 0;
let towerWobbleVelocity = 0;
let towerStaticLean = 0;

let isTransitioningToGameOver = false;

// Milestone overlay details
let milestoneText = "";
let milestoneTimer = 0;

// Controls cooldown
let lastDropTime = 0;
const DROP_COOLDOWN = 900; // ms

// Background Parallax Stars
let stars = [];
for(let i=0; i<60; i++) {
    stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * 8000 - 6000, // space height region
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.3
    });
}

// Clouds list
let clouds = [];
for(let i=0; i<10; i++) {
    clouds.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * 2000 - 1500, // cloud region
        speed: Math.random() * 0.3 + 0.1,
        width: Math.random() * 80 + 60,
        height: Math.random() * 30 + 15
    });
}

// ==========================================
// Initializations & Listeners
// ==========================================
window.addEventListener('load', () => {
    // Canvas setup
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    previewCanvas = document.getElementById('preview-canvas');
    previewCtx = previewCanvas.getContext('2d');

    // Load Highscore
    highscore = parseFloat(localStorage.getItem('animal_stack_highscore')) || 0;
    document.getElementById('start-highscore').innerText = highscore.toFixed(1);

    // Setup HUD UI
    updateHeartsUI();

    // Event listeners
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('resume-btn').addEventListener('click', togglePause);
    document.getElementById('restart-btn-pause').addEventListener('click', () => {
        togglePause();
        resetGame();
        startGame();
    });
    document.getElementById('restart-btn').addEventListener('click', () => {
        resetGame();
        startGame();
    });
    document.getElementById('home-btn').addEventListener('click', returnToHome);

    // Sound toggle listener
    const soundBtn = document.getElementById('sound-btn');
    soundBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        document.getElementById('sound-status').innerText = soundEnabled ? '開啟' : '關閉';
        initAudio();
        if (soundEnabled) {
            playBGM();
        } else {
            stopBGM();
        }
    });

    // Tap/Click to drop
    canvas.addEventListener('mousedown', handleDropInput);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleDropInput();
    });

    // Start BGM on first user interaction (safeguarded against browser autoplay blocking)
    const startBGMOnInteraction = () => {
        if (gameState === 'START' || gameState === 'PLAYING') {
            const playPromise = playBGM();
            if (playPromise) {
                playPromise.then(() => {
                    // Remove listeners only if BGM started successfully
                    window.removeEventListener('click', startBGMOnInteraction);
                    window.removeEventListener('touchstart', startBGMOnInteraction);
                }).catch(() => {
                    console.log("Autoplay block active; waiting for user gesture.");
                });
            }
        }
    };
    window.addEventListener('click', startBGMOnInteraction);
    window.addEventListener('touchstart', startBGMOnInteraction);

    // Render loop initial start screen graphics
    drawStartScreenBackground();

    // Try to play BGM immediately on load (in case browser allows autoplay)
    playBGM().then(() => {
        // If autoplay succeeded, remove the interaction listeners
        window.removeEventListener('click', startBGMOnInteraction);
        window.removeEventListener('touchstart', startBGMOnInteraction);
    }).catch(() => {
        console.log("BGM autoplay blocked on load; will play on first click.");
    });
});

// Start the game loop
function startGame() {
    initAudio();
    gameState = 'PLAYING';
    
    // Play BGM
    playBGM();
    
    // Hide screens
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('active');
    document.getElementById('hud').classList.remove('hidden');

    // Reset components
    resetGame();

    // Sound cheer
    playSound('cheer');

    // Run requestAnimationFrame loop
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoopId = requestAnimationFrame(update);
}

function resetGame() {
    // Setup Matter.js World
    if (engine) {
        World.clear(world);
        Engine.clear(engine);
    }

    engine = Engine.create({
        gravity: { y: 1.1 } // slightly fast drop
    });
    world = engine.world;

    // Platform Body (Ground Platform)
    // Wood log / grass base
    platform = Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 120, 280, 32, {
        isStatic: true,
        friction: 1.0,
        frictionStatic: 1.0
    });
    World.add(world, platform);

    // Lists
    activeAnimals = [];
    particles = [];
    score = 0;
    stackedCount = 0;
    lives = 3;
    cameraY = 0;
    targetCameraY = 0;
    lastDropTime = 0;
    isTransitioningToGameOver = false;

    // Reset tower wobble globals
    towerWobbleAngle = 0;
    towerWobbleVelocity = 0;
    towerStaticLean = 0;

    // UI resets
    document.getElementById('score-val').innerText = "0.0";
    document.getElementById('count-val').innerText = "0";
    updateHeartsUI();

    // Spawner indexes
    animalBag = []; // clear old bag
    currentAnimalIndex = getNextAnimalFromBag();
    nextAnimalIndex = getNextAnimalFromBag();
    updatePreviewCanvas();

    // Collision listener
    Events.on(engine, 'collisionStart', handleCollisions);
    Events.on(engine, 'collisionActive', handleCollisions);
}

// ==========================================
// Game Loop Update
// ==========================================
function update(timestamp) {
    if (gameState === 'PLAYING') {
        // Step Matter.js physics engine
        Engine.update(engine, 1000 / 60);

        // Auto-freeze landed animals when they settle
        activeAnimals.forEach(animal => {
            if (animal.hasLanded && !animal.isStatic) {
                // If velocity is low (settled), freeze the animal so it doesn't move or roll anymore
                if (animal.speed < 0.15 && Math.abs(animal.velocity.y) < 0.1) {
                    Body.setStatic(animal, true);
                }
            }
        });

        // Update visual wobble for the entire tower
        const k = 0.05; // Spring stiffness
        const damping = 0.94; // Spring damping factor
        const acceleration = -k * (towerWobbleAngle - towerStaticLean);
        towerWobbleVelocity += acceleration;
        towerWobbleVelocity *= damping;
        towerWobbleAngle += towerWobbleVelocity;

        // Update Spawner Floating position
        // The speed slightly increases as score goes higher to add a small challenge!
        const speedMultiplier = Math.min(1.5, 1 + (score * 0.01));
        spawnerX += spawnerSpeed * spawnerDirection * speedMultiplier;
        if (spawnerX > CANVAS_WIDTH - 50) {
            spawnerX = CANVAS_WIDTH - 50;
            spawnerDirection = -1;
        } else if (spawnerX < 50) {
            spawnerX = 50;
            spawnerDirection = 1;
        }

        // Clean out of bounds animals
        checkOutOfBounds();

        // Calculate Stack Height & Camera target
        calculateStackHeight();

        // Smooth camera follow (lerp)
        cameraY += (targetCameraY - cameraY) * 0.08;
        if (cameraY > 0) cameraY = 0; // clamp to bottom

        // Update particles
        updateParticles();

        // Screen Shake
        if (screenShakeTime > 0) {
            screenShakeTime -= 16.67; // approx 1 frame
        }

        // Render Canvas
        render();

        gameLoopId = requestAnimationFrame(update);
    }
}

// ==========================================
// Input / Spawning Logic
// ==========================================
function handleDropInput() {
    if (gameState !== 'PLAYING' || isTransitioningToGameOver) return;

    const now = Date.now();
    if (now - lastDropTime < DROP_COOLDOWN) return; // Prevent double taps during animation

    // Spawn Animal
    const template = ANIMAL_TEMPLATES[currentAnimalIndex];
    let animalBody;

    // Always use rectangle physics box to have flat bottom & top for stable stacking
    // Lock rotation (inertia: Infinity) so animals don't roll like balls and stay cute & upright!
    animalBody = Bodies.rectangle(spawnerX, 100 + cameraY, template.width, template.height, {
        restitution: 0,
        friction: 0.95,
        frictionStatic: 1.0,
        inertia: Infinity,
        density: 0.001 * template.mass
    });

    // Attach metadata
    animalBody.templateId = template.id;
    animalBody.gameState = 'falling'; // Custom property: 'falling', 'landed', 'unstable', 'dizzy'
    animalBody.hasLanded = false;
    animalBody.id = Date.now(); // unique id for animation phasing

    // Add to world & active lists
    World.add(world, animalBody);
    activeAnimals.push(animalBody);

    // Audio cue
    playSound('drop');

    // Update cooldown
    lastDropTime = now;

    // Swap animals
    currentAnimalIndex = nextAnimalIndex;
    nextAnimalIndex = getNextAnimalFromBag();
    updatePreviewCanvas();
}

// ==========================================
// Collisions & Land Trigger
// ==========================================
function handleCollisions(event) {
    const pairs = event.pairs;

    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // Check if one of them is an active animal
        handleAnimalLanding(bodyA, pair);
        handleAnimalLanding(bodyB, pair);
    }
}

function handleAnimalLanding(body, pair) {
    // If it's a dynamic animal that hasn't landed yet
    if (body && !body.isStatic && body.gameState === 'falling') {
        const otherBody = (pair.bodyA === body) ? pair.bodyB : pair.bodyA;
        
        // It must collide with the static platform OR any already landed animal in the stack!
        if (otherBody && (otherBody.isStatic || otherBody.hasLanded)) {
            // Calculate overlap and check if it exceeds one-third of the landing animal's width
            const activeTemplate = ANIMAL_TEMPLATES.find(t => t.id === body.templateId);
            const activeWidth = activeTemplate ? activeTemplate.width : 96;
            const otherWidth = otherBody.templateId ? 
                ANIMAL_TEMPLATES.find(t => t.id === otherBody.templateId).width : 280; // platform is 280

            const dx = Math.abs(body.position.x - otherBody.position.x);
            const overlap = Math.max(0, (activeWidth + otherWidth) / 2 - dx);

            // If the overlap is less than 1/3 of the landing animal's width, the entire tower collapses!
            if (overlap < activeWidth / 3) {
                // Collapse the entire tower!
                lives--;
                updateHeartsUI();
                playSound('fail');
                triggerScreenShake(600, 18);

                // Unfreeze and collapse all animals in the stack
                activeAnimals.forEach(a => {
                    Body.setStatic(a, false);
                    a.gameState = 'dizzy'; // Show dizzy expressions
                    a.ignoreLifeDeduction = true; // Prevent checkOutOfBounds from deducting lives again
                    a.collisionFilter.mask = 0; // Disable all collisions so they fall through the platform!
                    
                    // Give an outward push
                    const pushDir = (a.position.x > CANVAS_WIDTH / 2) ? 1 : -1;
                    Body.setVelocity(a, { x: pushDir * (Math.random() * 2 + 1), y: -2 });
                    Body.setAngularVelocity(a, (Math.random() - 0.5) * 0.1);
                });

                // Also make the landing animal fall down dizzy and fall through the platform
                body.gameState = 'dizzy';
                body.ignoreLifeDeduction = true;
                body.collisionFilter.mask = 0; // Disable collisions
                const pushDir = (body.position.x > otherBody.position.x) ? 1 : -1;
                Body.setVelocity(body, { x: pushDir * 3, y: -2 });

                // Check game over
                if (lives <= 0) {
                    isTransitioningToGameOver = true;
                    setTimeout(() => {
                        triggerGameOver();
                    }, 1800);
                }
            } else {
                // Safe landing!
                body.gameState = 'landed';
                body.hasLanded = true;
                body.landingOffset = body.position.x - otherBody.position.x; // Store signed landing offset for wobble animation!
                body.parentBody = otherBody; // Store parent body for hierarchical wobble propagation!
                body.wobbleAngle = 0;
                body.wobbleVelocity = 0;

                // Update tower static lean based on cumulative offset of all landed animals
                let totalOffset = 0;
                let landedCount = 0;
                activeAnimals.forEach(a => {
                    if (a.hasLanded) {
                        totalOffset += (a.landingOffset || 0);
                        landedCount++;
                    }
                });
                towerStaticLean = landedCount > 0 ? (totalOffset / landedCount) * 0.0008 : 0;

                // Kick the wobble of the entire tower if not perfectly aligned!
                const alignmentTolerance = 3.0; // pixels
                if (dx > alignmentTolerance) {
                    const kickDirection = Math.sign(body.landingOffset);
                    const kickIntensity = Math.min(0.08, dx * 0.0035); // proportional to offset
                    towerWobbleVelocity += kickDirection * kickIntensity;
                }

                stackedCount++;
                document.getElementById('count-val').innerText = stackedCount;

                playSound('land');

                // Calculate collision point for particles
                let collisionX = body.position.x;
                let collisionY = body.position.y;
                
                if (pair.supports && pair.supports.length > 0) {
                    collisionX = pair.supports[0].x;
                    collisionY = pair.supports[0].y;
                }

                // Spawn beautiful landing dust particles
                spawnLandParticles(collisionX, collisionY, body.templateId);
            }
        }
    }
}

// ==========================================
// Height calculation & Camera track
// ==========================================
function calculateStackHeight() {
    if (activeAnimals.length === 0) {
        score = 0;
        targetCameraY = 0;
        return;
    }

    // Find highest landed animal (which has the minimum Y position in Matter.js canvas space)
    let highestY = platform.position.y; // base platform level

    activeAnimals.forEach(animal => {
        if (animal.hasLanded && animal.position.y < highestY) {
            highestY = animal.position.y;
        }
    });

    // Score is difference between platform height and highest point scaled to "meters"
    const rawHeight = (platform.position.y - 16) - highestY;
    const computedScore = Math.max(0, rawHeight / 40); // 40px = 1 meter approx

    // Only allow score to increase
    if (computedScore > score) {
        // Milestone trigger
        const oldMilestone = Math.floor(score / 10);
        const newMilestone = Math.floor(computedScore / 10);
        if (newMilestone > oldMilestone && newMilestone > 0) {
            playSound('cheer');
            milestoneText = `🎉 高度突破 ${newMilestone * 10}m! 🎉`;
            milestoneTimer = 1800; // ms
        }

        score = computedScore;
        document.getElementById('score-val').innerText = score.toFixed(1);
    }

    // Target Camera Y coordinates
    // We want to keep the top of the stack centered around 65% from bottom of canvas
    const targetY = highestY - (CANVAS_HEIGHT * 0.55);
    targetCameraY = Math.min(0, targetY);
}

// ==========================================
// Out of Bounds & Lives Checks
// ==========================================
function checkOutOfBounds() {
    // If animals drop off-screen below camera view
    const limitY = cameraY + CANVAS_HEIGHT + 150;

    for (let i = activeAnimals.length - 1; i >= 0; i--) {
        const animal = activeAnimals[i];

        // Skip static (frozen) animals! They are allowed to scroll off the bottom of the screen.
        if (animal.isStatic) continue;

        if (animal.position.y > limitY) {
            if (animal.ignoreLifeDeduction) {
                // Clean up silently without deducting lives
                World.remove(world, animal);
                activeAnimals.splice(i, 1);
                continue;
            }

            // Deduct life
            lives--;
            updateHeartsUI();
            playSound('fail');

            // Trigger intense screen shake
            triggerScreenShake(300, 10);

            // Spawn sad landing splash
            spawnFailParticles(animal.position.x, limitY - 170);

            // Remove from Matter.js world and active list
            World.remove(world, animal);
            activeAnimals.splice(i, 1);

            // Game over check
            if (lives <= 0) {
                isTransitioningToGameOver = true;
                setTimeout(() => {
                    triggerGameOver();
                }, 1800);
            }
        }
    }
}

function triggerScreenShake(duration, intensity) {
    screenShakeTime = duration;
    screenShakeIntensity = intensity;
}

// ==========================================
// Game Over & State Management
// ==========================================
function triggerGameOver() {
    gameState = 'GAMEOVER';
    stopBGM();

    // Stop the collapse audio to prevent overlap with the game over sound!
    if (typeof collapseAudio !== 'undefined') {
        collapseAudio.pause();
        collapseAudio.currentTime = 0;
    }

    playSound('gameover');

    // Show Game Over overlay
    document.getElementById('final-score').innerText = score.toFixed(1) + " m";
    document.getElementById('final-count').innerText = stackedCount + " 隻";

    const recordBanner = document.getElementById('new-record-banner');
    
    // Compare rounded to 1 decimal place (matching what is displayed on screen)
    const displayScore = parseFloat(score.toFixed(1));
    const displayHighscore = parseFloat(highscore.toFixed(1));

    if (displayScore > displayHighscore) {
        highscore = score; // Update to exact score
        localStorage.setItem('animal_stack_highscore', highscore);
        recordBanner.classList.remove('hidden');
    } else {
        recordBanner.classList.add('hidden');
    }

    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('game-over-screen').classList.add('active');

    // Make remaining animals fall down/dizzy
    activeAnimals.forEach(animal => {
        animal.gameState = 'dizzy';
    });
}

function togglePause() {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        document.getElementById('pause-screen').classList.remove('hidden');
        document.getElementById('pause-screen').classList.add('active');
    } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('pause-screen').classList.remove('active');
        // Restart rendering frame loop
        gameLoopId = requestAnimationFrame(update);
    }
}

function returnToHome() {
    gameState = 'START';
    playBGM();
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');

    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('start-screen').classList.add('active');
    document.getElementById('start-highscore').innerText = highscore.toFixed(1);

    if (engine) {
        World.clear(world);
        Engine.clear(engine);
    }
    activeAnimals = [];
    particles = [];

    // Reset tower wobble globals
    towerWobbleAngle = 0;
    towerWobbleVelocity = 0;
    towerStaticLean = 0;
}

// ==========================================
// Rendering Elements (Parallax backgrounds, Clouds, etc.)
// ==========================================
function render() {
    ctx.save();

    // Apply Screen Shake if active
    if (screenShakeTime > 0) {
        const dx = (Math.random() - 0.5) * screenShakeIntensity;
        const dy = (Math.random() - 0.5) * screenShakeIntensity;
        ctx.translate(dx, dy);
    }

    // 1. Draw Parallax Background based on cameraY
    drawSkyParallaxBackground();

    // 2. Draw Platform
    drawPlatform();

    // 3. Draw Stacked Animals (with cumulative visual wobble / sway kinematics)
    // Sort from bottom to top so ancestors are calculated before their children
    const sortedAnimals = [...activeAnimals].sort((b1, b2) => b2.position.y - b1.position.y);
    
    sortedAnimals.forEach(animal => {
        const template = ANIMAL_TEMPLATES.find(t => t.id === animal.templateId);
        if (!template) return;

        const aHeight = template.height;
        let renderX = animal.position.x;
        let renderY = animal.position.y;
        let totalWobbleAngle = animal.angle || 0;

        if (animal.hasLanded) {
            const p = animal.parentBody;
            const parentIsAnimal = p && !p.isStatic && p.hasLanded && activeAnimals.includes(p);
            
            // The bottom-most animal gets 100% of the towerWobbleAngle.
            // Higher animals get a smaller relative wobble angle so they bend smoothly.
            const wAngle = parentIsAnimal ? towerWobbleAngle * 0.35 : towerWobbleAngle;

            if (!parentIsAnimal) {
                // Landed directly on the platform (base anchor)
                totalWobbleAngle = (animal.angle || 0) + wAngle;
                
                const rx = 0;
                const ry = -aHeight / 2;
                
                const rxPrime = rx * Math.cos(totalWobbleAngle) - ry * Math.sin(totalWobbleAngle);
                const ryPrime = rx * Math.sin(totalWobbleAngle) + ry * Math.cos(totalWobbleAngle);
                
                animal.totalWobbleAngle = totalWobbleAngle;
                animal.totalWobbleX = rxPrime - rx;
                animal.totalWobbleY = ryPrime - ry;
                
                renderX = animal.position.x + animal.totalWobbleX;
                renderY = animal.position.y + animal.totalWobbleY;
            } else {
                // Landed on another animal (p is already processed and has totalWobbleAngle / totalWobbleX / totalWobbleY)
                totalWobbleAngle = (p.totalWobbleAngle || p.angle || 0) + wAngle;
                
                const rx = animal.position.x - p.position.x;
                const ry = (animal.position.y + aHeight / 2) - p.position.y;
                
                const pAngle = p.totalWobbleAngle || p.angle || 0;
                const rxPrime = rx * Math.cos(pAngle) - ry * Math.sin(pAngle);
                const ryPrime = rx * Math.sin(pAngle) + ry * Math.cos(pAngle);
                
                const displacedPivotX = p.position.x + (p.totalWobbleX || 0) + rxPrime;
                const displacedPivotY = p.position.y + (p.totalWobbleY || 0) + ryPrime;
                
                const cxLocal = 0;
                const cyLocal = -aHeight / 2;
                
                const cxPrime = cxLocal * Math.cos(totalWobbleAngle) - cyLocal * Math.sin(totalWobbleAngle);
                const cyPrime = cxLocal * Math.sin(totalWobbleAngle) + cyLocal * Math.cos(totalWobbleAngle);
                
                renderX = displacedPivotX + cxPrime;
                renderY = displacedPivotY + cyPrime;
                
                animal.totalWobbleAngle = totalWobbleAngle;
                animal.totalWobbleX = renderX - animal.position.x;
                animal.totalWobbleY = renderY - animal.position.y;
            }
        } else {
            // Not landed yet (still falling)
            animal.totalWobbleAngle = animal.angle || 0;
            animal.totalWobbleX = 0;
            animal.totalWobbleY = 0;
        }

        // Check horizontal overlap expression
        let currentExpr = animal.gameState;
        if (currentExpr === 'landed') {
            const wAngle = Math.abs(towerWobbleAngle); // check global wobble for facial expressions
            if (wAngle > 0.05) {
                currentExpr = 'dizzy'; // dizzy if wobbling a lot
            } else if (wAngle > 0.015 || (!animal.isStatic && Math.abs(animal.velocity.x) > 0.05)) {
                currentExpr = 'unstable'; // worried/unstable if wobbling slightly
            }
        }

        ctx.save();
        ctx.translate(renderX, renderY - cameraY);
        ctx.rotate(totalWobbleAngle);
        template.draw(ctx, template.width, template.height, currentExpr);
        ctx.restore();
    });

    // 4. Draw Particles
    drawParticles();

    // 5. Draw Spawner (Floating cloud containing the current drop animal)
    drawSpawner();

    // 6. Draw Milestone Text Overlay
    if (milestoneTimer > 0) {
        ctx.save();
        ctx.fillStyle = '#ffbe0b';
        ctx.strokeStyle = '#4a3e3d';
        ctx.lineWidth = 5;
        ctx.font = 'bold 30px Fredoka';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 6;
        
        let alpha = 1;
        if (milestoneTimer < 400) alpha = milestoneTimer / 400;
        ctx.globalAlpha = alpha;
        
        const scale = 1 + Math.sin(milestoneTimer * 0.015) * 0.05;
        ctx.translate(CANVAS_WIDTH / 2, 280);
        ctx.scale(scale, scale);
        
        ctx.strokeText(milestoneText, 0, 0);
        ctx.fillText(milestoneText, 0, 0);
        ctx.restore();
        
        milestoneTimer -= 16.67;
    }

    ctx.restore();
}

function drawSkyParallaxBackground() {
    // Parallax background transitions from bottom ground to space
    // Let's create a gradient that scrolls along with cameraY
    const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);

    // Calculate background parameters
    // Ground level: light cyan/greenish
    // Sky level: soft sky blue
    // Cloud level: deeper orange/purple
    // Space: Dark space with stars
    const yTransition = Math.abs(cameraY) * 0.15; // smooth slow transition factor

    let colorTop, colorBottom;

    if (yTransition < 150) {
        // Sky Blue (Start)
        colorTop = '#8ecae6';
        colorBottom = '#a8dadc';
    } else if (yTransition < 400) {
        // Orange Sunset
        const ratio = (yTransition - 150) / 250;
        colorTop = blendColors('#8ecae6', '#f3a712', ratio);
        colorBottom = blendColors('#a8dadc', '#e76f51', ratio);
    } else if (yTransition < 900) {
        // Purple nightfall
        const ratio = (yTransition - 400) / 500;
        colorTop = blendColors('#f3a712', '#240046', ratio);
        colorBottom = blendColors('#e76f51', '#3c096c', ratio);
    } else {
        // Deep outer space
        colorTop = '#03001e';
        colorBottom = '#240046';
    }

    bgGradient.addColorStop(0, colorTop);
    bgGradient.addColorStop(1, colorBottom);

    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Parallax Clouds (only if we are below space, cameraY < 3000)
    if (Math.abs(cameraY) < 4000) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        clouds.forEach(cloud => {
            // Parallax movement: scroll slower than camera
            const renderY = cloud.y - (cameraY * 0.4);

            // Re-wrap cloud height so it repeats if scrolled past
            let wrapY = renderY;
            if (wrapY > CANVAS_HEIGHT) wrapY = -100;

            if (wrapY > -100 && wrapY < CANVAS_HEIGHT + 100) {
                // Move cloud horizontally
                cloud.x += cloud.speed;
                if (cloud.x > CANVAS_WIDTH + 80) cloud.x = -cloud.width;

                ctx.beginPath();
                ctx.roundRect(cloud.x, wrapY, cloud.width, cloud.height, cloud.height / 2);
                ctx.fill();
            }
        });
    }

    // Draw Stars (only if we are high up, cameraY > 800)
    if (Math.abs(cameraY) > 600) {
        const starAlpha = Math.min(1, (Math.abs(cameraY) - 600) / 1000);
        stars.forEach(star => {
            const renderY = star.y - (cameraY * 0.9); // stars scroll very slow (almost static)
            if (renderY > 0 && renderY < CANVAS_HEIGHT) {
                ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * starAlpha})`;
                ctx.beginPath();
                ctx.arc(star.x, renderY, star.size, 0, Math.PI*2);
                ctx.fill();
            }
        });
    }

    // Draw Ground grass elements (only at the absolute bottom)
    if (Math.abs(cameraY) < CANVAS_HEIGHT) {
        // Ground hills
        const renderGroundY = CANVAS_HEIGHT - cameraY;
        ctx.fillStyle = '#457b9d'; // Deep green-blue hill far
        ctx.beginPath();
        ctx.arc(100, renderGroundY + 120, 260, 0, Math.PI*2);
        ctx.arc(420, renderGroundY + 180, 240, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = '#2a9d8f'; // Medium hill
        ctx.beginPath();
        ctx.arc(-20, renderGroundY + 90, 180, 0, Math.PI*2);
        ctx.arc(CANVAS_WIDTH + 20, renderGroundY + 100, 180, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = '#264653'; // Foreground grass hill
        ctx.beginPath();
        ctx.ellipse(CANVAS_WIDTH/2, renderGroundY + 160, 360, 200, 0, 0, Math.PI*2);
        ctx.fill();
    }
}

function drawPlatform() {
    const renderY = platform.position.y - cameraY;
    if (renderY < -50 || renderY > CANVAS_HEIGHT + 50) return;

    // Platform shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.beginPath();
    ctx.ellipse(CANVAS_WIDTH/2, renderY + 24, 130, 10, 0, 0, Math.PI*2);
    ctx.fill();

    // Wood Log Plate
    ctx.fillStyle = '#c68a4c'; // light brown center
    ctx.strokeStyle = '#8d5b4c'; // dark brown bark outline
    ctx.lineWidth = 6;

    ctx.beginPath();
    ctx.roundRect(CANVAS_WIDTH/2 - 140, renderY - 16, 280, 32, 16);
    ctx.fill();
    ctx.stroke();

    // Tree rings details inside wood plate
    ctx.strokeStyle = '#d9a773';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(CANVAS_WIDTH/2 - 126, renderY - 8, 252, 16, 8);
    ctx.stroke();
}

function drawSpawner() {
    // Spawner floats horizontally carrying the current animal
    const spawnerY = 90; // fixed relative screen position

    // Spawner Cloud body
    ctx.save();
    ctx.translate(spawnerX, spawnerY);

    // Draw carrying string/rope
    ctx.strokeStyle = '#5a3c28';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 35);
    ctx.stroke();

    // Draw floating spawner shape (cute cloud)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(0, -10, 26, 0, Math.PI*2);
    ctx.arc(-28, -6, 20, 0, Math.PI*2);
    ctx.arc(28, -6, 20, 0, Math.PI*2);
    ctx.closePath();
    ctx.fill();
    
    // Cloud face
    ctx.fillStyle = '#457b9d';
    ctx.beginPath();
    ctx.arc(-8, -8, 2.5, 0, Math.PI*2);
    ctx.arc(8, -8, 2.5, 0, Math.PI*2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#457b9d';
    ctx.beginPath();
    ctx.arc(0, -5, 3.5, 0, Math.PI);
    ctx.stroke();

    // Draw current animal hanging under spawner (only if cooldown allows)
    const timeSinceLast = Date.now() - lastDropTime;
    const showHanging = timeSinceLast > DROP_COOLDOWN - 100;

    if (showHanging && gameState === 'PLAYING') {
        const template = ANIMAL_TEMPLATES[currentAnimalIndex];
        ctx.save();
        ctx.translate(0, 35 + template.height / 2);
        
        // Gentle sway breathing animation
        const breathingFactor = 1 + Math.sin(Date.now() * 0.0045) * 0.035;
        ctx.scale(breathingFactor, breathingFactor);

        template.draw(ctx, template.width, template.height, 'idle');
        ctx.restore();
    }

    ctx.restore();
}

// ==========================================
// HUD Next Animal Preview Canvas Draw
// ==========================================
function updatePreviewCanvas() {
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    const template = ANIMAL_TEMPLATES[nextAnimalIndex];

    previewCtx.save();
    previewCtx.translate(previewCanvas.width / 2, previewCanvas.height / 2);
    
    // Scale template to fit in a 55px box nicely
    const scale = Math.min(48 / template.width, 48 / template.height);
    previewCtx.scale(scale, scale);

    template.draw(previewCtx, template.width, template.height, 'idle');
    previewCtx.restore();
}

function updateHeartsUI() {
    const hearts = document.querySelectorAll('.heart');
    hearts.forEach((heart, idx) => {
        if (idx < lives) {
            heart.className = 'heart active';
        } else {
            heart.className = 'heart lost';
        }
    });
}

// Start screen background loop
function drawStartScreenBackground() {
    if (gameState !== 'START') return;

    // Draw standard static background details for start screen
    ctx.clearRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
    cameraY = 0;
    drawSkyParallaxBackground();

    // Wood log platform
    ctx.fillStyle = '#c68a4c';
    ctx.strokeStyle = '#8d5b4c';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(CANVAS_WIDTH/2 - 120, CANVAS_HEIGHT - 120, 240, 32, 16);
    ctx.fill();
    ctx.stroke();

    requestAnimationFrame(drawStartScreenBackground);
}

// Helper: blend two hex colors
function blendColors(c1, c2, r) {
    const r1 = parseInt(c1.substring(1,3), 16);
    const g1 = parseInt(c1.substring(3,5), 16);
    const b1 = parseInt(c1.substring(5,7), 16);

    const r2 = parseInt(c2.substring(1,3), 16);
    const g2 = parseInt(c2.substring(3,5), 16);
    const b2 = parseInt(c2.substring(5,7), 16);

    const rBlend = Math.round(r1 + (r2 - r1) * r);
    const gBlend = Math.round(g1 + (g2 - g1) * r);
    const bBlend = Math.round(b1 + (b2 - b1) * r);

    return "#" + ((1 << 24) + (rBlend << 16) + (gBlend << 8) + bBlend).toString(16).slice(1);
}

// ==========================================
// Particles & Effects System
// ==========================================
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius)
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y)
        rot += step

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y)
        rot += step
    }
    ctx.lineTo(cx, cy - outerRadius)
    ctx.closePath();
}

function spawnLandParticles(x, y, animalId) {
    // 1. Colorful sparkly star particles
    const count = 15;
    const colors = ['#ffd166', '#ff6b6b', '#4cc9f0', '#06d6a0', '#ff8da1', '#ffffff'];
    
    for (let i = 0; i < count; i++) {
        particles.push({
            type: 'star',
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: -Math.random() * 4 - 2,
            size: Math.random() * 6 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1.0,
            decay: Math.random() * 0.03 + 0.015,
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.1
        });
    }

    // 2. Expanding shockwave ring
    particles.push({
        type: 'ring',
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        size: 8, // starting radius
        maxSize: 60,
        color: 'rgba(255, 255, 255, 0.75)',
        life: 1.0,
        decay: 0.04
    });

    // 3. Floating text popups
    const words = ['OK!', 'Perfect!', 'Nice!', 'Great!', 'Cute!', 'Super!', 'Wow!'];
    const selectedWord = words[Math.floor(Math.random() * words.length)];
    particles.push({
        type: 'text',
        x: x,
        y: y - 15,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -1.8,
        text: selectedWord,
        color: '#ffbe0b',
        strokeColor: '#3d2625',
        fontSize: 22,
        life: 1.0,
        decay: 0.02
    });
}

function spawnFailParticles(x, y) {
    // Red/White pop stars when animal falls below camera Y limits
    const count = 15;
    for (let i = 0; i < count; i++) {
        particles.push({
            type: 'circle',
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6 - 2,
            size: Math.random() * 6 + 3,
            color: '#ff5964',
            life: 1.0,
            decay: Math.random() * 0.03 + 0.015
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.type === 'ring') {
            // Smoothly expand the shockwave ring
            p.size += (p.maxSize - p.size) * 0.12;
        } else if (p.type === 'star') {
            p.vy += 0.08; // Gravity for stars
            if (p.angle !== undefined && p.spin !== undefined) {
                p.angle += p.spin;
            }
        } else if (p.type === 'text') {
            // Just float up, no gravity
        } else {
            p.vy += 0.08; // Gravity for normal circles
        }

        p.life -= p.decay;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;

        if (p.type === 'ring') {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 3.5 * p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y - cameraY, p.size, 0, Math.PI * 2);
            ctx.stroke();
        } else if (p.type === 'text') {
            ctx.fillStyle = p.color;
            ctx.strokeStyle = p.strokeColor;
            ctx.lineWidth = 5;
            ctx.font = `bold ${p.fontSize}px Fredoka`;
            ctx.textAlign = 'center';
            ctx.strokeText(p.text, p.x, p.y - cameraY);
            ctx.fillText(p.text, p.x, p.y - cameraY);
        } else if (p.type === 'star') {
            ctx.fillStyle = p.color;
            ctx.translate(p.x, p.y - cameraY);
            ctx.rotate(p.angle || 0);
            drawStar(ctx, 0, 0, 5, p.size, p.size / 2);
            ctx.fill();
        } else {
            // Normal circle particle
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y - cameraY, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });
}
