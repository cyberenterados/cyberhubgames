// --- INICIALIZACIÓN A BAJO NIVEL ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

// Escala táctica (10x20 bloques lógicos)
ctx.scale(30, 30);
nextCtx.scale(30, 30);

// --- MÓDULO SINTETIZADOR AUDIO (API NATIVA) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, type, duration) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

const sfx = {
    move: () => playTone(300, 'square', 0.1),
    rotate: () => playTone(450, 'sawtooth', 0.1),
    drop: () => playTone(150, 'square', 0.15),
    clear: () => playTone(800, 'square', 0.2),
    gameover: () => playTone(100, 'sawtooth', 0.8)
};

// --- ESTRUCTURAS DE MEMORIA ---
const arena = createMatrix(10, 20);
const player = { pos: { x: 0, y: 0 }, matrix: null, nextMatrix: null, score: 0, level: 1, lines: 0 };

// Variables de Estado del Sistema
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isPaused = true;
let isGameOver = false;
let elapsedSeconds = 0;

function createMatrix(w, h) {
    const matrix = [];
    while (h--) matrix.push(new Array(w).fill(0));
    return matrix;
}

// Las piezas tienen distintos números (1-7) para variar la intensidad del fósforo verde
function createPiece(type) {
    switch (type) {
        case 'I': return [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]];
        case 'L': return [[0,2,0],[0,2,0],[0,2,2]];
        case 'J': return [[0,3,0],[0,3,0],[3,3,0]];
        case 'O': return [[4,4],[4,4]];
        case 'Z': return [[5,5,0],[0,5,5],[0,0,0]];
        case 'S': return [[0,6,6],[6,6,0],[0,0,0]];
        case 'T': return [[0,7,0],[7,7,7],[0,0,0]];
    }
}

function randomPiece() {
    const pieces = 'ILJOSZT';
    return createPiece(pieces[pieces.length * Math.random() | 0]);
}

// --- RENDERIZADO AL CRT ---
function drawBlock(context, x, y, colorIndex) {
    if (colorIndex === 0) return;
    // Variamos la opacidad del verde según la pieza para un efecto hacker puro
    context.fillStyle = `rgba(0, 255, 0, ${0.2 + (colorIndex * 0.1)})`;
    context.fillRect(x, y, 1, 1);
    context.lineWidth = 0.05;
    context.strokeStyle = '#00FF00';
    context.strokeRect(x, y, 1, 1);
}

function drawMatrix(matrix, offset, context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) drawBlock(context, x + offset.x, y + offset.y, value);
        });
    });
}

function draw() {
    // Limpiar pantallas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 10, 20);
    nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, 4, 4);

    // Dibujar Arena y Jugador
    drawMatrix(arena, {x: 0, y: 0}, ctx);
    if(player.matrix) drawMatrix(player.matrix, player.pos, ctx);
    
    // Dibujar Siguiente Pieza Centrada
    if(player.nextMatrix) {
        const offset = (4 - player.nextMatrix[0].length) / 2;
        drawMatrix(player.nextMatrix, {x: offset, y: offset}, nextCtx);
    }
}

// --- FÍSICA Y COLISIONES ---
function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) return true;
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value;
        });
    });
}

function arenaSweep() {
    let linesCleared = 0;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) continue outer;
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        linesCleared++;
    }
    if (linesCleared > 0) {
        sfx.clear();
        player.lines += linesCleared;
        player.score += [0, 100, 300, 500, 800][linesCleared] * player.level;
        player.level = Math.floor(player.lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (player.level * 100));
        updateTelemetry();
    }
}

// --- COMANDOS DEL COMANDANTE ---
function playerDrop() {
    if(isPaused) return;
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        sfx.drop();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    if(isPaused) return;
    player.pos.x += dir;
    if (collide(arena, player)) player.pos.x -= dir;
    else sfx.move();
}

function playerRotate() {
    if(isPaused) return;
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -1);
            player.pos.x = pos;
            return;
        }
    }
    sfx.rotate();
}

function rotate(matrix, dir = 1) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
    if (dir > 0) matrix.forEach(row => row.reverse());
    else matrix.reverse();
}

function playerReset() {
    if(!player.nextMatrix) player.nextMatrix = randomPiece();
    player.matrix = player.nextMatrix;
    player.nextMatrix = randomPiece();
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    
    if (collide(arena, player)) triggerGameOver();
}

