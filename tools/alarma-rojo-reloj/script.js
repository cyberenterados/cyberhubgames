/* =========================================================
   RELOJ DESPERTADOR DIGITAL
   - Hora / fecha / segundos en tiempo real (hora del dispositivo)
   - País y zona horaria del usuario (Intl + IP geolocation)
   - Clima aproximado (Open-Meteo, sin API key)
   - Formato 12h/24h, mensajes especiales por fecha, alarma simple
   ========================================================= */

(() => {
  'use strict';

  // ---------- Referencias al DOM ----------
  const el = {
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
    meridiem: document.getElementById('meridiem'),
    dateRow: document.getElementById('date-row'),
    locationText: document.getElementById('location-text'),
    statusText: document.getElementById('status-text'),
    timezoneText: document.getElementById('timezone-text'),
    footerTz: document.getElementById('footer-tz'),
    weatherIcon: document.getElementById('weather-icon'),
    weatherTemp: document.getElementById('weather-temp'),
    weatherDesc: document.getElementById('weather-desc'),
    specialBanner: document.getElementById('special-banner'),
    btnFormat: document.getElementById('btn-format'),
    btnLocation: document.getElementById('btn-location'),
    btnAlarm: document.getElementById('btn-alarm'),
  };

  // ---------- Estado ----------
  const state = {
    use24h: true,
    coords: null,       // { lat, lon }
    place: null,        // texto "Ciudad, País"
    alarmOn: false,
    alarmAudioCtx: null,
    lastWeatherFetch: 0,
  };

  const MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const DIAS = [
    'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
  ];

  // Códigos de clima de Open-Meteo -> ícono/emoji + descripción en español
  const WEATHER_CODES = {
    0: ['☀️', 'Despejado'],
    1: ['🌤️', 'Mayormente despejado'],
    2: ['⛅', 'Parcialmente nublado'],
    3: ['☁️', 'Nublado'],
    45: ['🌫️', 'Niebla'],
    48: ['🌫️', 'Niebla escarchada'],
    51: ['🌦️', 'Llovizna leve'],
    53: ['🌦️', 'Llovizna'],
    55: ['🌧️', 'Llovizna densa'],
    61: ['🌧️', 'Lluvia leve'],
    63: ['🌧️', 'Lluvia'],
    65: ['🌧️', 'Lluvia intensa'],
    71: ['🌨️', 'Nieve leve'],
    73: ['🌨️', 'Nieve'],
    75: ['❄️', 'Nieve intensa'],
    80: ['🌦️', 'Chubascos'],
    81: ['🌧️', 'Chubascos fuertes'],
    82: ['⛈️', 'Chubascos violentos'],
    95: ['⛈️', 'Tormenta eléctrica'],
    96: ['⛈️', 'Tormenta con granizo'],
    99: ['⛈️', 'Tormenta severa'],
  };

  // =========================================================
  // 1. RELOJ EN TIEMPO REAL
  // =========================================================
  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function tick() {
    const now = new Date();
    let h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();

    if (state.use24h) {
      el.meridiem.textContent = '';
      el.hours.textContent = pad(h);
    } else {
      const isPM = h >= 12;
      h = h % 12;
      if (h === 0) h = 12;
      el.hours.textContent = pad(h);
      el.meridiem.textContent = isPM ? 'PM' : 'AM';
    }

    el.minutes.textContent = pad(m);
    el.seconds.textContent = pad(s);

    el.dateRow.textContent =
      `${DIAS[now.getDay()]}, ${now.getDate()} de ${MESES[now.getMonth()]} de ${now.getFullYear()}`;

    checkSpecialDate(now);
    checkAlarmChime(now);
  }

  // =========================================================
  // 2. MENSAJES ESPECIALES SEGÚN LA FECHA
  // =========================================================
  function checkSpecialDate(now) {
    const month = now.getMonth(); // 0-indexado
    const day = now.getDate();
    let message = null;

    if (month === 11 && day === 31) {
      const hoursLeft = 23 - now.getHours();
      const minsLeft = 59 - now.getMinutes();
      message = `🎉 ¡Último día del año! Faltan ${hoursLeft}h ${minsLeft}m para el Año Nuevo`;
    } else if (month === 0 && day === 1) {
      message = `🥳 ¡Feliz Año Nuevo ${now.getFullYear()}!`;
    } else if (month === 11 && day === 24) {
      message = '🎄 Nochebuena — quedan pocas horas para Navidad';
    } else if (month === 11 && day === 25) {
      message = '🎁 ¡Feliz Navidad!';
    }

    if (message) {
      el.specialBanner.hidden = false;
      el.specialBanner.textContent = message;
    } else {
      el.specialBanner.hidden = true;
    }
  }

  // =========================================================
  // 3. UBICACIÓN (zona horaria por Intl + país/ciudad por IP)
  // =========================================================
  async function detectLocation() {
    el.statusText.textContent = 'SINCRONIZANDO…';
    el.locationText.textContent = 'Detectando ubicación…';

    // Zona horaria siempre disponible en el navegador, sin permisos ni red
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    el.timezoneText.textContent = tz;
    el.footerTz.textContent = `Zona horaria detectada: ${tz}`;

    try {
      const resp = await fetch('https://ipapi.co/json/');
      if (!resp.ok) throw new Error('IP lookup failed');
      const data = await resp.json();

      const ciudad = data.city || '';
      const pais = data.country_name || '';
      state.place = [ciudad, pais].filter(Boolean).join(', ') || 'Ubicación desconocida';
      state.coords = (data.latitude && data.longitude)
        ? { lat: data.latitude, lon: data.longitude }
        : null;

      el.locationText.textContent = state.place;
      el.statusText.textContent = 'EN LÍNEA';

      if (state.coords) {
        fetchWeather(state.coords.lat, state.coords.lon);
      } else {
        el.weatherDesc.textContent = 'Clima no disponible';
      }
    } catch (err) {
      console.warn('No se pudo detectar la ubicación por IP:', err);
      el.locationText.textContent = `Zona horaria: ${tz}`;
      el.statusText.textContent = 'MODO LOCAL';
      el.weatherDesc.textContent = 'Clima no disponible sin ubicación';
    }
  }

  // =========================================================
  // 4. CLIMA (Open-Meteo, gratuito, sin API key)
  // =========================================================
  async function fetchWeather(lat, lon) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Weather lookup failed');
      const data = await resp.json();
      const cw = data.current_weather;
      if (!cw) throw new Error('Sin datos de clima');

      const [icon, desc] = WEATHER_CODES[cw.weathercode] || ['🌡️', 'Condición desconocida'];
      el.weatherIcon.textContent = icon;
      el.weatherTemp.textContent = `${Math.round(cw.temperature)}°C`;
      el.weatherDesc.textContent = desc;
      state.lastWeatherFetch = Date.now();
    } catch (err) {
      console.warn('No se pudo obtener el clima:', err);
      el.weatherDesc.textContent = 'Clima no disponible';
    }
  }

  // =========================================================
  // 5. INTERACCIÓN: formato 12h/24h, refrescar ubicación, alarma
  // =========================================================
  function toggleFormat() {
    state.use24h = !state.use24h;
    el.btnFormat.setAttribute('aria-pressed', String(!state.use24h));
    tick();
  }

  function refreshLocation() {
    el.btnLocation.setAttribute('aria-pressed', 'true');
    detectLocation().finally(() => {
      setTimeout(() => el.btnLocation.setAttribute('aria-pressed', 'false'), 300);
    });
  }

  function toggleAlarm() {
    state.alarmOn = !state.alarmOn;
    el.btnAlarm.setAttribute('aria-pressed', String(state.alarmOn));
    el.btnAlarm.textContent = state.alarmOn ? 'ALARMA: ON (en :00)' : 'ALARMA';
  }

  // Suena un pitido corto cuando el reloj alcanza el minuto en punto,
  // si el usuario activó la alarma (usa la Web Audio API, sin archivos externos)
  function checkAlarmChime(now) {
    if (!state.alarmOn) return;
    if (now.getSeconds() === 0 && now.getMinutes() % 60 === 0) {
      playBeep();
    }
  }

  function playBeep() {
    try {
      if (!state.alarmAudioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        state.alarmAudioCtx = new AudioCtx();
      }
      const ctx = state.alarmAudioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (err) {
      console.warn('No se pudo reproducir la alarma:', err);
    }
  }

  // =========================================================
  // 6. INICIALIZACIÓN
  // =========================================================
  function init() {
    el.btnFormat.addEventListener('click', toggleFormat);
    el.btnLocation.addEventListener('click', refreshLocation);
    el.btnAlarm.addEventListener('click', toggleAlarm);

    // Reactivar el contexto de audio en el primer toque (requisito de navegadores móviles)
    document.body.addEventListener('click', () => {
      if (state.alarmAudioCtx && state.alarmAudioCtx.state === 'suspended') {
        state.alarmAudioCtx.resume();
      }
    }, { once: true });

    tick();
    setInterval(tick, 1000);

    detectLocation();
    // Refresca el clima cada 15 minutos
    setInterval(() => {
      if (state.coords) fetchWeather(state.coords.lat, state.coords.lon);
    }, 15 * 60 * 1000);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
