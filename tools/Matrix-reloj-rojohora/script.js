// --- MÓDULO 1: RELOJ Y FECHA ---
function updateClock() {
    const now = new Date();
    
    // Formateo de Hora
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clock-display').innerText = `${hours}:${minutes}:${seconds}`;

    // Formateo de Fecha
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('date-display').innerText = now.toLocaleDateString('es-ES', options).toUpperCase();
}

setInterval(updateClock, 1000);
updateClock();

// --- MÓDULO 2: TELEMETRÍA (UBICACIÓN Y CLIMA) ---
async function fetchTelemetry() {
    try {
        // Interceptando IP para ubicación (API gratuita)
        const ipResponse = await fetch('https://ipapi.co/json/');
        const locationData = await ipResponse.json();
        
        const city = locationData.city;
        const country = locationData.country_name;
        const lat = locationData.latitude;
        const lon = locationData.longitude;
        
        document.getElementById('location-data').innerText = `[ LOCALIZADO: ${city}, ${country} ]`;

        // Petición de clima basada en coordenadas (Open-Meteo, no requiere Key)
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const weatherData = await weatherResponse.json();
        const temp = weatherData.current_weather.temperature;
        
        document.getElementById('weather-data').innerText = `[ T° EXTERIOR: ${temp}°C ]`;

    } catch (error) {
        console.error("Falla de triangulación satelital:", error);
        document.getElementById('location-data').innerText = "[ MODO STEALTH: UBICACIÓN OCULTA ]";
        document.getElementById('weather-data').innerText = "[ CLIMA: ENCRIPTADO ]";
    }
}

fetchTelemetry();

// --- MÓDULO 3: CANVAS DINÁMICO (LLUVIA DE DATOS) ---
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Caracteres alfanuméricos para el flujo de información
const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*';
const charArray = chars.split('');
const fontSize = 16;
const columns = canvas.width / fontSize;
const drops = [];

for (let x = 0; x < columns; x++) {
    drops[x] = 1;
}

function drawMatrix() {
    // Rastro oscuro para generar el efecto de desvanecimiento
    ctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Color verde fósforo reglamentario
    ctx.fillStyle = '#00FF00';
    ctx.font = fontSize + 'px "Share Tech Mono", monospace';

    for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        // Reinicio aleatorio de la gota
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

setInterval(drawMatrix, 50);

// Mantener redimensionamiento dinámico
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});