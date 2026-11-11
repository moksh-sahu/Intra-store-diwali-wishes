/**
 * INTRA STORE - Diwali Prank Website
 * Main JavaScript Module
 * Handles all screens, animations, interactions, and state management
 */

// ========================================
// GLOBAL STATE
// ========================================
const AppState = {
    currentScreen: 1,
    selectedEmployee: null,
    soundEnabled: true,
    particles: [],
    fireworks: [],
    diyas: [],
    animationFrames: {},
    loadingStep: 0,
    loadingProgress: 0
};

// ========================================
// DOM ELEMENTS CACHE
// ========================================
const DOM = {};

// ========================================
// AUDIO MANAGEMENT
// ========================================
const AudioManager = {
    sounds: {},
    musicPlaying: false,

    init() {
        this.sounds = {
            click: document.getElementById('sfx-click'),
            whoosh: document.getElementById('sfx-whoosh'),
            pop: document.getElementById('sfx-pop'),
            success: document.getElementById('sfx-success'),
            funny: document.getElementById('sfx-funny'),
            music: document.getElementById('bg-music')
        };

        // Set volumes
        this.sounds.click.volume = 0.3;
        this.sounds.whoosh.volume = 0.4;
        this.sounds.pop.volume = 0.5;
        this.sounds.success.volume = 0.4;
        this.sounds.funny.volume = 0.5;
        this.sounds.music.volume = 0.2;

        // Preload
        Object.values(this.sounds).forEach(sound => {
            if (sound) sound.load();
        });
    },

    play(soundName) {
        if (!AppState.soundEnabled) return;
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    },

    toggleMusic() {
        const music = this.sounds.music;
        if (!music) return;

        if (this.musicPlaying) {
            music.pause();
            this.musicPlaying = false;
        } else {
            music.play().catch(() => {});
            this.musicPlaying = true;
        }
        this.updateMusicUI();
    },

    updateMusicUI() {
        const iconOn = document.getElementById('sound-icon-on');
        const iconOff = document.getElementById('sound-icon-off');
        const label = document.getElementById('sound-label');

        if (iconOn && iconOff && label) {
            if (this.musicPlaying) {
                iconOn.classList.remove('hidden');
                iconOff.classList.add('hidden');
                label.textContent = 'Music: ON';
            } else {
                iconOn.classList.add('hidden');
                iconOff.classList.remove('hidden');
                label.textContent = 'Music: OFF';
            }
        }
    },

    startMusic() {
        if (AppState.soundEnabled && !this.musicPlaying) {
            this.sounds.music.play().catch(() => {});
            this.musicPlaying = true;
            this.updateMusicUI();
        }
    }
};

