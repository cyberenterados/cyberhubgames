/**
 * ui.js - Controlador de Interfaz Vintage Recon, Dossier OSINT con Pestañas Tácticas
 * y Adaptabilidad Responsive para Tablets y Pantallas Verticales
 */

const UIController = {
  currentIntel: null,
  activeClockTicker: null,
  activeTab: 'telemetry',

  init() {
    this.setupTopUtcClock();
    this.setupUtcStrip();
    this.setupSatelliteLayerControls();
    this.setupSearchBar();
    this.setupPanelEvents();
    this.setupTabs();
    this.setupMobileFab();
  },

  /**
   * Reloj Maestro UTC en latón
   */
  setupTopUtcClock() {
    const timeEl = document.getElementById('utc-master-time');
    const dateEl = document.getElementById('utc-master-date');
    if (!timeEl || !dateEl) return;

    window.TimezoneEngine.subscribe((now) => {
      const dateStr = new Intl.DateTimeFormat('es-ES', {
        timeZone: 'UTC',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(now).toUpperCase();

      const timeStr = new Intl.DateTimeFormat('es-ES', {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(now);

      dateEl.textContent = dateStr;
      timeEl.textContent = `${timeStr} (UTC)`;
    });
  },

  /**
   * Franja superior de husos UTC
   */
  setupUtcStrip() {
    const stripContainer = document.getElementById('utc-bands-strip');
    if (!stripContainer || !window.TimezoneEngine || !window.TimezoneEngine.data) return;

    const bands = window.TimezoneEngine.data.bands || [];
    stripContainer.innerHTML = '';

    bands.forEach(b => {
      const pill = document.createElement('div');
      pill.className = 'utc-band-pill';
      pill.setAttribute('data-offset', b.offset);
      pill.title = `${b.label}: ${b.desc}`;
      pill.innerHTML = `<span>${b.label}</span>`;

      pill.addEventListener('click', () => {
        document.querySelectorAll('.utc-band-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const targetLon = b.offset * 15;
        window.MapEngine.flyTo(20, targetLon, 3.5);
      });

      stripContainer.appendChild(pill);
    });
  },

  /**
   * Controles de capas satelitales
   */
  setupSatelliteLayerControls() {
    const radarBtn = document.getElementById('toggle-radar-btn');
    const dayNightBtn = document.getElementById('toggle-daynight-btn');
    const bordersBtn = document.getElementById('toggle-borders-btn');
    const vintageBtn = document.getElementById('toggle-vintage-btn');

    if (radarBtn) {
      radarBtn.addEventListener('click', () => {
        const active = window.MapEngine.toggleRadar();
        radarBtn.classList.toggle('active', active);
      });
    }

    if (dayNightBtn) {
      dayNightBtn.addEventListener('click', () => {
        const active = window.MapEngine.toggleDayNight();
        dayNightBtn.classList.toggle('active', active);
      });
    }

    if (bordersBtn) {
      bordersBtn.addEventListener('click', () => {
        const active = window.MapEngine.toggleBoundaries();
        bordersBtn.classList.toggle('active', active);
      });
    }

    if (vintageBtn) {
      vintageBtn.addEventListener('click', () => {
        const active = window.MapEngine.toggleVintageFilter();
        vintageBtn.classList.toggle('active', active);
      });
    }
  },

  /**
   * Pestañas tácticas del Dossier OSINT
   */
  setupTabs() {
    const tabButtons = document.querySelectorAll('.dossier-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.dossier-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.tab-content-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabId}`);
    });
  },

  /**
   * Botón flotante para Tablets y Móviles en vertical
   */
  setupMobileFab() {
    const fab = document.getElementById('open-intel-fab');
    const panel = document.getElementById('osint-intel-panel');
    if (fab && panel) {
      fab.addEventListener('click', () => {
        panel.classList.toggle('active');
        fab.classList.toggle('panel-open', panel.classList.contains('active'));
      });
    }
  },

  /**
   * Buscador por topónimo o coordenadas
   */
  setupSearchBar() {
    const input = document.getElementById('search-location-input');
    const submitBtn = document.getElementById('search-submit-btn');

    const executeSearch = async () => {
      const query = (input.value || '').trim();
      if (!query) return;

      const coordMatch = query.match(/^([+-]?\d+(\.\d+)?)[,\s]+([+-]?\d+(\.\d+)?)$/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lon = parseFloat(coordMatch[3]);
        if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
          window.MapEngine.flyTo(lat, lon, 7);
          window.App.handleLocationSelect(lat, lon);
          return;
        }
      }

      try {
        submitBtn.textContent = '...';
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const item = data[0];
            const lat = parseFloat(item.lat);
            const lon = parseFloat(item.lon);
            window.MapEngine.flyTo(lat, lon, 7);
            window.App.handleLocationSelect(lat, lon);
          } else {
            alert(`No se encontró la ubicación: "${query}"`);
          }
        }
      } catch (err) {
        console.error("Error buscando ubicación:", err);
      } finally {
        submitBtn.textContent = 'EXPLORAR';
      }
    };

    if (submitBtn) submitBtn.addEventListener('click', executeSearch);
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') executeSearch();
      });
    }
  },

  /**
   * Eventos del Dossier
   */
  setupPanelEvents() {
    const closeBtn = document.getElementById('close-intel-panel');
    const panel = document.getElementById('osint-intel-panel');
    const copyReportBtn = document.getElementById('copy-osint-report');
    const fab = document.getElementById('open-intel-fab');

    if (closeBtn && panel) {
      closeBtn.addEventListener('click', () => {
        panel.classList.remove('active');
        if (fab) fab.classList.remove('panel-open');
        if (this.activeClockTicker) {
          clearInterval(this.activeClockTicker);
          this.activeClockTicker = null;
        }
      });
    }

    if (copyReportBtn) {
      copyReportBtn.addEventListener('click', () => {
        this.copyOsintReportToClipboard();
      });
    }
  },

  /**
   * Carga de telemetría de alta precisión
   */
  async displayIntelligence(lat, lon, cityMeta = null) {
    const panel = document.getElementById('osint-intel-panel');
    const fab = document.getElementById('open-intel-fab');
    if (!panel) return;

    panel.classList.add('active');
    if (fab) fab.classList.add('panel-open');

    // Estado inicial
    document.getElementById('intel-place-title').textContent = cityMeta ? cityMeta.name : "Adquiriendo blanco...";
    document.getElementById('intel-place-subtitle').textContent = "Escaneando telemetría de precisión...";
    document.getElementById('intel-flag-badge').textContent = cityMeta ? cityMeta.flag : "🎯";

    // 1. Husos y Sol
    const tzData = window.TimezoneEngine.getTimezoneForCoords(lat, lon, cityMeta ? cityMeta.countryCode : null);
    const solarData = window.SunCalc.getSolarData(lat, lon);

    // Coordenadas
    document.getElementById('intel-coords-decimal').textContent = window.LocationIntelligence.formatDecimal(lat, lon);
    document.getElementById('intel-coords-dms').textContent = window.LocationIntelligence.formatDMS(lat, lon);
    document.getElementById('intel-plus-code').textContent = window.LocationIntelligence.calculatePlusCode(lat, lon);

    // Iniciar reloj local
    this.startPanelClock(tzData.iana);

    // Datos solares
    document.getElementById('solar-status-badge').textContent = solarData.statusText;
    document.getElementById('solar-altitude-val').textContent = `${solarData.sunAltitude}°`;
    document.getElementById('solar-sunrise-val').textContent = window.SunCalc.formatTime(solarData.sunrise, tzData.iana);
    document.getElementById('solar-noon-val').textContent = window.SunCalc.formatTime(solarData.solarNoon, tzData.iana);
    document.getElementById('solar-sunset-val').textContent = window.SunCalc.formatTime(solarData.sunset, tzData.iana);

    // Renderizar visor de fotosatélite de reconocimiento
    window.SatelliteRecon.renderViewer('intel-satellite-container', lat, lon, 14);

    // 2. Ejecutar consultas paralelas de precisión
    const [locResult, weatherResult, seismicResult] = await Promise.all([
      window.LocationIntelligence.resolveLocation(lat, lon),
      window.WeatherIntelligence.getWeather(lat, lon),
      window.WeatherIntelligence.getRecentEarthquakes(lat, lon)
    ]);

    // Cargar emisoras de radio local del país
    const radioStations = await window.RadioIntelligence.getStationsForCountry(locResult.countryCode);

    this.currentIntel = {
      lat,
      lon,
      cityMeta,
      tzData,
      solarData,
      locResult,
      weatherResult,
      seismicResult,
      radioStations,
      timestamp: new Date().toISOString()
    };

    // Encabezado
    document.getElementById('intel-place-title').textContent = locResult.placeName;
    document.getElementById('intel-place-subtitle').textContent = locResult.subTitle;
    document.getElementById('intel-flag-badge').textContent = locResult.flag;

    // Actualizar Pestaña: Dirección Milimétrica
    document.getElementById('addr-road-val').textContent = locResult.road ? `${locResult.road} ${locResult.houseNumber}`.trim() : "Sin nombre vial registrado";
    document.getElementById('addr-suburb-val').textContent = locResult.neighbourhood || locResult.suburb || "Zona abierta";
    document.getElementById('addr-city-val').textContent = locResult.city || locResult.state || "N/A";
    document.getElementById('addr-postcode-val').textContent = locResult.postcode || "N/A";
    document.getElementById('addr-country-val').textContent = locResult.country || (locResult.isOcean ? locResult.oceanName : "Internacional");

    // Enlaces tácticos externos
    document.getElementById('btn-link-gmaps').href = locResult.links.googleMaps;
    document.getElementById('btn-link-streetview').href = locResult.links.streetView;
    document.getElementById('btn-link-earth').href = locResult.links.googleEarth;
    document.getElementById('btn-link-osm').href = locResult.links.osm;

    // Actualizar Pestaña: Clima, Topografía y Sismos
    document.getElementById('weather-temp-val').textContent = `${weatherResult.tempC}°C / ${weatherResult.tempF}°F`;
    document.getElementById('weather-condition-val').textContent = `${weatherResult.icon} ${weatherResult.condition}`;
    document.getElementById('weather-wind-val').textContent = `${weatherResult.windSpeedKmh} km/h (${weatherResult.windCompass})`;
    document.getElementById('weather-humidity-val').textContent = `${weatherResult.humidity}%`;
    document.getElementById('weather-pressure-val').textContent = `${weatherResult.pressureHpa} hPa`;
    document.getElementById('weather-tactical-note').textContent = weatherResult.tacticalNote;

    // Altitud & Relieve
    document.getElementById('topo-elevation-val').textContent = `${weatherResult.elevationMeters} m (${weatherResult.elevationFeet} ft)`;
    document.getElementById('topo-terrain-val').textContent = weatherResult.terrainType;

    // Sismos Cercanos (USGS)
    const seismicContainer = document.getElementById('seismic-events-list');
    if (seismicContainer) {
      if (seismicResult && seismicResult.length > 0) {
        seismicContainer.innerHTML = seismicResult.map(q => `
          <div class="seismic-event-card">
            <div class="seismic-mag-badge">M ${q.mag}</div>
            <div class="seismic-meta-box">
              <span class="seismic-place">${q.place}</span>
              <div class="seismic-specs">
                <span>Distancia: <strong>${q.distKm} km</strong></span> · 
                <span>Profundidad: <strong>${q.depthKm} km</strong></span> · 
                <span>${q.dateStr} ${q.timeStr}</span>
              </div>
            </div>
          </div>
        `).join('');
      } else {
        seismicContainer.innerHTML = `<p class="empty-list-msg">Sin actividad sísmica relevante (M≥2.5) registrada a menos de 1000 km en los últimos 30 días.</p>`;
      }
    }

    // Actualizar Pestaña: Radio Local en Vivo
    const radioContainer = document.getElementById('radio-stations-list');
    if (radioContainer) {
      if (radioStations && radioStations.length > 0) {
        radioContainer.innerHTML = radioStations.map(st => `
          <div class="station-card">
            <div class="station-meta">
              <span class="station-name">${st.name}</span>
              <span class="station-tagline">${st.tags.substring(0, 30) || 'Transmisión en vivo'} · ${st.codec}</span>
            </div>
            <button class="station-play-btn" data-stream="${st.streamUrl}" data-name="${st.name}">SINTONIZAR</button>
          </div>
        `).join('');

        // Conectar eventos a los botones de sintonización
        radioContainer.querySelectorAll('.station-play-btn').forEach(b => {
          b.addEventListener('click', () => {
            const url = b.getAttribute('data-stream');
            const name = b.getAttribute('data-name');
            window.RadioIntelligence.play(url, name);
          });
        });
      } else {
        radioContainer.innerHTML = `<p class="empty-list-msg">No se detectaron frecuencias de radio online activas para esta región geográfica.</p>`;
      }
    }

    // Wikipedia
    const wikiContainer = document.getElementById('intel-wiki-section');
    if (wikiContainer) {
      if (locResult.wikiSummary && locResult.wikiSummary.extract) {
        wikiContainer.innerHTML = `
          <div class="wiki-card-body">
            ${locResult.wikiSummary.thumbnail ? `<img src="${locResult.wikiSummary.thumbnail}" class="wiki-thumb" alt="Thumbnail" />` : ''}
            <div class="wiki-text-wrapper">
              <h4 class="wiki-title">${locResult.wikiSummary.title}</h4>
              <p class="wiki-extract">${locResult.wikiSummary.extract}</p>
              ${locResult.wikiSummary.url ? `<a href="${locResult.wikiSummary.url}" target="_blank" rel="noopener" class="wiki-link">Abrir artículo completo ↗</a>` : ''}
            </div>
          </div>
        `;
      } else {
        wikiContainer.innerHTML = `<p class="wiki-empty-msg">Sin registro enciclopédico directo para este punto geográfico.</p>`;
      }
    }

    // Metadatos de Jurisdicción
    const countryBox = document.getElementById('intel-country-info');
    if (countryBox) {
      if (locResult.isOcean) {
        countryBox.innerHTML = `
          <div class="meta-row"><span>Zona Marítima:</span> <strong>${locResult.oceanName}</strong></div>
          <div class="meta-row"><span>Profundidad estimada:</span> <strong>${locResult.details.depthEstimate || 'Variable'}</strong></div>
          <div class="meta-row"><span>Hemisferio:</span> <strong>${locResult.details.hemisphere}</strong></div>
        `;
      } else {
        countryBox.innerHTML = `
          <div class="meta-row"><span>País / Territorio:</span> <strong>${locResult.country || 'N/A'}</strong></div>
          <div class="meta-row"><span>Capital:</span> <strong>${locResult.capital || 'N/A'}</strong></div>
          <div class="meta-row"><span>Moneda:</span> <strong>${locResult.currency || 'N/A'}</strong></div>
          <div class="meta-row"><span>Continente:</span> <strong>${locResult.continent || 'N/A'}</strong></div>
        `;
      }
    }
  },

  /**
   * Reloj continuo local
   */
  startPanelClock(iana) {
    if (this.activeClockTicker) {
      clearInterval(this.activeClockTicker);
    }

    const timeEl = document.getElementById('intel-clock-time');
    const dateEl = document.getElementById('intel-clock-date');
    const offsetEl = document.getElementById('intel-clock-offset');
    const diffEl = document.getElementById('intel-clock-diff');
    const ianaEl = document.getElementById('intel-clock-iana');

    const update = () => {
      const now = new Date();
      const t = window.TimezoneEngine.getTimeStrings(iana, now);
      const diff = window.TimezoneEngine.getRelativeDifference(iana, now);

      if (timeEl) timeEl.textContent = t.time;
      if (dateEl) dateEl.textContent = t.dateStr.toUpperCase();
      if (offsetEl) offsetEl.textContent = t.offset;
      if (diffEl) diffEl.textContent = diff;
      if (ianaEl) ianaEl.textContent = iana;
    };

    update();
    this.activeClockTicker = setInterval(update, 1000);
  },

  /**
   * Copiar reporte OSINT al portapapeles
   */
  copyOsintReportToClipboard() {
    if (!this.currentIntel) return;
    const { lat, lon, locResult, tzData, weatherResult, solarData, seismicResult } = this.currentIntel;

    const report = `=====================================================
📜 VINTAGE OSINT PRECISION RECONNAISSANCE DOSSIER
=====================================================
DIRECCIÓN: ${locResult.placeName} (${locResult.subTitle})
COORDENADAS DECIMALES: ${window.LocationIntelligence.formatDecimal(lat, lon)}
FORMATO MILITAR DMS: ${window.LocationIntelligence.formatDMS(lat, lon)}
GOOGLE PLUS CODE: ${locResult.plusCode}
TOPOGRAFÍA: ${weatherResult.elevationMeters}m (${weatherResult.terrainType})
FECHA UTC DEL REPORTE: ${new Date().toUTCString()}

[DIRECCIÓN MILIMÉTRICA]
Calle/Vía: ${locResult.road || 'N/A'} ${locResult.houseNumber || ''}
Barrio/Urbanización: ${locResult.neighbourhood || 'N/A'}
Código Postal: ${locResult.postcode || 'N/A'}
Ciudad/Estado: ${locResult.city || locResult.state || 'N/A'}
País: ${locResult.country || (locResult.isOcean ? locResult.oceanName : 'Aguas Internacionales')}

[CRONOMETRÍA & SOL]
Identificador IANA: ${tzData.iana}
Compensación UTC: ${tzData.offsetStr}
Estado Solar: ${solarData.statusText} (Elevación: ${solarData.sunAltitude}°)
Amanecer: ${window.SunCalc.formatTime(solarData.sunrise, tzData.iana)} | Atardecer: ${window.SunCalc.formatTime(solarData.sunset, tzData.iana)}

[METEOROLOGÍA & SISMICIDAD]
Condición: ${weatherResult.condition}
Temperatura: ${weatherResult.tempC}°C (${weatherResult.tempF}°F)
Viento: ${weatherResult.windSpeedKmh} km/h ${weatherResult.windCompass}
Presión: ${weatherResult.pressureHpa} hPa | Humedad: ${weatherResult.humidity}%
Sismos recientes: ${seismicResult && seismicResult.length > 0 ? `${seismicResult.length} detectados (ej: M${seismicResult[0].mag} a ${seismicResult[0].distKm}km)` : 'Sin sismos relevantes (<1000km)'}

[ENLACES TÁCTICOS]
Google Maps: ${locResult.links.googleMaps}
Street View: ${locResult.links.streetView}
Google Earth: ${locResult.links.googleEarth}
=====================================================`;

    navigator.clipboard.writeText(report).then(() => {
      const copyBtn = document.getElementById('copy-osint-report');
      if (copyBtn) {
        const orig = copyBtn.textContent;
        copyBtn.textContent = '✓ DOSSIER COPIADO';
        setTimeout(() => { copyBtn.textContent = orig; }, 2000);
      }
    }).catch(err => {
      console.error('Error al copiar reporte:', err);
    });
  }
};

window.UIController = UIController;