// --- CRONÓMETRO Y TELEMETRÍA ---
function updateTelemetry() {
    document.getElementById('score').innerText = player.score;
    document.getElementById('level').innerText = player.level;
    document.getElementById('lines').innerText = player.lines;
}

async function reportGameResult() {
    const token = localStorage.getItem('nexus_token');
    if (!token) return;

    try {
        const payload = {
            gameId: 'tetris',
            score: Number(player.score || 0),
            level: Number(player.level || 0),
            time_seconds: Number(elapsedSeconds || 0)
        };

        const response = await fetch('http://localhost:5000/api/games/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.warn('No se pudo guardar la partida de Tetris');
        }
    } catch (error) {
        console.warn('Error reportando Tetris:', error);
    }
}

setInterval(() => {
    if (!isPaused && !isGameOver) {
        elapsedSeconds++;
        const m = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
        const s = String(elapsedSeconds % 60).padStart(2, '0');
        document.getElementById('time').innerText = `${m}:${s}`;
    }
}, 1000);

// --- MAIN LOOP (AL ESTILO AÑOS 80) ---
// El bucle JAMÁS se detiene. Si está pausado, simplemente no actualiza la física, pero redibuja el frame.
function update(time = 0) {
    if (!isPaused && !isGameOver) {
        const deltaTime = time - lastTime;
        lastTime = time;
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
    } else {
        lastTime = time; // Sincroniza el reloj interno para evitar saltos al reanudar
    }
    draw();
    requestAnimationFrame(update); // Bucle infinito
}

// --- GESTORES DE ESTADO DEL SISTEMA ---
const overlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const btnStart = document.getElementById('startBtn');
const btnResume = document.getElementById('resumeBtn');

function togglePause() {
    if(isGameOver) return;
    
    // Activar audio por si fue bloqueado por el navegador
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    isPaused = !isPaused;
    if (isPaused) {
        overlay.classList.add('active');
        overlayTitle.innerText = "SISTEMA EN PAUSA";
        overlayText.innerText = "Aguardando órdenes...";
        btnStart.innerText = "REANUDAR OPERACIÓN";
        btnResume.innerText = "REANUDAR";
    } else {
        overlay.classList.remove('active');
        btnStart.innerText = "PAUSAR OPERACIÓN";
        lastTime = performance.now(); // Reseteo del delta de tiempo
    }
}

function triggerGameOver() {
    isGameOver = true;
    isPaused = true;
    sfx.gameover();
    reportGameResult();
    overlay.classList.add('active');
    overlayTitle.innerText = "GAME OVER";
    overlayText.innerText = "El sistema ha colapsado.";
    btnStart.innerText = "REINICIAR SISTEMA";
    btnResume.innerText = "REINICIAR";
}

function resetSystem() {
    arena.forEach(row => row.fill(0));
    player.score = 0; player.level = 1; player.lines = 0;
    dropInterval = 1000;
    elapsedSeconds = 0;
    document.getElementById('time').innerText = "00:00";
    
    isGameOver = false;
    isPaused = false;
    
    playerReset();
    updateTelemetry();
    
    overlay.classList.remove('active');
    btnStart.innerText = "PAUSAR OPERACIÓN";
    lastTime = performance.now();
}

// --- ENRUTAMIENTO HARDWARE / TOUCH ---
document.addEventListener('keydown', event => {
    if(event.key === 'ArrowLeft') playerMove(-1);
    if(event.key === 'ArrowRight') playerMove(1);
    if(event.key === 'ArrowDown') playerDrop();
    if(event.key === 'ArrowUp' || event.key === ' ') playerRotate();
    if(event.key.toLowerCase() === 'p') togglePause();
});

btnStart.addEventListener('click', () => {
    if(isGameOver) resetSystem();
    else togglePause();
});

btnResume.addEventListener('click', () => {
    if(isGameOver) resetSystem();
    else togglePause();
});

// Móvil
document.getElementById('btn-left').addEventListener('touchstart', (e) => { e.preventDefault(); playerMove(-1); });
document.getElementById('btn-right').addEventListener('touchstart', (e) => { e.preventDefault(); playerMove(1); });
document.getElementById('btn-down').addEventListener('touchstart', (e) => { e.preventDefault(); playerDrop(); });
document.getElementById('btn-rotate').addEventListener('touchstart', (e) => { e.preventDefault(); playerRotate(); });

// --- ARRANQUE EN FRÍO ---
playerReset();
updateTelemetry();
update(); // Iniciar el bucle maestro