// ========================================
// FIREWORKS SYSTEM
// ========================================
class FireworksEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.fireworks = [];
        this.particles = [];
        this.animationId = null;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    createFirework(x, y, targetY, color) {
        const fw = {
            x,
            y: this.canvas.height,
            targetY,
            targetX: x,
            color,
            speed: 3 + Math.random() * 2,
            angle: Math.atan2(targetY - this.canvas.height, x - x),
            exploded: false,
            trail: []
        };
        this.fireworks.push(fw);
    }

    explode(firework) {
        const particleCount = 60 + Math.random() * 40;
        const colors = [
            firework.color,
            '#ffd700', '#ffaa00', '#ff6b6b', '#ff4757',
            '#ff6b9d', '#c44569', '#f8b500', '#fff'
        ];

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const speed = 1 + Math.random() * 4;
            this.particles.push({
                x: firework.x,
                y: firework.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 2 + Math.random() * 3,
                life: 1,
                decay: 0.01 + Math.random() * 0.02,
                gravity: 0.03 + Math.random() * 0.02
            });
        }
    }

    update() {
        // Update fireworks
        for (let i = this.fireworks.length - 1; i >= 0; i--) {
            const fw = this.fireworks[i];

            // Trail
            fw.trail.push({ x: fw.x, y: fw.y });
            if (fw.trail.length > 10) fw.trail.shift();

            if (!fw.exploded) {
                fw.y -= fw.speed;
                if (fw.y <= fw.targetY) {
                    fw.exploded = true;
                    this.explode(fw);
                    this.fireworks.splice(i, 1);
                }
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.life -= p.decay;
            p.size *= 0.98;
            if (p.life <= 0 || p.size < 0.5) {
                this.particles.splice(i, 1);
            }
        }

        // Random new fireworks
        if (Math.random() < 0.015) {
            const x = Math.random() * this.canvas.width;
            const targetY = 100 + Math.random() * (this.canvas.height * 0.4);
            const colors = ['#ffd700', '#ff6b6b', '#ff6b9d', '#c44569', '#f8b500', '#fff'];
            this.createFirework(x, this.canvas.height, targetY, colors[Math.floor(Math.random() * colors.length)]);
        }
    }

    draw() {
        if (!this.ctx) return;
        this.ctx.fillStyle = 'rgba(10, 4, 18, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw firework trails
        this.fireworks.forEach(fw => {
            this.ctx.beginPath();
            this.ctx.moveTo(fw.trail[0]?.x || fw.x, fw.trail[0]?.y || fw.y);
            fw.trail.forEach(point => {
                this.ctx.lineTo(point.x, point.y);
            });
            this.ctx.strokeStyle = fw.color;
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.6;
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        });

        // Draw particles
        this.particles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
    }

    animate() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    start() {
        if (!this.animationId) this.animate();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// ========================================
// FLOATING PARTICLES
// ========================================
function initFloatingParticles(containerId, count = 30) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = 4 + Math.random() * 12;
        const left = Math.random() * 100;
        const delay = Math.random() * 8;
        const duration = 6 + Math.random() * 6;

        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${left}%;
            bottom: -${size}px;
            animation: floatParticle ${duration}s infinite ease-in-out;
            animation-delay: ${delay}s;
            opacity: 0;
        `;
        container.appendChild(particle);
    }
}

// ========================================
// DIYAS
// ========================================
function initDiyas(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const diya = document.createElement('div');
        diya.className = 'diya';
        diya.style.animationDelay = `${-i * 1.3}s`;
        diya.innerHTML = `
            <div class="diya-base">
                <div class="diya-flame"></div>
                <div class="diya-glow"></div>
            </div>
        `;
        container.appendChild(diya);
    }
}

// ========================================
// CONFETTI SYSTEM
// ========================================
function createConfetti(containerId, count = 150) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const colors = ['#ffd700', '#ff6b6b', '#ff6b9d', '#c44569', '#f8b500', '#fff', '#ffaa00', '#ff4757'];
    const shapes = ['circle', 'square', 'triangle'];

    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 2 + Math.random() * 2;
        const size = 8 + Math.random() * 10;
        const rotation = Math.random() * 360;

        confetti.className = `confetti shape-${shape}`;
        confetti.style.cssText = `
            left: ${left}%;
            top: -${size}px;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            color: ${color};
            animation: confettiFall ${duration}s ease-in forwards;
            animation-delay: ${delay}s;
            transform: rotate(${rotation}deg);
            opacity: 0;
        `;
        container.appendChild(confetti);
    }

    // Clean up after animation
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// ========================================
// FUNNY STICKERS
// ========================================
function createFunnyStickers(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const stickers = ['😂', '🤣', '😱', '🙈', '🎉', '💀', '🤡', '😜', '🎭', '🪄'];
    const positions = [
        { top: '10%', left: '5%' }, { top: '15%', right: '8%' },
        { bottom: '20%', left: '3%' }, { bottom: '10%', right: '5%' },
        { top: '30%', left: '-2%' }, { top: '40%', right: '-2%' },
        { bottom: '30%', right: '-2%' }, { bottom: '40%', left: '-2%' }
    ];

    stickers.forEach((sticker, index) => {
        const el = document.createElement('div');
        el.className = 'sticker';
        el.textContent = sticker;
        el.style.fontSize = `${2.5 + Math.random() * 1.5}rem`;

        const pos = positions[index % positions.length];
        Object.assign(el.style, pos);

        el.style.animationDelay = `${index * 0.1}s`;
        container.appendChild(el);
    });
}

// ========================================
// SCREEN NAVIGATION
// ========================================
function showScreen(screenNumber) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Show target screen
    const targetScreen = document.getElementById(`screen${screenNumber}`);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    AppState.currentScreen = screenNumber;

    // Trigger screen-specific initialization
    initializeScreen(screenNumber);
}

function initializeScreen(screenNumber) {
    switch (screenNumber) {
        case 1:
            initScreen1();
            break;
        case 2:
            initScreen2();
            break;
        case 3:
            initScreen3();
            break;
        case 4:
            initScreen4();
            break;
        case 5:
            initScreen5();
            break;
        case 6:
            initScreen6();
            break;
        case 7:
            initScreen7();
            break;
    }
}

// ========================================
// SCREEN 1: WELCOME
// ========================================
function initScreen1() {
    // Start fireworks
    if (!AppState.animationFrames.fireworks1) {
        AppState.animationFrames.fireworks1 = new FireworksEngine('fireworks-canvas');
        AppState.animationFrames.fireworks1.start();
    }

    initFloatingParticles('particles-container', 40);
    initDiyas('diyas-container');

    // Add click handler for celebrate button
    const celebrateBtn = document.getElementById('btn-celebrate');
    if (celebrateBtn) {
        celebrateBtn.onclick = () => {
            AudioManager.play('click');
            AudioManager.play('whoosh');
            showScreen(2);
        };
    }
}

// ========================================
// SCREEN 2: EMPLOYEE SELECTION
// ========================================
function initScreen2() {
    if (!AppState.animationFrames.fireworks2) {
        AppState.animationFrames.fireworks2 = new FireworksEngine('fireworks-canvas-2');
        AppState.animationFrames.fireworks2.start();
    }

    initFloatingParticles('particles-container-2', 30);

    // Add click handlers to employee cards
    document.querySelectorAll('.employee-card').forEach(card => {
        card.onclick = () => selectEmployee(card.dataset.employee);
        // Touch support
        card.addEventListener('touchstart', () => {}, { passive: true });
    });
}

function selectEmployee(employeeName) {
    AudioManager.play('click');
    AppState.selectedEmployee = employeeName;

    // Visual feedback
    const card = document.querySelector(`.employee-card[data-employee="${employeeName}"]`);
    if (card) {
        card.style.transform = 'scale(0.95)';
        setTimeout(() => card.style.transform = '', 150);
    }

    // Navigate to screen 3 after brief delay
    setTimeout(() => {
        AudioManager.play('whoosh');
        showScreen(3);
    }, 300);
}

// ========================================
// SCREEN 3: PERSONALIZED GREETING
// ========================================
function initScreen3() {
    if (!AppState.animationFrames.fireworks3) {
        AppState.animationFrames.fireworks3 = new FireworksEngine('fireworks-canvas-3');
        AppState.animationFrames.fireworks3.start();
    }

    initFloatingParticles('particles-container-3', 35);
    initDiyas('diyas-container-3');

    // Update greeting with employee name
    const nameDisplay = document.getElementById('employee-name-display');
    if (nameDisplay && AppState.selectedEmployee) {
        nameDisplay.textContent = AppState.selectedEmployee;
    }

    // Gift box click handler
    const giftBox = document.getElementById('gift-box');
    const giftBtn = document.getElementById('btn-gift');

    const openGift = () => {
        AudioManager.play('pop');
        animateGiftBoxOpening();
        setTimeout(() => {
            AudioManager.play('whoosh');
            showScreen(4);
        }, 1200);
    };

    if (giftBox) giftBox.onclick = openGift;
    if (giftBtn) giftBtn.onclick = openGift;
}

function animateGiftBoxOpening() {
    const lid = document.querySelector('.gift-lid');
    const box = document.querySelector('.gift-box');
    const glow = document.querySelector('.gift-glow');

    if (lid) {
        lid.style.transform = 'rotateX(-120deg) translateY(-20px)';
        lid.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }

    if (box) {
        box.style.animation = 'giftBoxJump 0.6s ease-out';
    }

    if (glow) {
        glow.style.animation = 'giftGlowBurst 0.8s ease-out forwards';
    }

    // Add burst particles
    createConfetti('particles-container-3', 80);
}

// ========================================
// SCREEN 4: LOADING / SUSPENSE
// ========================================
function initScreen4() {
    if (!AppState.animationFrames.fireworks4) {
        AppState.animationFrames.fireworks4 = new FireworksEngine('fireworks-canvas-4');
        AppState.animationFrames.fireworks4.start();
    }

    initFloatingParticles('particles-container-4', 25);

    // Reset loading state
    AppState.loadingStep = 0;
    AppState.loadingProgress = 0;

    const steps = document.querySelectorAll('.loading-step');
    const progressBar = document.getElementById('overall-progress-bar');
    const progressPercent = document.getElementById('progress-percent');

    steps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        const bar = step.querySelector('.step-bar');
        if (bar) bar.style.width = '0%';
    });

    if (progressBar) progressBar.style.width = '0%';
    if (progressPercent) progressPercent.textContent = '0%';

    // Start loading sequence
    runLoadingSequence(steps, progressBar, progressPercent);
}

function runLoadingSequence(steps, progressBar, progressPercent) {
    const messages = [
        "Connecting to INTRA STORE server...",
        "Verifying employee identity...",
        "Checking your performance...",
        "Calculating your Diwali bonus...",
        "Contacting management...",
        "Your surprise is almost ready..."
    ];

    // Funny sound effects at specific steps
    const funnySteps = [2, 3, 4]; // performance check, bonus calc, contacting management

    function processStep(index) {
        if (index >= steps.length) {
            // All steps complete, move to prank screen
            setTimeout(() => {
                AudioManager.play('success');
                showScreen(5);
            }, 800);
            return;
        }

        const step = steps[index];
        const bar = step.querySelector('.step-bar');

        // Mark previous as completed
        if (index > 0) {
            steps[index - 1].classList.remove('active');
            steps[index - 1].classList.add('completed');
        }

        // Activate current
        step.classList.add('active');

        // Play sound for funny steps
        if (funnySteps.includes(index)) {
            setTimeout(() => AudioManager.play('funny'), 300);
        } else {
            setTimeout(() => AudioManager.play('click'), 100);
        }

        // Animate progress bar
        animateProgressBar(bar, 100, 800).then(() => {
            // Update overall progress
            const overallProgress = ((index + 1) / steps.length) * 100;
            animateProgressBar(progressBar, overallProgress, 500);
            if (progressPercent) {
                animateNumber(progressPercent, Math.round(overallProgress));
            }

            // Next step after delay
            const delay = index === 2 ? 1500 : (index === 3 ? 1800 : 1000); // Longer for performance/bonus
            setTimeout(() => processStep(index + 1), delay);
        });
    }

    // Start first step
    setTimeout(() => processStep(0), 500);
}

function animateProgressBar(bar, targetWidth, duration) {
    return new Promise(resolve => {
        if (!bar) { resolve(); return; }
        const startWidth = parseFloat(bar.style.width) || 0;
        const startTime = performance.now();

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(progress);
            const currentWidth = startWidth + (targetWidth - startWidth) * eased;
            bar.style.width = `${currentWidth}%`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        }

        requestAnimationFrame(animate);
    });
}

function animateNumber(element, target) {
    const start = parseInt(element.textContent) || 0;
    const duration = 500;
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);
        const current = Math.round(start + (target - start) * eased);
        element.textContent = `${current}%`;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

// ========================================
// SCREEN 5: PRANK REVEAL
// ========================================
function initScreen5() {
    if (!AppState.animationFrames.fireworks5) {
        AppState.animationFrames.fireworks5 = new FireworksEngine('fireworks-canvas-5');
        AppState.animationFrames.fireworks5.start();
    }

    initFloatingParticles('particles-container-5', 30);
    createConfetti('confetti-container-5', 200);
    createFunnyStickers('funny-stickers');

    // Set the correct prank image
    const prankImage = document.getElementById('prank-image');
    const imageMap = {
        'OM': 'assets/Om.png',
        'REHAN': 'assets/Rehan.png',
        'SHREY': 'assets/Shrey.png'
    };

    if (prankImage && AppState.selectedEmployee) {
        const imagePath = imageMap[AppState.selectedEmployee];
        prankImage.alt = `${AppState.selectedEmployee}'s Photo`;

        // Handle image loading
        prankImage.onload = () => {
            console.log(`Prank image loaded: ${imagePath}`);
        };
        prankImage.onerror = () => {
            console.error(`Failed to load prank image: ${imagePath}`);
            // Try absolute path as fallback
            prankImage.src = window.location.origin + '/' + imagePath;
        };

        prankImage.src = imagePath;
    }

    // Reveal button
    const revealBtn = document.getElementById('btn-reveal');
    if (revealBtn) {
        revealBtn.onclick = () => {
            AudioManager.play('pop');
            showScreen(6);
        };
    }

    // Play funny sound
    setTimeout(() => AudioManager.play('funny'), 500);
}

