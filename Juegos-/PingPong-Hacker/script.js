// ---- CONFIGURACIÓN DEL SISTEMA ----
const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const timeDisplay = document.getElementById("time-display");
const playerScoreDisplay = document.getElementById("player-score");
const cpuScoreDisplay = document.getElementById("cpu-score");

// Forzar resolución nativa del Canvas interna fija para evitar deformación por escala CSS
canvas.width = 800;
canvas.height = 450;

// Variables de Control de Juego
let gameActive = false;
let startTime;
let timerInterval;
let playerScore = 0;
let cpuScore = 0;

// Propiedades de Entidades (Física Cuantizada)
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 8,
    speed: 5,
    velocityX: 5,
    velocityY: 5,
    maxSpeed: 12
};

const paddleWidth = 12;
const paddleHeight = 80;

const player = {
    x: 20,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    score: 0,
    dy: 0,
    speed: 8
};

const cpu = {
    x: canvas.width - 20 - paddleWidth,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    score: 0,
    speed: 4.5 // Nivel de dificultad calibrado
};

// ---- CONTROLES DE ENTRADA (KEYBOARD / MOUSE / TOUCH) ----
const keys = {};
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if ((e.key === "Enter" || e.key === " ") && !gameActive) startGame();
});
window.addEventListener("keyup", (e) => keys[e.key] = false);

// Soporte mandos táctiles móviles
document.getElementById("btn-up").addEventListener("touchstart", () => player.dy = -player.speed);
document.getElementById("btn-up").addEventListener("touchend", () => player.dy = 0);
document.getElementById("btn-down").addEventListener("touchstart", () => player.dy = player.speed);
document.getElementById("btn-down").addEventListener("touchend", () => player.dy = 0);

// Iniciar tocando el overlay
overlay.addEventListener("click", () => { if(!gameActive) startGame(); });

// ---- MECÁNICAS GLOBAL DEL JUEGO ----
function startGame() {
    gameActive = true;
    overlay.classList.add("hide");
    playerScore = 0;
    cpuScore = 0;
    updateScores();
    resetBall();
    
    startTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    
    requestAnimationFrame(gameLoop);
}

function updateTimer() {
    let elapsed = Math.floor((Date.now() - startTime) / 1000);
    let mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    let secs = (elapsed % 60).toString().padStart(2, '0');
    timeDisplay.textContent = `${mins}:${secs}`;
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = 5;
    // Inversión vector vector de dirección aleatorio
    ball.velocityX = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.velocityY = (Math.random() * 2 - 1) * ball.speed;
}

function updateScores() {
    playerScoreDisplay.textContent = playerScore.toString().padStart(2, '0');
    cpuScoreDisplay.textContent = cpuScore.toString().padStart(2, '0');
}

// Detección de colisiones precisas (AABB)
function collision(b, p) {
    return b.x - b.radius < p.x + p.width &&
           b.x + b.radius > p.x &&
           b.y - b.radius < p.y + p.height &&
           b.y + b.radius > p.y;
}

// ---- BUCLE DE ACTUALIZACIÓN Y FÍSICA ----
function update() {
    // Control Teclado Jugador
    if (keys["ArrowUp"] || keys["w"] || keys["W"]) player.y -= player.speed;
    if (keys["ArrowDown"] || keys["s"] || keys["S"]) player.y += player.speed;
    
    // Control táctil
    player.y += player.dy;

    // Limitar movimiento del jugador dentro de la matriz del canvas
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height - player.height) player.y = canvas.height - player.height;

    // IA ENEMIGA (Algoritmo de seguimiento con retraso cibernético simulado)
    let cpuTarget = ball.y - (cpu.height / 2);
    cpu.y += (cpuTarget - cpu.y) * 0.12; // Suavizado para dar oportunidad de ganarle
    if (cpu.y < 0) cpu.y = 0;
    if (cpu.y > canvas.height - cpu.height) cpu.y = canvas.height - cpu.height;

    // Movimiento del Núcleo (Bola)
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Colisión Techo / Piso
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.velocityY = -ball.velocityY;
        triggerGlitchEffect(); // Efecto sutil al rebotar
    }

    // Determinar qué paleta está bajo ataque
    let targetPaddle = (ball.x < canvas.width / 2) ? player : cpu;

    if (collision(ball, targetPaddle)) {
        // Calcular punto de impacto relativo para modificar ángulo de salida
        let collidePoint = ball.y - (targetPaddle.y + targetPaddle.height / 2);
        collidePoint = collidePoint / (targetPaddle.height / 2); // Normalizado entre -1 y 1
        
        let angleRad = (Math.PI / 4) * collidePoint; // Máximo 45 grados de desviación
        let direction = (ball.x < canvas.width / 2) ? 1 : -1;

        // Aumentar velocidad paulatinamente sin romper la barrera del sistema
        if (ball.speed < ball.maxSpeed) ball.speed += 0.5;

        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);
    }

    // Control de Pérdidas de Datos / Puntos
    if (ball.x - ball.radius < 0) {
        cpuScore++;
        updateScores();
        resetBall();
    } else if (ball.x + ball.radius > canvas.width) {
        playerScore++;
        updateScores();
        resetBall();
    }
}

// ---- MOTOR GRÁFICO (RENDER DE PÍXELES PUROS) ----
function draw() {
    // Borrado e inyección de fondo
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Red Central de Datos (Dashed Line)
    ctx.strokeStyle = "rgba(0, 255, 0, 0.2)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]); // Resetear patrón

    // Renderizado Paleta CMD_USER
    ctx.fillStyle = "#00ff00";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00ff00";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Renderizado Paleta CPU_CORE
    ctx.fillRect(cpu.x, cpu.y, cpu.width, cpu.height);

    // Renderizado Nodo Central (Bola Cuadrada estilo Terminal Clásica)
    ctx.fillRect(ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
    ctx.shadowBlur = 0; // Apagar sombras para optimizar rendimiento de cómputo
}

function gameLoop() {
    if (!gameActive) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Interrupción por Glitch estático controlado al fallar o impactar
function triggerGlitchEffect() {
    canvas.style.transform = `translate(${Math.random()*4-2}px, ${Math.random()*4-2}px)`;
    setTimeout(() => canvas.style.transform = "none", 50);
}