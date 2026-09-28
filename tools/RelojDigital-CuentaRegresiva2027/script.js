function updateClock() {
    const now = new Date();
    
    // Obtener hora local y fecha
    const timeString = now.toLocaleTimeString('es-ES', { hour12: false });
    const dateString = now.toLocaleDateString('es-ES');

    document.getElementById('clock-time').innerText = timeString;
    document.getElementById('clock-date').innerText = dateString;

    // Detectar zona horaria (Ej: America/Buenos_Aires o America/Caracas)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.getElementById('location-tag').innerText = timezone;

    // Evento de easter egg para Maracaibo
    const eventBox = document.getElementById('local-events');
    const eventMsg = document.getElementById('event-message');
    
    if (timezone === 'America/Caracas') {
        eventBox.classList.remove('hidden');
        eventMsg.innerText = "🔥 [ZULIA NODO] Conexión establecida desde Maracaibo.";
    } else {
        eventBox.classList.add('hidden');
    }
}

function updateCountdown() {
    const now = new Date();
    
    // Detectamos en qué año estamos automáticamente
    let currentYear = now.getFullYear();
    let targetDate = new Date(`December 31, ${currentYear} 23:59:59`);

    // Si por casualidad ya es Año Nuevo (1 de enero), pasamos la meta al próximo año
    if (now > targetDate) {
        currentYear++;
        targetDate = new Date(`December 31, ${currentYear} 23:59:59`);
    }

    // Actualizamos el título del HTML para mostrar el año correcto
    document.getElementById('countdown-title').innerText = `CUENTA REGRESIVA // 31 DIC ${currentYear}`;

    const diff = targetDate - now;

    // Cálculo matemático del tiempo restante
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    // Renderizamos los números asegurando que siempre tengan dos dígitos (ej: 09h)
    document.getElementById('countdown-timer').innerText = 
        `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

// Lógica de los botones de personalización
function setTheme(themeClass) {
    document.body.className = themeClass;
}

document.getElementById('toggle-custom').addEventListener('click', () => {
    const panel = document.getElementById('custom-panel');
    panel.classList.toggle('hidden');
});

document.getElementById('toggle-effects').addEventListener('click', () => {
    const scanlines = document.querySelector('.scanlines');
    scanlines.style.display = scanlines.style.display === 'none' ? 'block' : 'none';
});

// Iniciamos todo de inmediato y actualizamos cada segundo
setInterval(updateClock, 1000);
setInterval(updateCountdown, 1000);
updateClock();
updateCountdown();