// ========================================
// SCREEN 6: GRAND REVEAL
// ========================================
function initScreen6() {
    if (!AppState.animationFrames.fireworks6) {
        AppState.animationFrames.fireworks6 = new FireworksEngine('fireworks-canvas-6');
        AppState.animationFrames.fireworks6.start();
    }

    initFloatingParticles('particles-container-6', 25);
    createConfetti('confetti-container-6', 300);

    // Personalized message
    const messageEl = document.getElementById('personalized-message');
    if (messageEl && AppState.selectedEmployee) {
        messageEl.innerHTML = `
            ${AppState.selectedEmployee}, YOUR DIWALI BONUS HAS BEEN CONVERTED INTO
            <br><strong>2 VIRTUAL LADDOOS! 🍬</strong>
        `;
    }

    // Continue button
    const nextBtn = document.getElementById('btn-next');
    if (nextBtn) {
        nextBtn.onclick = () => {
            AudioManager.play('click');
            showScreen(7);
        };
    }

    // Play laugh sound
    setTimeout(() => AudioManager.play('funny'), 300);
    setTimeout(() => AudioManager.play('success'), 800);
}

// ========================================
// SCREEN 7: FINAL CELEBRATION
// ========================================
function initScreen7() {
    if (!AppState.animationFrames.fireworks7) {
        AppState.animationFrames.fireworks7 = new FireworksEngine('fireworks-canvas-7');
        AppState.animationFrames.fireworks7.start();
    }

    initFloatingParticles('particles-container-7', 50);
    initDiyas('diyas-container-7');
    createConfetti('confetti-container-7', 400);

    // Start celebration music
    AudioManager.startMusic();

    // Sound toggle button
    const soundBtn = document.getElementById('sound-btn');
    if (soundBtn) {
        soundBtn.onclick = () => AudioManager.toggleMusic();
    }

    // Restart button
    const restartBtn = document.getElementById('btn-restart');
    if (restartBtn) {
        restartBtn.onclick = () => restartExperience();
    }
}

