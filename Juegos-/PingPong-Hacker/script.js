/* ════════════════════════════════════════════════════════════
   TERMINAL_PONG // CYBER DUEL 1982 — TACTICAL ENGINE v2.5
   - Renderizado Poligonal Vectorial Puro (Neon Bloom 'lighter')
   - Control Híbrido: Ratón (MouseMove), Teclado (W/S, ↑/↓) y Touch
   - Inicio Instantáneo con Clic en Cualquier Lugar, Enter o Espacio
   - 10 Sectores de IA Progresivos con Comportamiento Predictivo
   - Turbo Smash con Onda de Choque y Curva Spin de Balística
   - Sintetizador Web Audio API: Sonidos Arcade de Atari Pong 1972/1982
   - Telemetría en Tiempo Real y Sincronización con MongoDB Atlas
   ════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ═══ CONFIGURACIÓN DE LOS 10 SECTORES / DIFICULTAD IA ═══
    const SECTORS = [
        { level: 1,  name: 'SECTOR 01: KERNEL PROTO',      cpuSpeed: 4.0, cpuError: 0.20, ballBase: 5.5, maxSpeed: 11, color: '#39FF14' },
        { level: 2,  name: 'SECTOR 02: SUBROUTINE AMBER',   cpuSpeed: 4.5, cpuError: 0.16, ballBase: 6.0, maxSpeed: 12, color: '#FFB000' },
        { level: 3,  name: 'SECTOR 03: CYBER SYNTHWAVE',    cpuSpeed: 5.0, cpuError: 0.13, ballBase: 6.5, maxSpeed: 13, color: '#00F3FF' },
        { level: 4,  name: 'SECTOR 04: WARGAMES DEFENSE',   cpuSpeed: 5.5, cpuError: 0.10, ballBase: 7.0, maxSpeed: 14, color: '#FF3333' },
        { level: 5,  name: 'SECTOR 05: VECTOR TRON',        cpuSpeed: 6.0, cpuError: 0.08, ballBase: 7.5, maxSpeed: 15, color: '#0088FF' },
        { level: 6,  name: 'SECTOR 06: NEURAL MATRIX',      cpuSpeed: 6.5, cpuError: 0.06, ballBase: 8.0, maxSpeed: 16, color: '#C033FF' },
        { level: 7,  name: 'SECTOR 07: QUANTUM PULSE',      cpuSpeed: 7.0, cpuError: 0.04, ballBase: 8.5, maxSpeed: 17, color: '#88FF00' },
        { level: 8,  name: 'SECTOR 08: FIREWALL HAZARD',    cpuSpeed: 7.5, cpuError: 0.03, ballBase: 9.0, maxSpeed: 18, color: '#FFCC00' },
        { level: 9,  name: 'SECTOR 09: HYPERCORE TACHYON',  cpuSpeed: 8.0, cpuError: 0.01, ballBase: 9.5, maxSpeed: 20, color: '#00FFFF' },
        { level: 10, name: 'SECTOR 10: OVERCLOCK TITAN',    cpuSpeed: 8.8, cpuError: 0.00, ballBase: 10.5, maxSpeed: 22, color: '#FFD700' },
    ];

    const canvas = document.getElementById('pongCanvas');
    const ctx = canvas.getContext('2d');
    const arenaFrame = document.getElementById('arenaFrame');
    const overlay = document.getElementById('overlay');
    const overlayHeading = document.getElementById('overlayHeading');
    const overlayDesc = document.getElementById('overlayDesc');
    const btnStart = document.getElementById('btnStartGame');
    const btnPause = document.getElementById('btn-pause');
    const btnSmash = document.getElementById('btn-smash');
    const timeDisplay = document.getElementById('time-display');
    const playerScoreDisplay = document.getElementById('player-score');
    const cpuScoreDisplay = document.getElementById('cpu-score');
    const sectorNameBadge = document.getElementById('sectorNameBadge');
    const cpuLabel = document.getElementById('cpuLabel');
    const syncStatus = document.getElementById('syncStatus');
    const smashMeterFill = document.getElementById('smashMeterFill');
    const smashStatusText = document.getElementById('smashStatusText');
    const floatingLayer = document.getElementById('floatingLayer');

    // Resolución interna ultra-nítida (16:9 ratio)
    canvas.width = 960;
    canvas.height = 540;

    // ═══ ESTADO DEL JUEGO ═══
    let gameActive = false;
    let isPaused = false;
    let gameOver = false;
    let elapsedSeconds = 0;
    let frameCount = 0;
    let currentLevel = 1;
    let playerScore = 0;
    let cpuScore = 0;
    let rallyCount = 0;
    let smashCharge = 100; // 0 - 100%
    let screenShakeTime = 0;

    // Entidades
    const PADDLE_W = 14;
    const PADDLE_H = 88;

    const player = {
        x: 30,
        y: canvas.height / 2 - PADDLE_H / 2,
        w: PADDLE_W,
        h: PADDLE_H,
        speed: 9,
        dy: 0,
        lastDy: 0
    };

    const cpu = {
        x: canvas.width - 30 - PADDLE_W,
        y: canvas.height / 2 - PADDLE_H / 2,
        w: PADDLE_W,
        h: PADDLE_H,
        dy: 0
    };

    const ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 8,
        speed: 5.5,
        vx: 5.5,
        vy: 2.5,
        isSmash: false,
        trail: []
    };

    let particles = [];

    // ═══ SINTETIZADOR WEB AUDIO CHIPTUNE 80s ═══
    let audioCtx = null;
    let soundEnabled = true;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playTone(freq, type, dur, vol = 0.08) {
        if (!soundEnabled || !audioCtx) return;
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const t = audioCtx.currentTime;
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(vol, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + dur);
        } catch (e) {}
    }

    const sfx = {
        paddleHit: (isPlayer) => {
            playTone(isPlayer ? 480 : 360, 'square', 0.08, 0.08);
        },
        wallHit: () => {
            playTone(220, 'square', 0.05, 0.05);
        },
        smashHit: () => {
            if (!soundEnabled || !audioCtx) return;
            const t = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(140, t + 0.25);
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + 0.28);
        },
        playerScored: () => {
            [523, 659, 784, 1046].forEach((f, i) => {
                setTimeout(() => playTone(f, 'square', 0.15, 0.1), i * 70);
            });
        },
        cpuScored: () => {
            playTone(200, 'sawtooth', 0.3, 0.12);
            setTimeout(() => playTone(120, 'sawtooth', 0.5, 0.15), 180);
        }
    };

    // ═══ INICIALIZACIÓN / INICIO DE PARTIDA ═══
    function startGame() {
        initAudio();
        gameActive = true;
        isPaused = false;
        gameOver = false;
        overlay.classList.add('hide');
        elapsedSeconds = 0;
        playerScore = 0;
        cpuScore = 0;
        currentLevel = 1;
        smashCharge = 100;
        updateScores();
        updateSmashHUD();
        applySector(1);
        resetBall(1);
    }

    function togglePause() {
        if (!gameActive || gameOver) return;
        initAudio();
        isPaused = !isPaused;
        if (isPaused) {
            overlay.classList.remove('hide');
            overlayHeading.textContent = 'DUELO EN PAUSA';
            overlayHeading.style.color = '#39FF14';
            overlayDesc.textContent = 'Combate balístico suspendido. Pulsa el botón o [P] para reanudar.';
            btnStart.innerHTML = '<span>[ REANUDAR COMBATE ]</span>';
        } else {
            overlay.classList.add('hide');
        }
    }

    // ═══ CONTROLES DE ENTRADA (TECLADO / MOUSE / TOUCH) ═══
    const keys = {};

    window.addEventListener('keydown', (e) => {
        initAudio();
        keys[e.key] = true;

        // Iniciar con Enter o Espacio si está detenido
        if (!gameActive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            startGame();
            return;
        }

        if (e.key === ' ' && gameActive && !isPaused) {
            e.preventDefault();
            triggerTurboSmash();
        }
        if (e.key.toLowerCase() === 'p' || e.key === 'Escape') {
            e.preventDefault();
            togglePause();
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    // Control por Ratón (Mueve la paleta suavemente con el cursor dentro del arena)
    arenaFrame.addEventListener('mousemove', (e) => {
        if (!gameActive || isPaused) return;
        const rect = canvas.getBoundingClientRect();
        const clientY = e.clientY - rect.top;
        const scaleY = canvas.height / rect.height;
        const targetY = (clientY * scaleY) - (player.h / 2);

        player.lastDy = targetY - player.y;
        player.y = targetY;

        if (player.y < 10) player.y = 10;
        if (player.y > canvas.height - player.h - 10) player.y = canvas.height - player.h - 10;
    });

    // Clic en el botón principal para iniciar
    btnStart.addEventListener('click', (e) => {
        e.stopPropagation();
        if (gameOver) startGame();
        else if (!gameActive) startGame();
        else togglePause();
    });

    // Clic en cualquier parte del overlay para iniciar de inmediato
    overlay.addEventListener('click', () => {
        if (!gameActive) startGame();
    });

    if (btnPause) btnPause.addEventListener('click', togglePause);

    btnSmash.addEventListener('click', () => {
        initAudio();
        triggerTurboSmash();
    });

    // Touch Mobile
    document.getElementById('btn-up').addEventListener('touchstart', (e) => {
        e.preventDefault();
        initAudio();
        player.dy = -player.speed;
    });
    document.getElementById('btn-up').addEventListener('touchend', () => player.dy = 0);

    document.getElementById('btn-down').addEventListener('touchstart', (e) => {
        e.preventDefault();
        initAudio();
        player.dy = player.speed;
    });
    document.getElementById('btn-down').addEventListener('touchend', () => player.dy = 0);

    // Toggle de Audio
    document.getElementById('btnAudioToggle').addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        document.getElementById('audioIcon').textContent = soundEnabled ? '🔊 AUDIO ON' : '🔇 AUDIO OFF';
    });

    // ═══ TURBO SMASH ═══
    function triggerTurboSmash() {
        if (smashCharge < 100 || !gameActive || isPaused) return;

        // Si la bola se aproxima a la mitad del jugador
        if (ball.vx < 0 && ball.x < canvas.width * 0.5) {
            smashCharge = 0;
            updateSmashHUD();
            ball.isSmash = true;
            ball.vx = Math.abs(ball.vx) * 1.8;
            ball.vy *= 1.2;
            triggerScreenShake(20);
            sfx.smashHit();
            createSmashParticles(ball.x, ball.y);
            showFloatingText('¡TURBO SMASH!', '#00F3FF', ball.x + 50, ball.y);
        } else {
            showFloatingText('¡ESPERA EL IMPACTO!', '#FFB000', player.x + 60, player.y);
        }
    }

    function updateSmashHUD() {
        smashMeterFill.style.width = smashCharge + '%';
        smashStatusText.textContent = smashCharge >= 100 ? '⚡ 100% CARGADO' : `${Math.floor(smashCharge)}% CARGANDO`;
        smashStatusText.className = smashCharge >= 100 ? 't-cyan' : 't-dim';
    }

    // ═══ FÍSICA Y COLISIONES BALÍSTICAS ═══
    function updatePhysics() {
        // 1. Control del Teclado Jugador (si no se usa mouse)
        if (keys['ArrowUp'] || keys['w'] || keys['W']) {
            player.y -= player.speed;
            player.lastDy = -player.speed;
        }
        if (keys['ArrowDown'] || keys['s'] || keys['S']) {
            player.y += player.speed;
            player.lastDy = player.speed;
        }
        if (player.dy !== 0) {
            player.y += player.dy;
            player.lastDy = player.dy;
        }

        // Límites de la paleta
        if (player.y < 10) player.y = 10;
        if (player.y > canvas.height - player.h - 10) player.y = canvas.height - player.h - 10;

        // 2. IA del Enemigo (Calibrada según el Sector Actual)
        const sector = SECTORS[currentLevel - 1];
        let cpuTarget = ball.y - (cpu.h / 2);

        // Error humano simulado en niveles bajos
        if (sector.cpuError > 0 && Math.sin(frameCount * 0.05) > 0.4) {
            cpuTarget += (Math.random() - 0.5) * 45;
        }

        const cpuDiff = cpuTarget - cpu.y;
        cpu.y += Math.sign(cpuDiff) * Math.min(Math.abs(cpuDiff), sector.cpuSpeed);

        if (cpu.y < 10) cpu.y = 10;
        if (cpu.y > canvas.height - cpu.h - 10) cpu.y = canvas.height - cpu.h - 10;

        // 3. Movimiento de la Bola
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Estela
        ball.trail.push({ x: ball.x, y: ball.y, isSmash: ball.isSmash });
        if (ball.trail.length > (ball.isSmash ? 16 : 8)) ball.trail.shift();

        // Rebotes en Techo y Suelo
        if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.vy = Math.abs(ball.vy);
            sfx.wallHit();
            createWallSpark(ball.x, ball.y);
        } else if (ball.y + ball.radius >= canvas.height) {
            ball.y = canvas.height - ball.radius;
            ball.vy = -Math.abs(ball.vy);
            sfx.wallHit();
            createWallSpark(ball.x, ball.y);
        }

        // 4. Colisión con Paleta del Jugador
        if (ball.vx < 0 &&
            ball.x - ball.radius <= player.x + player.w &&
            ball.x + ball.radius >= player.x &&
            ball.y >= player.y &&
            ball.y <= player.y + player.h) {

            rallyCount++;
            smashCharge = Math.min(100, smashCharge + 15);
            updateSmashHUD();

            let relativeIntersectY = (ball.y - (player.y + player.h / 2)) / (player.h / 2);
            let bounceAngle = relativeIntersectY * (Math.PI / 3);

            // Spin / Efecto de curva con el movimiento de la paleta
            ball.vy += player.lastDy * 0.3;

            const sectorSpeed = sector.ballBase + Math.min(sector.maxSpeed - sector.ballBase, rallyCount * 0.4);
            ball.speed = Math.min(sector.maxSpeed, sectorSpeed);

            ball.vx = ball.speed * Math.cos(bounceAngle);
            ball.vy = ball.speed * Math.sin(bounceAngle);

            ball.isSmash = false;
            sfx.paddleHit(true);
            createPaddleSparks(player.x + player.w, ball.y, '#39FF14');
        }

        // 5. Colisión con Paleta de la CPU
        if (ball.vx > 0 &&
            ball.x + ball.radius >= cpu.x &&
            ball.x - ball.radius <= cpu.x + cpu.w &&
            ball.y >= cpu.y &&
            ball.y <= cpu.y + cpu.h) {

            rallyCount++;
            let relativeIntersectY = (ball.y - (cpu.y + cpu.h / 2)) / (cpu.h / 2);
            let bounceAngle = relativeIntersectY * (Math.PI / 3);

            const sectorSpeed = sector.ballBase + Math.min(sector.maxSpeed - sector.ballBase, rallyCount * 0.4);
            ball.speed = Math.min(sector.maxSpeed, sectorSpeed);

            ball.vx = -ball.speed * Math.cos(bounceAngle);
            ball.vy = ball.speed * Math.sin(bounceAngle);

            ball.isSmash = false;
            sfx.paddleHit(false);
            createPaddleSparks(cpu.x, ball.y, sector.color);
        }

        // 6. Tantos / Goles
        if (ball.x + ball.radius < 0) {
            cpuScore++;
            sfx.cpuScored();
            triggerScreenShake(12);
            showFloatingText('¡BRECHA EN EL FIREWALL!', '#FF2222', canvas.width / 4, canvas.height / 2);
            updateScores();
            checkMatchProgress();
            resetBall(1);
        } else if (ball.x - ball.radius > canvas.width) {
            playerScore++;
            sfx.playerScored();
            triggerScreenShake(8);
            showFloatingText('¡NÚCLEO PENETRADO! +100', '#39FF14', (canvas.width * 3) / 4, canvas.height / 2);
            updateScores();
            checkMatchProgress();
            resetBall(-1);
        }
    }

    // ═══ PROGRESIÓN DE NIVELES ═══
    function checkMatchProgress() {
        if (playerScore >= 5) {
            if (currentLevel < 10) {
                currentLevel++;
                playerScore = 0;
                cpuScore = 0;
                updateScores();
                applySector(currentLevel);
                showFloatingText(`¡SECTOR ${currentLevel} DESBLOQUEADO!`, '#00F3FF', canvas.width / 2, canvas.height / 2);
            } else {
                triggerGameOver(true);
            }
        } else if (cpuScore >= 5) {
            triggerGameOver(false);
        }
    }

    function applySector(level) {
        const sector = SECTORS[level - 1];
        sectorNameBadge.textContent = sector.name;
        cpuLabel.textContent = `IA CORE (NV. ${level})`;
        document.documentElement.style.setProperty('--neon-amber', sector.color);
    }

    function resetBall(direction = 1) {
        const sector = SECTORS[currentLevel - 1];
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        ball.speed = sector.ballBase;
        ball.vx = direction * ball.speed;
        ball.vy = (Math.random() * 2 - 1) * 3;
        ball.isSmash = false;
        ball.trail = [];
        rallyCount = 0;
    }

    // ═══ MOTOR GRÁFICO POLIGONAL VECTORIAL ═══
    function draw() {
        const sector = SECTORS[currentLevel - 1];

        // 1. Fondo CRT con estela de desvanecimiento
        ctx.fillStyle = 'rgba(2, 5, 2, 0.28)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Red Central Láser Pulsante
        ctx.save();
        ctx.strokeStyle = `rgba(57, 255, 20, ${0.15 + Math.sin(frameCount * 0.05) * 0.08})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([14, 10]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.restore();

        // 3. Renderizado Vectorial con Bloom ('lighter')
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Estela de la Bola
        for (let i = 0; i < ball.trail.length; i++) {
            const pt = ball.trail[i];
            const alpha = (i / ball.trail.length) * 0.6;
            ctx.fillStyle = pt.isSmash ? `rgba(0, 243, 255, ${alpha})` : `rgba(57, 255, 20, ${alpha})`;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, ball.radius * (0.4 + (i / ball.trail.length) * 0.6), 0, Math.PI * 2);
            ctx.fill();
        }

        // Bola Cuántica Poligonal (Diamante de Luz)
        ctx.fillStyle = ball.isSmash ? '#00F3FF' : '#FFFFFF';
        ctx.strokeStyle = ball.isSmash ? '#FFFFFF' : '#39FF14';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y - ball.radius - 2);
        ctx.lineTo(ball.x + ball.radius + 2, ball.y);
        ctx.lineTo(ball.x, ball.y + ball.radius + 2);
        ctx.lineTo(ball.x - ball.radius - 2, ball.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Paleta del Jugador (Polígono Neón Verde)
        drawBeveledPaddle(player.x, player.y, player.w, player.h, '#39FF14', '#00FF66');

        // Paleta de la CPU (Polígono Neón del Sector)
        drawBeveledPaddle(cpu.x, cpu.y, cpu.w, cpu.h, sector.color, '#FFFFFF');

        // Partículas
        updateAndDrawParticles();

        ctx.restore();
    }

    function drawBeveledPaddle(x, y, w, h, primaryColor, lightColor) {
        ctx.fillStyle = primaryColor;
        ctx.fillRect(x, y, w, h);

        ctx.fillStyle = lightColor;
        ctx.fillRect(x + 2, y + 2, w - 4, h * 0.3);

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
    }

    // ═══ PARTÍCULAS Y SCREEN SHAKE ═══
    function createPaddleSparks(x, y, color) {
        for (let i = 0; i < 12; i++) {
            const angle = (Math.random() - 0.5) * Math.PI;
            const speed = 2 + Math.random() * 5;
            particles.push({
                x, y,
                vx: (ball.vx > 0 ? 1 : -1) * Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                size: 2 + Math.random() * 2,
                alpha: 1,
                decay: 0.04
            });
        }
    }

    function createSmashParticles(x, y) {
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 7;
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#00F3FF',
                size: 3 + Math.random() * 3,
                alpha: 1,
                decay: 0.03
            });
        }
    }

    function createWallSpark(x, y) {
        for (let i = 0; i < 6; i++) {
            particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 4,
                vy: (ball.vy > 0 ? -1 : 1) * Math.random() * 3,
                color: '#39FF14',
                size: 2,
                alpha: 1,
                decay: 0.05
            });
        }
    }

    function updateAndDrawParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                particles.splice(i, 1);
                continue;
            }

            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            ctx.globalAlpha = 1;
        }
    }

    function triggerScreenShake(intensity = 15) {
        screenShakeTime = intensity;
        arenaFrame.classList.add('shake');
        setTimeout(() => arenaFrame.classList.remove('shake'), 180);
    }

    function showFloatingText(text, color, x, y) {
        const el = document.createElement('div');
        el.className = 'floating-alert';
        el.textContent = text;
        el.style.left = `${(x / canvas.width) * 100}%`;
        el.style.top = `${(y / canvas.height) * 100}%`;
        el.style.color = color;
        floatingLayer.appendChild(el);
        setTimeout(() => el.remove(), 850);
    }

    // ═══ HUD & TIMERS ═══
    function updateScores() {
        playerScoreDisplay.textContent = String(playerScore).padStart(2, '0');
        cpuScoreDisplay.textContent = String(cpuScore).padStart(2, '0');
    }

    setInterval(() => {
        if (gameActive && !isPaused && !gameOver) {
            elapsedSeconds++;
            const m = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
            const s = String(elapsedSeconds % 60).padStart(2, '0');
            timeDisplay.textContent = `${m}:${s}`;

            smashCharge = Math.min(100, smashCharge + 2);
            updateSmashHUD();
        }
    }, 1000);

    // ═══ GAME OVER & REPORTE MONGODB ATLAS ═══
    function triggerGameOver(playerWon) {
        gameOver = true;
        gameActive = false;
        overlay.classList.remove('hide');

        overlayHeading.textContent = playerWon ? '¡VICTORIA ABSOLUTA!' : 'SISTEMA DOMINADO';
        overlayHeading.style.color = playerWon ? '#39FF14' : '#FF2222';
        overlayDesc.innerHTML = playerWon ?
            `Has derrotado al Mainframe IA en el Sector Final.<br>PUNTUACIÓN TOTAL: <strong>${(playerScore * 100 * currentLevel) + 1000}</strong>` :
            `El Núcleo IA ha superado tu defensa en el Sector ${currentLevel}.<br>PUNTUACIÓN: <strong>${playerScore * 100}</strong>`;

        btnStart.innerHTML = '<span>[ 🔄 REINICIAR COMBATE ]</span>';
        reportGameResult(playerWon);
    }

    async function reportGameResult(playerWon) {
        const token = localStorage.getItem('nexus_token');
        if (!token) {
            syncStatus.innerHTML = '<span class="t-dim">MODO LOCAL (INVITADO)</span>';
            return;
        }

        try {
            syncStatus.innerHTML = '<span class="t-amber">GUARDANDO EN MONGODB...</span>';
            const payload = {
                gameId: 'terminal-pong',
                score: (playerScore * 100 * currentLevel) + (playerWon ? 1000 : 0),
                level: Number(currentLevel),
                time_seconds: Number(elapsedSeconds)
            };

            const apiBase = window.CYBERHUB_API_URL ||
                localStorage.getItem('nexus_api_url') ||
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:5000/api'
                    : 'https://cyberhubgamesback.onrender.com/api');

            const res = await fetch(`${apiBase}/games/report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                syncStatus.innerHTML = '<span class="t-green">MONGO SYNC: RECORD GUARDADO</span>';
            }
        } catch (e) {
            syncStatus.innerHTML = '<span class="t-dim">OFFLINE / RETRY LATER</span>';
        }
    }

    // ═══ MAIN LOOP ═══
    function gameLoop() {
        frameCount++;
        if (gameActive && !isPaused && !gameOver) {
            updatePhysics();
        }
        draw();
        requestAnimationFrame(gameLoop);
    }

    // ═══ ARRANQUE ═══
    applySector(1);
    updateScores();
    updateSmashHUD();
    requestAnimationFrame(gameLoop);

})();