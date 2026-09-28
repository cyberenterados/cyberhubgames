const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Telemetría del Sistema
let score = 0;
let level = 1;
let isPaused = false;
let gameOver = false;
let wavePending = 10;
let frameCount = 0;

// Elementos del HUD
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const statusEl = document.getElementById('status-text');
const pauseOverlay = document.getElementById('pause-overlay');

// Infraestructura Terrestre (Nodos OWM)
let nodes = [];
const NODE_COUNT = 5;
const NODE_WIDTH = 40;
const NODE_HEIGHT = 20;

// Proyectiles y Contramedidas
let enemies = [];
let interceptors = [];
let explosions = [];

function initNodes() {
    nodes = [];
    let spacing = canvas.width / (NODE_COUNT + 1);
    for (let i = 1; i <= NODE_COUNT; i++) {
        nodes.push({
            x: spacing * i,
            y: canvas.height - 30,
            active: true
        });
    }
}

// Lógica de ataque enemigo (Ataques DDoS)
function spawnEnemy() {
    const activeNodes = nodes.filter(n => n.active);
    if (activeNodes.length === 0) return;

    let targetNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
    let startX = Math.random() * canvas.width;
    
    // Calcular trayectoria
    let angle = Math.atan2(targetNode.y - 0, targetNode.x - startX);
    let speed = 1 + (level * 0.3); // Aumenta dificultad

    enemies.push({
        x: startX, y: 0,
        originX: startX, originY: 0,
        targetX: targetNode.x, targetY: targetNode.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed
    });
}

// Lógica de defensa (Escudos de Red)
function fireInterceptor(targetX, targetY) {
    if (gameOver || isPaused) return;

    // Dispara desde el centro inferior (Base Principal)
    let startX = canvas.width / 2;
    let startY = canvas.height - 10;
    
    let angle = Math.atan2(targetY - startY, targetX - startX);
    let speed = 15; // Velocidad de subida ultra rápida

    interceptors.push({
        x: startX, y: startY,
        originX: startX, originY: startY,
        targetX: targetX, targetY: targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed
    });
}

// Sistemas de Control de Puntería (Ratón / Táctil)
function handleTargeting(e) {
    if (gameOver || isPaused) return;
    const rect = canvas.getBoundingClientRect();
    let clientX = e.clientX || (e.touches && e.touches[0].clientX);
    let clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    let clickX = clientX - rect.left;
    let clickY = clientY - rect.top;
    
    // Evitar disparar muy abajo para no gastar misiles en la base
    if (clickY < canvas.height - 50) {
        fireInterceptor(clickX, clickY);
    }
}

canvas.addEventListener('mousedown', handleTargeting);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleTargeting(e); });

// Pausa
function togglePause() {
    if (gameOver) return;
    isPaused = !isPaused;
    statusEl.innerText = isPaused ? "SUSPENDIDO" : "EN LÍNEA";
    statusEl.style.color = isPaused ? "yellow" : "#00FF00";
    pauseOverlay.classList.toggle('hidden');
    if (!isPaused) requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'Escape') togglePause();
});
document.getElementById('btn-pause').addEventListener('click', togglePause);