function restartExperience() {
    AudioManager.play('whoosh');
    AppState.selectedEmployee = null;

    // Stop music
    if (AudioManager.sounds.music) {
        AudioManager.sounds.music.pause();
        AudioManager.sounds.music.currentTime = 0;
        AudioManager.musicPlaying = false;
        AudioManager.updateMusicUI();
    }

    // Reset all screens - go to employee selection (Screen 2)
    showScreen(2);
}

// ========================================
// TRANSITION OVERLAY
// ========================================
function triggerTransition(callback) {
    const overlay = document.getElementById('transition-overlay');
    if (!overlay) { callback(); return; }

    overlay.classList.add('active');

    setTimeout(() => {
        callback();
        setTimeout(() => {
            overlay.classList.remove('active');
        }, 300);
    }, 300);
}

// ========================================
// INITIALIZATION
// ========================================
function init() {
    // Cache DOM elements
    cacheDOM();

    // Initialize audio
    AudioManager.init();

    // Initialize first screen
    initializeScreen(1);

    // Add keyboard navigation
    document.addEventListener('keydown', handleKeydown);

    // Prevent context menu on images
    document.addEventListener('contextmenu', e => {
        if (e.target.tagName === 'IMG') e.preventDefault();
    });

    console.log('🪔 INTRA STORE Diwali Prank Website Initialized!');
}

