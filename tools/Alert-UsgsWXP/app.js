// Configuración global y estado
const USGS_API_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
const REFRESH_INTERVAL = 30000; // Actualizar cada 30 segundos
const STORAGE_KEY = 'usgs_monitored_countries';

// 1. Cargar países guardados desde LocalStorage o inicializar defaults
let monitoredCountries = loadMonitoredCountries();
let knownEarthquakes = new Set(); 
let audioContext = null;
let alarmInterval = null;
let map = null;
let markersLayer = null;

// Elementos del DOM
const alertBanner = document.getElementById('alert-banner');
const alertMessage = document.getElementById('alert-message');
const btnDismiss = document.getElementById('btn-dismiss');
const btnDismissBody = document.getElementById('btn-dismiss-body');
const btnAudio = document.getElementById('btn-audio');
const countryTagsContainer = document.getElementById('country-tags');
const countryInput = document.getElementById('country-input');
const btnAddCountry = document.getElementById('btn-add-country');
const earthquakeList = document.getElementById('earthquake-list');
const minMagSelect = document.getElementById('min-mag');
const lastUpdateSpan = document.getElementById('last-update');

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  renderCountryTags();
  fetchEarthquakes();
  setInterval(fetchEarthquakes, REFRESH_INTERVAL);

  // Listeners de eventos
  btnAddCountry.addEventListener('click', addCountry);
  btnDismiss.addEventListener('click', stopAlert);
  btnDismissBody.addEventListener('click', stopAlert);
  btnAudio.addEventListener('click', () => {
    initAudioContext();
    playBeepSound();
  });
  minMagSelect.addEventListener('change', fetchEarthquakes);
});

// --- PERSISTENCIA CON LOCALSTORAGE ---
function loadMonitoredCountries() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error al leer LocalStorage, cargando defaults:', e);
    }
  }
  return ['Argentina', 'Venezuela'];
}

function saveMonitoredCountries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(monitoredCountries));
}

// --- MAPA LEAFLET ---
function initMap() {
  map = L.map('map').setView([10, -60], 2);

  // Estilo de mapa oscuro o neutro que encaja muy bien con el marco XP
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
}

// --- AUDIO Y ALARMAS ---
function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playBeepSound() {
  initAudioContext();
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(880, audioContext.currentTime); // Tono A5
  osc.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.4);

  gain.gain.setValueAtTime(0.5, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.start();
  osc.stop(audioContext.currentTime + 0.4);
}

function triggerAlarmSound() {
  stopAlertSound();
  playBeepSound();
  alarmInterval = setInterval(playBeepSound, 800);
}

function stopAlertSound() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
}

// --- GESTIÓN DE PAÍSES ---
function renderCountryTags() {
  countryTagsContainer.innerHTML = '';
  monitoredCountries.forEach(country => {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `
      ${country}
      <button onclick="removeCountry('${country}')" title="Eliminar">&times;</button>
    `;
    countryTagsContainer.appendChild(tag);
  });
}

function addCountry() {
  const value = countryInput.value.trim();
  if (value && !monitoredCountries.map(c => c.toLowerCase()).includes(value.toLowerCase())) {
    monitoredCountries.push(value);
    saveMonitoredCountries(); // Guardar cambios en LocalStorage
    countryInput.value = '';
    renderCountryTags();
    fetchEarthquakes();
  }
}

function removeCountry(countryName) {
  monitoredCountries = monitoredCountries.filter(c => c.toLowerCase() !== countryName.toLowerCase());
  saveMonitoredCountries(); // Guardar cambios en LocalStorage
  renderCountryTags();
  fetchEarthquakes();
}