// Renderizado y Colisiones
function updateAndDraw() {
    // Efecto de rastro de fósforo (Trailing effect)
    ctx.fillStyle = 'rgba(5, 5, 5, 0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.shadowBlur = 5;

    // Dibujar Nodos OWM (Ciudades)
    ctx.shadowColor = '#00FF00';
    ctx.fillStyle = '#00FF00';
    let activeCount = 0;
    nodes.forEach(node => {
        if (node.active) {
            activeCount++;
            ctx.beginPath();
            ctx.rect(node.x - NODE_WIDTH/2, node.y, NODE_WIDTH, NODE_HEIGHT);
            ctx.fill();
        }
    });

    if (activeCount === 0 && !gameOver) {
        gameOver = true;
        statusEl.innerText = "RED COLAPSADA";
        statusEl.style.color = "red";
        document.getElementById('pause-overlay').querySelector('h1').innerText = "CLÚSTER DESTRUIDO";
        document.getElementById('pause-overlay').querySelector('p').innerText = "VECTORES DE ATAQUE HAN SUPERADO LA DEFENSA";
        pauseOverlay.classList.remove('hidden');
    }

    // Dibujar Base de Lanzamiento
    ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height, 30, Math.PI, 0);
    ctx.fill();

    // Actualizar y Dibujar Ataques (Enemigos) - Color Rojo Clandestino
    ctx.shadowColor = 'red';
    ctx.strokeStyle = 'red';
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.x += e.vx;
        e.y += e.vy;

        ctx.beginPath();
        ctx.moveTo(e.originX, e.originY);
        ctx.lineTo(e.x, e.y);
        ctx.stroke();

        ctx.fillStyle = 'red';
        ctx.fillRect(e.x - 2, e.y - 2, 4, 4);

        // Si el enemigo llega al suelo (impacto)
        if (e.y >= e.targetY) {
            // Destruir nodo
            nodes.forEach(n => {
                if (n.active && Math.abs(n.x - e.targetX) < 5 && Math.abs(n.y - e.targetY) < 5) {
                    n.active = false;
                }
            });
            // Generar explosión de daño
            explosions.push({ x: e.x, y: e.y, radius: 1, maxRadius: 40, expanding: true, type: 'damage' });
            enemies.splice(i, 1);
        }
    }

    // Actualizar y Dibujar Interceptores
    ctx.shadowColor = '#00FF00';
    ctx.strokeStyle = '#00FF00';
    for (let i = interceptors.length - 1; i >= 0; i--) {
        let int = interceptors[i];
        int.x += int.vx;
        int.y += int.vy;

        ctx.beginPath();
        ctx.moveTo(int.originX, int.originY);
        ctx.lineTo(int.x, int.y);
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.fillRect(int.x - 1, int.y - 1, 2, 2);

        // Distancia al objetivo
        let dist = Math.hypot(int.targetX - int.x, int.targetY - int.y);
        if (dist < 15) { // Detonar al llegar al objetivo
            explosions.push({ x: int.targetX, y: int.targetY, radius: 1, maxRadius: 50, expanding: true, type: 'shield' });
            interceptors.splice(i, 1);
        }
    }

    // Actualizar y Dibujar Explosiones (Escudos y Daños)
    for (let i = explosions.length - 1; i >= 0; i--) {
        let exp = explosions[i];
        
        ctx.shadowBlur = 15;
        if (exp.type === 'shield') {
            ctx.shadowColor = '#00FF00';
            ctx.fillStyle = 'rgba(0, 255, 0, 0.4)';
        } else {
            ctx.shadowColor = 'red';
            ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
        }

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.fill();

        if (exp.expanding) {
            exp.radius += 1.5;
            if (exp.radius >= exp.maxRadius) exp.expanding = false;
        } else {
            exp.radius -= 1;
            if (exp.radius <= 0) {
                explosions.splice(i, 1);
                continue;
            }
        }

        // Detección de colisión: Enemigo golpea Escudo (Explosión aliada)
        if (exp.type === 'shield') {
            for (let j = enemies.length - 1; j >= 0; j--) {
                let e = enemies[j];
                let dist = Math.hypot(e.x - exp.x, e.y - exp.y);
                if (dist < exp.radius) {
                    score += 100;
                    scoreEl.innerText = score.toString().padStart(4, '0');
                    // Explosión secundaria del enemigo destruido
                    explosions.push({ x: e.x, y: e.y, radius: 1, maxRadius: 20, expanding: true, type: 'shield' });
                    enemies.splice(j, 1);
                }
            }
        }
    }

    // Lógica de Oleadas (Niveles)
    if (enemies.length === 0 && wavePending <= 0 && explosions.length === 0 && !gameOver) {
        level++;
        levelEl.innerText = level.toString().padStart(2, '0');
        wavePending = 10 + (level * 5); // Más ataques cada oleada
    }

    // Spawner de ataques
    frameCount++;
    let spawnRate = Math.max(20, 100 - (level * 10)); // Más rápido cada nivel
    if (frameCount % spawnRate === 0 && wavePending > 0 && !gameOver) {
        spawnEnemy();
        wavePending--;
    }
}

function gameLoop() {
    if (isPaused || gameOver) return;
    updateAndDraw();
    requestAnimationFrame(gameLoop);
}

// Inicialización
initNodes();
requestAnimationFrame(gameLoop);