function cacheDOM() {
    // Pre-cache frequently used elements
    DOM.screens = document.querySelectorAll('.screen');
    DOM.employeeCards = document.querySelectorAll('.employee-card');
}

function handleKeydown(e) {
    // ESC to restart from any screen
    if (e.key === 'Escape' && AppState.currentScreen > 1) {
        restartExperience();
    }

    // Number keys for quick navigation (dev only)
    if (e.key >= '1' && e.key <= '7' && e.ctrlKey) {
        e.preventDefault();
        showScreen(parseInt(e.key));
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ========================================
// START APPLICATION
// ========================================
document.addEventListener('DOMContentLoaded', init);

// Handle page visibility for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause all animations
        Object.values(AppState.animationFrames).forEach(engine => {
            if (engine && engine.stop) engine.stop();
        });
        if (AudioManager.sounds.music) AudioManager.sounds.music.pause();
    } else {
        // Resume
        Object.values(AppState.animationFrames).forEach(engine => {
            if (engine && engine.start) engine.start();
        });
        if (AudioManager.musicPlaying && AudioManager.sounds.music) {
            AudioManager.sounds.music.play().catch(() => {});
        }
    }
});

// Export for debugging
window.IntraStoreDiwali = {
    state: AppState,
    audio: AudioManager,
    showScreen,
    restartExperience
};