// --- API DE USGS ---
async function fetchEarthquakes() {
  try {
    const response = await fetch(USGS_API_URL);
    const data = await response.json();
    processEarthquakeData(data.features);
    lastUpdateSpan.textContent = `Última sincro: ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    console.error('Error al obtener datos de USGS:', error);
    lastUpdateSpan.textContent = 'Error al conectar con servidor USGS';
  }
}

function processEarthquakeData(features) {
  earthquakeList.innerHTML = '';
  const minMag = parseFloat(minMagSelect.value);
  let newMonitoredAlert = false;
  let alertDetails = [];

  updateMapMarkers(features, minMag);

  features.forEach(quake => {
    const { mag, place, time } = quake.properties;
    const quakeId = quake.id;

    const isMonitored = monitoredCountries.some(country => 
      place.toLowerCase().includes(country.toLowerCase())
    );

    if (isMonitored && !knownEarthquakes.has(quakeId)) {
      newMonitoredAlert = true;
      alertDetails.push(`M${mag ? mag.toFixed(1) : '?'} - ${place}`);
    }

    knownEarthquakes.add(quakeId);

    if (mag >= minMag) {
      renderQuakeItem(quake, isMonitored);
    }
  });

  if (newMonitoredAlert) {
    showAlert(alertDetails.join(' | '));
  }
}

function updateMapMarkers(features, minMag) {
  if (!markersLayer) return;

  markersLayer.clearLayers();

  features.forEach(quake => {
    const { mag, place, time, url } = quake.properties;
    const [lon, lat, depth] = quake.geometry.coordinates;

    if (mag >= minMag) {
      const isMonitored = monitoredCountries.some(country => 
        place.toLowerCase().includes(country.toLowerCase())
      );

      let color = '#8bc34a';
      if (mag >= 4.0 && mag < 6.0) color = '#ffca28';
      if (mag >= 6.0) color = '#ef5350';
      if (isMonitored) color = '#d32f2f';

      const radius = Math.max(mag * 3.5, 4);

      const marker = L.circleMarker([lat, lon], {
        radius: radius,
        fillColor: color,
        color: isMonitored ? '#ffffff' : color,
        weight: isMonitored ? 2 : 1,
        opacity: 0.9,
        fillOpacity: 0.7
      });

      const dateStr = new Date(time).toLocaleString();
      const popupContent = `
        <div style="font-size: 11px; color: #000;">
          <strong style="color: #003c74;">${place}</strong><br>
          <b>Magnitud:</b> M ${mag ? mag.toFixed(1) : 'N/A'}<br>
          <b>Profundidad:</b> ${depth} km<br>
          <small style="color: #555;">${dateStr}</small><br><br>
          <a href="${url}" target="_blank" style="color: #0054e3; text-decoration: underline;">Ficha USGS &rarr;</a>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersLayer.addLayer(marker);
    }
  });
}

function renderQuakeItem(quake, isMonitored) {
  const { mag, place, time, url } = quake.properties;
  const dateStr = new Date(time).toLocaleString();

  let magClass = 'mag-low';
  if (mag >= 4.0 && mag < 6.0) magClass = 'mag-mid';
  if (mag >= 6.0) magClass = 'mag-high';

  const item = document.createElement('div');
  item.className = `quake-item ${isMonitored ? 'monitored' : ''}`;
  item.innerHTML = `
    <div class="mag-badge ${magClass}">M ${mag ? mag.toFixed(1) : 'N/A'}</div>
    <div class="quake-info">
      <div class="quake-place">${place} ${isMonitored ? '🚨' : ''}</div>
      <div class="quake-time">${dateStr}</div>
    </div>
    <a href="${url}" target="_blank" class="xp-btn" style="text-decoration: none;">Ver Ficha</a>
  `;

  earthquakeList.appendChild(item);
}

// Activar/Desactivar Alerta
function showAlert(details) {
  alertMessage.textContent = `Detalles del evento: ${details}`;
  alertBanner.classList.remove('hidden');
  triggerAlarmSound();
}

function stopAlert() {
  alertBanner.classList.add('hidden');
  stopAlertSound();
}