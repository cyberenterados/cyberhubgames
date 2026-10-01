/* ════════════════════════════════════════════════════════════
   CRYPT-TRIS 1984 // ARCADE ENGINE v3.5 (PRO LEVEL)
   - Memoria fija de bajo nivel (Typed Arrays)
   - 10 Niveles Progresivos con Escenarios y Paletas Únicas
   - Bloques Biselados Arcade 3D + Ghost Piece + Hard Drop + Hold
   - Explosión de Partículas & Textos Arcade Flotantes
   - Chiptune FM Polifónico Nativo (Korobeiniki 80s)
   - Sincronización de Telemetría con MongoDB Atlas
   ════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ═══ CONFIGURACIÓN DE LOS 10 NIVELES / ESCENARIOS ARCADE ═══
    const SECTORS = [
        { level: 1,  name: 'SECTOR 01: GREEN PHOSPHOR', desc: '1978 VT100 Terminal Verde Fósforo', speed: 1000, primary: '#39FF14', secondary: '#00AA00', bg: '#030803' },
        { level: 2,  name: 'SECTOR 02: AMBER SILICON',   desc: '1981 IBM PC/XT Ámbar Industrial',   speed: 850,  primary: '#FFB000', secondary: '#B87800', bg: '#080501' },
        { level: 3,  name: 'SECTOR 03: CYBER SYNTHWAVE', desc: '1984 Miami Outrun Neón Cyan',       speed: 720,  primary: '#00F3FF', secondary: '#FF007F', bg: '#05030A' },
        { level: 4,  name: 'SECTOR 04: SOVIET MOSCOW',   desc: '1984 Alexey Pajitnov Red Star',     speed: 600,  primary: '#FF3333', secondary: '#FFD700', bg: '#080202' },
        { level: 5,  name: 'SECTOR 05: VECTOR TRON',     desc: '1982 Vector Lightcycle Grid',       speed: 500,  primary: '#0099FF', secondary: '#FF8800', bg: '#01050A' },
        { level: 6,  name: 'SECTOR 06: COMMODORE 64',    desc: '1985 C64 SID Chiptune Lab',         speed: 400,  primary: '#C033FF', secondary: '#33FFAA', bg: '#07020A' },
        { level: 7,  name: 'SECTOR 07: NORAD MILITARY',  desc: '1983 Guerra Fría Radar HUD',        speed: 320,  primary: '#88FF00', secondary: '#FFFF00', bg: '#040702' },
        { level: 8,  name: 'SECTOR 08: REACTOR MELTDOWN',desc: '1986 Búnker Nuclear en Alarma',     speed: 240,  primary: '#FFCC00', secondary: '#FF2200', bg: '#0A0601' },
        { level: 9,  name: 'SECTOR 09: QUANTUM HYPERSPACE', desc: '1989 Deep Space Warp Drive',     speed: 160,  primary: '#00FFFF', secondary: '#FFFFFF', bg: '#010608' },
        { level: 10, name: 'SECTOR 10: OVERCLOCK MASTER', desc: 'Grand Master Final Glitch Frame',  speed: 90,   primary: '#FFD700', secondary: '#FF0055', bg: '#0A0005' },
    ];

    // Colores de piezas arcade retro (7 tetrominós)
    const PIECE_COLORS = {
        1: { base: '#00F3FF', light: '#80F9FF', shadow: '#00858C' },
        2: { base: '#FFB000', light: '#FFD066', shadow: '#8C6100' },
        3: { base: '#0055FF', light: '#6699FF', shadow: '#002E8C' },
        4: { base: '#FFFF00', light: '#FFFF80', shadow: '#8C8C00' },
        5: { base: '#FF2020', light: '#FF7070', shadow: '#8C1111' },
        6: { base: '#39FF14', light: '#85FF70', shadow: '#1E8C0A' },
        7: { base: '#CC00FF', light: '#E570FF', shadow: '#70008C' },
    };

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const nextCanvas = document.getElementById('nextCanvas');
    const nextCtx = nextCanvas.getContext('2d');
    const holdCanvas = document.getElementById('holdCanvas');
    const holdCtx = holdCanvas.getContext('2d');

    const COLS = 10;
    const ROWS = 20;
    const BLOCK_SIZE = 30; // 300x600 px

    // ═══ ESTRUCTURAS DE MEMORIA BAJO NIVEL (TypedArray) ═══
    const arenaBuffer = new Uint8Array(COLS * ROWS);

    function getArena(x, y) {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return 1;
        return arenaBuffer[y * COLS + x];
    }

    function setArena(x, y, val) {
        if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
            arenaBuffer[y * COLS + x] = val;
        }
    }

    function clearArena() {
        arenaBuffer.fill(0);
    }

    // ═══ ESTADO DEL JUGADOR ═══
    const player = {
        pos: { x: 0, y: 0 },
        matrix: null,
        pieceId: 0,
        nextMatrix: null,
        nextPieceId: 0,
        holdMatrix: null,
        holdPieceId: 0,
        canHold: true,
        score: 0,
        level: 1,
        lines: 0,
        combo: 0,
        backToBack: false
    };

    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;
    let isPaused = true;
    let gameOver = false;
    let elapsedSeconds = 0;
    let particles = [];
    let highScore = Number(localStorage.getItem('tetris_high_score') || 0);

    // ═══ SINTETIZADOR CHIPTUNE 80s (Web Audio API) ═══
    let audioCtx = null;
    let soundEnabled = true;
    let bgmTimer = null;
    let bgmStep = 0;

    const BGM_NOTES = [
        659.25, 493.88, 523.25, 587.33, 523.25, 493.88, 440.00, 440.00, 523.25, 659.25, 587.33, 523.25, 493.88,
        523.25, 587.33, 659.25, 523.25, 440.00, 440.00, 0,
        587.33, 698.46, 880.00, 783.99, 698.46, 659.25, 523.25, 659.25, 587.33, 523.25, 493.88, 493.88, 523.25,
        587.33, 659.25, 523.25, 440.00, 440.00, 0
    ];
    const BGM_DURS = [
        0.4, 0.2, 0.2, 0.4, 0.2, 0.2, 0.4, 0.2, 0.2, 0.4, 0.2, 0.2, 0.6,
        0.2, 0.4, 0.4, 0.4, 0.4, 0.4, 0.2,
        0.4, 0.2, 0.4, 0.2, 0.2, 0.6, 0.2, 0.4, 0.2, 0.2, 0.4, 0.2, 0.2,
        0.4, 0.4, 0.4, 0.4, 0.4, 0.2
    ];

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
        move: () => playTone(350, 'square', 0.04, 0.04),
        rotate: () => playTone(580, 'triangle', 0.06, 0.06),
        softDrop: () => playTone(180, 'square', 0.03, 0.03),
        hardDrop: () => {
            playTone(120, 'sawtooth', 0.15, 0.12);
            playTone(80, 'square', 0.1, 0.15);
        },
        hold: () => playTone(700, 'triangle', 0.08, 0.08),
        clear: (lines) => {
            const freqs = [523, 659, 784, 1046];
            for (let i = 0; i < lines; i++) {
                setTimeout(() => playTone(freqs[i] || 1046, 'square', 0.15, 0.1), i * 60);
            }
        },
        levelUp: () => {
            [440, 554, 659, 880].forEach((f, i) => {
                setTimeout(() => playTone(f, 'square', 0.2, 0.12), i * 80);
            });
        },
        gameover: () => {
            playTone(180, 'sawtooth', 0.4, 0.15);
            setTimeout(() => playTone(90, 'sawtooth', 0.8, 0.2), 300);
        }
    };

    function playBgmStep() {
        if (!soundEnabled || isPaused || gameOver || !audioCtx) return;

        const note = BGM_NOTES[bgmStep];
        const dur = BGM_DURS[bgmStep];
        const speedMultiplier = 1 + (player.level - 1) * 0.07;
        const adjustedDur = dur / speedMultiplier;

        if (note > 0) {
            playTone(note, 'square', adjustedDur * 0.85, 0.025);
            playTone(note / 2, 'triangle', adjustedDur * 0.9, 0.03);
        }

        bgmStep = (bgmStep + 1) % BGM_NOTES.length;
        bgmTimer = setTimeout(playBgmStep, adjustedDur * 1000);
    }

    function startBgm() {
        stopBgm();
        if (soundEnabled && !isPaused && !gameOver) {
            bgmStep = 0;
            playBgmStep();
        }
    }

    function stopBgm() {
        if (bgmTimer) {
            clearTimeout(bgmTimer);
            bgmTimer = null;
        }
    }

    // ═══ DEFINICIÓN DE PIEZAS ═══
    function createPieceMatrix(type) {
        switch (type) {
            case 'I': return { id: 1, m: [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]] };
            case 'L': return { id: 2, m: [[0,2,0],[0,2,0],[0,2,2]] };
            case 'J': return { id: 3, m: [[0,3,0],[0,3,0],[3,3,0]] };
            case 'O': return { id: 4, m: [[4,4],[4,4]] };
            case 'Z': return { id: 5, m: [[5,5,0],[0,5,5],[0,0,0]] };
            case 'S': return { id: 6, m: [[0,6,6],[6,6,0],[0,0,0]] };
            case 'T': return { id: 7, m: [[0,7,0],[7,7,7],[0,0,0]] };
        }
    }

    let bag = [];
    function getNextPiece() {
        if (bag.length === 0) {
            bag = 'ILJOSZT'.split('').sort(() => Math.random() - 0.5);
        }
        return createPieceMatrix(bag.pop());
    }

    // ═══ RENDERIZADO ARCADE 3D BEVEL CON CANVAS ═══
    function drawBevelBlock(targetCtx, x, y, size, colorData, isGhost = false) {
        const px = x * size;
        const py = y * size;
        const b = size * 0.15;

        if (isGhost) {
            targetCtx.strokeStyle = colorData.base;
            targetCtx.lineWidth = 1;
            targetCtx.strokeRect(px + 1, py + 1, size - 2, size - 2);
            targetCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            targetCtx.fillRect(px + 2, py + 2, size - 4, size - 4);
            return;
        }

        targetCtx.fillStyle = colorData.base;
        targetCtx.fillRect(px, py, size, size);

        targetCtx.fillStyle = colorData.light;
        targetCtx.beginPath();
        targetCtx.moveTo(px, py);
        targetCtx.lineTo(px + size, py);
        targetCtx.lineTo(px + size - b, py + b);
        targetCtx.lineTo(px + b, py + b);
        targetCtx.lineTo(px + b, py + size - b);
        targetCtx.lineTo(px, py + size);
        targetCtx.closePath();
        targetCtx.fill();

        targetCtx.fillStyle = colorData.shadow;
        targetCtx.beginPath();
        targetCtx.moveTo(px + size, py);
        targetCtx.lineTo(px + size, py + size);
        targetCtx.lineTo(px, py + size);
        targetCtx.lineTo(px + b, py + size - b);
        targetCtx.lineTo(px + size - b, py + size - b);
        targetCtx.lineTo(px + size - b, py + b);
        targetCtx.closePath();
        targetCtx.fill();

        targetCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        targetCtx.fillRect(px + b + 2, py + b + 2, size - (b * 2) - 4, size - (b * 2) - 4);
    }

    // ═══ FÍSICA Y COLISIÓN ═══
    function collide(offsetX = 0, offsetY = 0, testMatrix = player.matrix) {
        const m = testMatrix;
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0) {
                    const ax = player.pos.x + x + offsetX;
                    const ay = player.pos.y + y + offsetY;
                    if (ax < 0 || ax >= COLS || ay >= ROWS || (ay >= 0 && getArena(ax, ay) !== 0)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function merge() {
        const m = player.matrix;
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0) {
                    setArena(player.pos.x + x, player.pos.y + y, player.pieceId);
                }
            }
        }
    }

    function getGhostY() {
        let ghostY = 0;
        while (!collide(0, ghostY + 1)) {
            ghostY++;
        }
        return player.pos.y + ghostY;
    }

    function rotate(matrix, dir = 1) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        if (dir > 0) matrix.forEach(row => row.reverse());
        else matrix.reverse();
    }

    function playerRotate() {
        if (isPaused || gameOver) return;
        const originalPos = player.pos.x;
        rotate(player.matrix);

        let offset = 1;
        while (collide(0, 0)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (Math.abs(offset) > player.matrix[0].length) {
                rotate(player.matrix, -1);
                player.pos.x = originalPos;
                return;
            }
        }
        sfx.rotate();
    }

    function playerMove(dir) {
        if (isPaused || gameOver) return;
        if (!collide(dir, 0)) {
            player.pos.x += dir;
            sfx.move();
        }
    }

    function playerDrop() {
        if (isPaused || gameOver) return;
        if (!collide(0, 1)) {
            player.pos.y++;
            player.score += 1;
        } else {
            lockPiece();
        }
        dropCounter = 0;
    }

    function playerHardDrop() {
        if (isPaused || gameOver) return;
        let droppedCells = 0;
        while (!collide(0, 1)) {
            player.pos.y++;
            droppedCells++;
        }
        player.score += droppedCells * 2;
        triggerScreenShake();
        createHardDropSparks();
        sfx.hardDrop();
        lockPiece();
    }

    function lockPiece() {
        merge();
        arenaSweep();
        playerReset();
        player.canHold = true;
    }

    function playerHold() {
        if (isPaused || gameOver || !player.canHold) return;

        sfx.hold();
        player.canHold = false;

        if (!player.holdMatrix) {
            player.holdMatrix = createPieceMatrix(getPieceLetter(player.pieceId)).m;
            player.holdPieceId = player.pieceId;
            playerReset();
        } else {
            const tempMatrix = player.holdMatrix;
            const tempId = player.holdPieceId;
            player.holdMatrix = createPieceMatrix(getPieceLetter(player.pieceId)).m;
            player.holdPieceId = player.pieceId;

            player.matrix = tempMatrix;
            player.pieceId = tempId;
            player.pos.y = 0;
            player.pos.x = (COLS / 2 | 0) - (player.matrix[0].length / 2 | 0);

            if (collide(0, 0)) triggerGameOver();
        }

        drawPreview(holdCanvas, holdCtx, player.holdMatrix, player.holdPieceId);
    }

    function getPieceLetter(id) {
        return ['I', 'L', 'J', 'O', 'Z', 'S', 'T'][id - 1] || 'I';
    }

    // ═══ LIMPIEZA DE LÍNEAS, COMBOS Y PUNTUACIÓN ═══
    function arenaSweep() {
        let linesCleared = 0;

        for (let y = ROWS - 1; y >= 0; --y) {
            let rowFull = true;
            for (let x = 0; x < COLS; ++x) {
                if (getArena(x, y) === 0) {
                    rowFull = false;
                    break;
                }
            }

            if (rowFull) {
                linesCleared++;
                createRowExplosion(y);

                for (let yy = y; yy > 0; --yy) {
                    for (let xx = 0; xx < COLS; ++xx) {
                        setArena(xx, yy, getArena(xx, yy - 1));
                    }
                }
                for (let xx = 0; xx < COLS; ++xx) {
                    setArena(xx, 0, 0);
                }
                y++;
            }
        }

        if (linesCleared > 0) {
            player.lines += linesCleared;

            const basePoints = [0, 100, 300, 500, 800][linesCleared] || 800;
            let earned = basePoints * player.level;

            if (linesCleared === 4) {
                if (player.backToBack) {
                    earned = Math.floor(earned * 1.5);
                    showFloatingText('BACK-TO-BACK TETRIS! +' + earned, '#FFD700');
                } else {
                    showFloatingText('TETRIS! +' + earned, '#39FF14');
                }
                player.backToBack = true;
            } else {
                player.backToBack = false;
                const textMsg = ['', 'SINGLE! +', 'DOUBLE! +', 'TRIPLE! +'][linesCleared] + earned;
                showFloatingText(textMsg, '#FFB000');
            }

            player.score += earned;
            sfx.clear(linesCleared);

            const newLevel = Math.min(10, Math.floor(player.lines / 10) + 1);
            if (newLevel !== player.level) {
                player.level = newLevel;
                sfx.levelUp();
                showFloatingText('LEVEL UP! ' + newLevel, '#39FF14');
                applySectorTheme(player.level);
            }

            updateTelemetry();
        }
    }

    // ═══ PARTÍCULAS Y EFECTOS ARCADE ═══
    function createRowExplosion(rowY) {
        const sector = SECTORS[player.level - 1];
        for (let x = 0; x < COLS; x++) {
            for (let i = 0; i < 4; i++) {
                particles.push({
                    x: x * BLOCK_SIZE + Math.random() * BLOCK_SIZE,
                    y: rowY * BLOCK_SIZE + Math.random() * BLOCK_SIZE,
                    vx: (Math.random() - 0.5) * 6,
                    vy: -Math.random() * 5 - 2,
                    color: Math.random() > 0.5 ? sector.primary : sector.secondary,
                    size: 3 + Math.random() * 3,
                    alpha: 1,
                    life: 0.03
                });
            }
        }
    }

    function createHardDropSparks() {
        const sector = SECTORS[player.level - 1];
        const px = player.pos.x * BLOCK_SIZE;
        const py = player.pos.y * BLOCK_SIZE;
        for (let i = 0; i < 15; i++) {
            particles.push({
                x: px + Math.random() * (player.matrix[0].length * BLOCK_SIZE),
                y: py + (player.matrix.length * BLOCK_SIZE),
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 4,
                color: sector.primary,
                size: 2 + Math.random() * 3,
                alpha: 1,
                life: 0.05
            });
        }
    }

    function updateAndDrawParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.alpha -= p.life;

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

    function showFloatingText(text, color) {
        const layer = document.getElementById('floatingLayer');
        if (!layer) return;
        const el = document.createElement('div');
        el.className = 'floating-text';
        el.textContent = text;
        el.style.left = '20px';
        el.style.top = '250px';
        el.style.color = color;
        layer.appendChild(el);
        setTimeout(() => el.remove(), 800);
    }

    function triggerScreenShake() {
        const frame = document.getElementById('screenFrame');
        if (!frame) return;
        frame.classList.add('shake');
        setTimeout(() => frame.classList.remove('shake'), 160);
    }

    // ═══ REINICIO DE PIEZA Y GAME OVER ═══
    function playerReset() {
        if (!player.nextMatrix) {
            const n = getNextPiece();
            player.nextMatrix = n.m;
            player.nextPieceId = n.id;
        }

        player.matrix = player.nextMatrix;
        player.pieceId = player.nextPieceId;

        const next = getNextPiece();
        player.nextMatrix = next.m;
        player.nextPieceId = next.id;

        player.pos.y = 0;
        player.pos.x = (COLS / 2 | 0) - (player.matrix[0].length / 2 | 0);

        drawPreview(nextCanvas, nextCtx, player.nextMatrix, player.nextPieceId);

        if (collide(0, 0)) {
            triggerGameOver();
        }
    }

    function drawPreview(targetCanvas, targetCtx, matrix, pieceId) {
        targetCtx.fillStyle = '#030302';
        targetCtx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
        if (!matrix) return;

        const pSize = 20;
        const ox = (targetCanvas.width - matrix[0].length * pSize) / 2;
        const oy = (targetCanvas.height - matrix.length * pSize) / 2;
        const colorData = PIECE_COLORS[pieceId] || PIECE_COLORS[1];

        matrix.forEach((row, y) => {
            row.forEach((val, x) => {
                if (val !== 0) {
                    drawBevelBlock(targetCtx, (ox / pSize) + x, (oy / pSize) + y, pSize, colorData);
                }
            });
        });
    }

    // ═══ GESTIÓN DE ESCENARIOS / SECTORES ═══
    function applySectorTheme(level) {
        const sector = SECTORS[Math.min(10, Math.max(1, level)) - 1];
        dropInterval = sector.speed;

        document.documentElement.style.setProperty('--accent-primary', sector.primary);
        document.documentElement.style.setProperty('--accent-secondary', sector.secondary);

        document.getElementById('sectorName').textContent = `SECTOR ${String(level).padStart(2, '0')}`;
        document.getElementById('sectorDesc').textContent = sector.desc;
        document.getElementById('sectorNameBadge').textContent = sector.name;

        const fillPercent = ((11 - level) / 10) * 100;
        document.getElementById('gravityGaugeFill').style.width = fillPercent + '%';
        document.getElementById('gravitySpeedText').textContent = `${sector.speed} ms / tick`;

        const dotsContainer = document.getElementById('sectorProgressDots');
        if (dotsContainer) {
            dotsContainer.innerHTML = '';
            for (let i = 1; i <= 10; i++) {
                const d = document.createElement('div');
                d.className = `sector-dot ${i === level ? 'active' : (i < level ? 'completed' : '')}`;
                dotsContainer.appendChild(d);
            }
        }
    }

    // ═══ DIBUJADO PRINCIPAL ═══
    function draw() {
        const sector = SECTORS[player.level - 1];

        ctx.fillStyle = sector.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(x * BLOCK_SIZE, 0);
            ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
            ctx.stroke();
        }
        for (let y = 0; y < ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * BLOCK_SIZE);
            ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
            ctx.stroke();
        }

        for (let y = 0; y < ROWS; ++y) {
            for (let x = 0; x < COLS; ++x) {
                const val = getArena(x, y);
                if (val !== 0) {
                    const c = PIECE_COLORS[val] || PIECE_COLORS[1];
                    drawBevelBlock(ctx, x, y, BLOCK_SIZE, c);
                }
            }
        }

        if (player.matrix && !isPaused && !gameOver) {
            const ghostY = getGhostY();
            const colorData = PIECE_COLORS[player.pieceId] || PIECE_COLORS[1];
            player.matrix.forEach((row, y) => {
                row.forEach((val, x) => {
                    if (val !== 0) {
                        drawBevelBlock(ctx, player.pos.x + x, ghostY + y, BLOCK_SIZE, colorData, true);
                    }
                });
            });
        }

        if (player.matrix && !isPaused && !gameOver) {
            const colorData = PIECE_COLORS[player.pieceId] || PIECE_COLORS[1];
            player.matrix.forEach((row, y) => {
                row.forEach((val, x) => {
                    if (val !== 0) {
                        drawBevelBlock(ctx, player.pos.x + x, player.pos.y + y, BLOCK_SIZE, colorData);
                    }
                });
            });
        }

        updateAndDrawParticles();
    }

    // ═══ MAIN LOOP CON DELTA TIME ═══
    function update(time = 0) {
        if (!isPaused && !gameOver) {
            const deltaTime = time - lastTime;
            lastTime = time;
            dropCounter += deltaTime;
            if (dropCounter > dropInterval) {
                playerDrop();
            }
        } else {
            lastTime = time;
        }

        draw();
        requestAnimationFrame(update);
    }

    // ═══ TELEMETRÍA Y CRONÓMETRO ═══
    function updateTelemetry() {
        document.getElementById('score').innerText = String(player.score).padStart(6, '0');
        document.getElementById('level').innerText = String(player.level).padStart(2, '0');
        document.getElementById('lines').innerText = String(player.lines).padStart(3, '0');

        if (player.score > highScore) {
            highScore = player.score;
            localStorage.setItem('tetris_high_score', highScore);
        }
        document.getElementById('highScore').innerText = String(highScore).padStart(6, '0');
    }

    setInterval(() => {
        if (!isPaused && !gameOver) {
            elapsedSeconds++;
            const m = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
            const s = String(elapsedSeconds % 60).padStart(2, '0');
            document.getElementById('time').innerText = `${m}:${s}`;
        }
    }, 1000);

    // ═══ SINCRONIZACIÓN CON MONGODB ATLAS ═══
    async function reportGameResult() {
        const token = localStorage.getItem('nexus_token');
        const syncBadge = document.getElementById('cloudSyncStatus');

        if (!token) {
            if (syncBadge) syncBadge.innerHTML = '<span class="dot amber">●</span> MODO INVITADO (LOCAL)';
            return;
        }

        try {
            if (syncBadge) syncBadge.innerHTML = '<span class="dot amber">●</span> ENVIANDO A MONGODB...';

            const payload = {
                gameId: 'crypt-tris',
                score: Number(player.score || 0),
                level: Number(player.level || 0),
                time_seconds: Number(elapsedSeconds || 0)
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
                if (syncBadge) syncBadge.innerHTML = '<span class="dot green">●</span> MONGO SYNC: RECORD GUARDADO';
            }
        } catch (e) {
            if (syncBadge) syncBadge.innerHTML = '<span class="dot red">●</span> MONGO OFFLINE';
        }
    }

    // ═══ GAME OVER Y PAUSA ═══
    const overlay = document.getElementById('gameOverlay');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlayText = document.getElementById('overlayText');
    const overlayStats = document.getElementById('overlayStatsPreview');
    const btnResume = document.getElementById('resumeBtn');
    const btnStart = document.getElementById('startBtn');

    function togglePause() {
        if (gameOver) return;
        initAudio();

        isPaused = !isPaused;
        if (isPaused) {
            stopBgm();
            overlay.classList.add('active');
            overlayTitle.innerText = 'SISTEMA EN PAUSA';
            overlayText.innerText = 'Operación detenida. Presiona reanudar o [P] para volver a la cabina.';
            overlayStats.style.display = 'none';
            btnStart.innerHTML = '<span>[ REANUDAR OPERACIÓN ]</span>';
            btnResume.innerHTML = '<span>[ REANUDAR ]</span>';
        } else {
            overlay.classList.remove('active');
            btnStart.innerHTML = '<span>[ PAUSAR OPERACIÓN ]</span>';
            lastTime = performance.now();
            startBgm();
        }
    }

    function triggerGameOver() {
        gameOver = true;
        isPaused = true;
        stopBgm();
        sfx.gameover();
        reportGameResult();

        overlay.classList.add('active');
        overlayTitle.innerText = 'GAME OVER';
        overlayText.innerText = 'El núcleo ha colapsado. Telemetría transmitida.';

        overlayStats.style.display = 'flex';
        document.getElementById('overScore').textContent = player.score;
        document.getElementById('overLevel').textContent = player.level;
        document.getElementById('overLines').textContent = player.lines;

        btnStart.innerHTML = '<span>[ NUEVA PARTIDA ]</span>';
        btnResume.innerHTML = '<span>[ JUGAR DE NUEVO ]</span>';
    }

    function resetGame() {
        clearArena();
        player.score = 0;
        player.level = 1;
        player.lines = 0;
        player.combo = 0;
        player.backToBack = false;
        player.holdMatrix = null;
        player.holdPieceId = 0;
        player.canHold = true;
        particles = [];
        elapsedSeconds = 0;
        document.getElementById('time').innerText = '00:00';

        gameOver = false;
        isPaused = false;

        applySectorTheme(1);
        playerReset();
        drawPreview(holdCanvas, holdCtx, null, 0);
        updateTelemetry();

        overlay.classList.remove('active');
        btnStart.innerHTML = '<span>[ PAUSAR OPERACIÓN ]</span>';
        lastTime = performance.now();
        startBgm();
    }

    // ═══ ENTRADA DE TECLADO Y TOUCH ═══
    window.addEventListener('keydown', (e) => {
        initAudio();

        // Iniciar con Enter o Espacio si está pausado o al inicio
        if (isPaused && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            if (gameOver) resetGame();
            else togglePause();
            return;
        }

        if (e.key === 'ArrowLeft') playerMove(-1);
        if (e.key === 'ArrowRight') playerMove(1);
        if (e.key === 'ArrowDown') playerDrop();
        if (e.key === 'ArrowUp') playerRotate();
        if (e.key === ' ') {
            e.preventDefault();
            playerHardDrop();
        }
        if (e.key.toLowerCase() === 'c' || e.key === 'Shift') playerHold();
        if (e.key.toLowerCase() === 'p') togglePause();
    });

    btnResume.addEventListener('click', (e) => {
        e.stopPropagation();
        initAudio();
        if (gameOver) resetGame();
        else togglePause();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            initAudio();
            if (gameOver) resetGame();
            else togglePause();
        }
    });

    btnStart.addEventListener('click', (e) => {
        e.stopPropagation();
        initAudio();
        if (gameOver) resetGame();
        else togglePause();
    });

    // Touch mobile
    document.getElementById('btn-left').addEventListener('click', () => { initAudio(); playerMove(-1); });
    document.getElementById('btn-right').addEventListener('click', () => { initAudio(); playerMove(1); });
    document.getElementById('btn-down').addEventListener('click', () => { initAudio(); playerDrop(); });
    document.getElementById('btn-rotate').addEventListener('click', () => { initAudio(); playerRotate(); });
    document.getElementById('btn-hard-drop').addEventListener('click', () => { initAudio(); playerHardDrop(); });
    document.getElementById('btn-hold').addEventListener('click', () => { initAudio(); playerHold(); });

    // Audio Toggle
    document.getElementById('btnAudioToggle').addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        document.getElementById('audioIcon').textContent = soundEnabled ? '🔊 AUDIO ON' : '🔇 AUDIO OFF';
        if (!soundEnabled) stopBgm();
        else if (!isPaused && !gameOver) startBgm();
    });

    // ═══ ARRANQUE EN FRÍO ═══
    applySectorTheme(1);
    updateTelemetry();
    playerReset();
    update();
})();