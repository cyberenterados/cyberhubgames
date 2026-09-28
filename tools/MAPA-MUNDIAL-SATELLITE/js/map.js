/**
 * map.js - Motor Cartográfico Satelital de Alta Definición con Estética Vintage Recon
 * Integra Esri World Imagery, Radar de Lluvia en tiempo real (RainViewer),
 * Capa de Fronteras, Terminador Solar Día/Noche y Pines Tácticos en Latón.
 */

const MapEngine = {
  leafletMap: null,
  activeTargetMarker: null,
  cityMarkers: [],
  dayNightLayer: null,
  radarLayer: null,
  boundariesLayer: null,
  isRadarActive: true,
  isDayNightActive: true,
  isBoundariesActive: true,
  isVintageFilterActive: false,
  onLocationSelected: null,

  /**
   * Inicializa el mapa satelital
   */
  async init(onLocationSelected) {
    this.onLocationSelected = onLocationSelected;
    this.initLeaflet();
    await this.setupLayers();
    this.loadVintageCityMarkers();
    this.setupSolarTerminator();

    // Actualizar terminador solar cada 2 minutos
    setInterval(() => this.updateSolarTerminator(), 120000);
  },

  /**
   * Configuración de Leaflet centrado en satélite
   */
  initLeaflet() {
    const container = document.getElementById('map-satellite-container');
    if (!container) return;

    this.leafletMap = L.map('map-satellite-container', {
      center: [20, 0],
      zoom: 2.5,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true,
      zoomControl: false,
      attributionControl: false
    });

    // Control de zoom táctico en esquina inferior derecha
    L.control.zoom({ position: 'bottomright' }).addTo(this.leafletMap);

    // 1. Capa Satelital Principal (Esri World Imagery HD)
    this.satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      className: 'satellite-tile-layer'
    }).addTo(this.leafletMap);

    // 2. Capa de Fronteras y Toponimia (Esri Reference Boundaries & Places)
    this.boundariesLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      opacity: 0.75
    }).addTo(this.leafletMap);

    // Detección de clics en el mapa
    this.leafletMap.on('click', (e) => {
      const lat = e.latlng.lat;
      let lng = e.latlng.lng;
      while (lng > 180) lng -= 360;
      while (lng < -180) lng += 360;

      this.setTargetPin(lat, lng);
      if (this.onLocationSelected) {
        this.onLocationSelected(lat, lng);
      }
    });
  },

  /**
   * Configura las capas dinámicas (Radar de Lluvia y Día/Noche)
   */
  async setupLayers() {
    // Cargar radar meteorológico en tiempo real de RainViewer
    if (window.WeatherIntelligence) {
      const radarTileUrl = await window.WeatherIntelligence.getLiveRadarTileUrl();
      if (radarTileUrl) {
        this.radarLayer = L.tileLayer(radarTileUrl, {
          opacity: 0.65,
          zIndex: 400
        });
        if (this.isRadarActive) {
          this.radarLayer.addTo(this.leafletMap);
        }
      }
    }
  },

  /**
   * Alterna la capa de Radar Meteorológico
   */
  toggleRadar() {
    this.isRadarActive = !this.isRadarActive;
    if (this.radarLayer) {
      if (this.isRadarActive) {
        this.radarLayer.addTo(this.leafletMap);
      } else {
        this.leafletMap.removeLayer(this.radarLayer);
      }
    }
    return this.isRadarActive;
  },

  /**
   * Alterna la capa de Fronteras y Nombres
   */
  toggleBoundaries() {
    this.isBoundariesActive = !this.isBoundariesActive;
    if (this.boundariesLayer) {
      if (this.isBoundariesActive) {
        this.boundariesLayer.addTo(this.leafletMap);
      } else {
        this.leafletMap.removeLayer(this.boundariesLayer);
      }
    }
    return this.isBoundariesActive;
  },

  /**
   * Alterna la capa de Día / Noche
   */
  toggleDayNight() {
    this.isDayNightActive = !this.isDayNightActive;
    if (this.dayNightLayer) {
      if (this.isDayNightActive) {
        this.dayNightLayer.addTo(this.leafletMap);
      } else {
        this.leafletMap.removeLayer(this.dayNightLayer);
      }
    }
    return this.isDayNightActive;
  },

  /**
   * Alterna el Filtro de Tono Vintage (estilo cartografía militar antigua)
   */
  toggleVintageFilter() {
    this.isVintageFilterActive = !this.isVintageFilterActive;
    const mapContainer = document.getElementById('map-satellite-container');
    if (mapContainer) {
      mapContainer.classList.toggle('vintage-filter-active', this.isVintageFilterActive);
    }
    return this.isVintageFilterActive;
  },

  /**
   * Configura y actualiza el terminador solar Día/Noche
   */
  setupSolarTerminator() {
    this.updateSolarTerminator();
  },

  updateSolarTerminator() {
    if (!this.leafletMap || !window.SunCalc) return;

    if (this.dayNightLayer) {
      this.leafletMap.removeLayer(this.dayNightLayer);
    }

    const nightGeoJson = window.SunCalc.getDayNightPolygon(new Date());

    this.dayNightLayer = L.geoJSON(nightGeoJson, {
      style: {
        fillColor: '#050a14',
        fillOpacity: 0.42,
        stroke: true,
        color: '#d4af37', // Línea de latón dorado en el terminador
        weight: 1.5,
        dashArray: '3, 4',
        opacity: 0.75
      },
      interactive: false
    });

    if (this.isDayNightActive) {
      this.dayNightLayer.addTo(this.leafletMap);
    }
  },

  /**
   * Carga los pines de metrópolis principales con estética de latón vintage
   */
  loadVintageCityMarkers() {
    if (!this.leafletMap || !window.TimezoneEngine || !window.TimezoneEngine.data) return;

    const cities = window.TimezoneEngine.data.cities || [];
    this.cityMarkers.forEach(m => this.leafletMap.removeLayer(m));
    this.cityMarkers = [];

    cities.forEach(city => {
      const timeData = window.TimezoneEngine.getTimeStrings(city.timezone);

      const badgeHtml = `
        <div class="vintage-city-badge" data-city-id="${city.id}">
          <span class="city-flag-coin">${city.flag}</span>
          <div class="city-info-stack">
            <span class="city-title">${city.name}</span>
            <div class="city-clock-line">
              <span class="city-clock-val" data-tz="${city.timezone}">${timeData.time.substring(0, 5)}</span>
              <span class="city-utc-pill">${city.defaultOffset}</span>
            </div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'vintage-city-divicon',
        html: badgeHtml,
        iconSize: [115, 40],
        iconAnchor: [57, 20]
      });

      const marker = L.marker(city.coords, { icon: customIcon });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        this.setTargetPin(city.coords[0], city.coords[1]);
        if (this.onLocationSelected) {
          this.onLocationSelected(city.coords[0], city.coords[1], city);
        }
      });

      marker.addTo(this.leafletMap);
      this.cityMarkers.push(marker);
    });

    // Actualización de segundero en vivo para los pines de las ciudades
    window.TimezoneEngine.subscribe((now) => {
      document.querySelectorAll('.city-clock-val').forEach(el => {
        const tz = el.getAttribute('data-tz');
        if (tz) {
          const t = window.TimezoneEngine.getTimeStrings(tz, now);
          el.textContent = t.time.substring(0, 5);
        }
      });
    });
  },

  /**
   * Puntero táctico en latón/oro viejo sobre el blanco seleccionado
   */
  setTargetPin(lat, lon) {
    if (!this.leafletMap) return;

    if (this.activeTargetMarker) {
      this.leafletMap.removeLayer(this.activeTargetMarker);
    }

    const targetIcon = L.divIcon({
      className: 'target-reticle-divicon',
      html: `
        <div class="vintage-target-pin">
          <div class="vintage-reticle-ring"></div>
          <div class="vintage-reticle-core"></div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    this.activeTargetMarker = L.marker([lat, lon], { icon: targetIcon, zIndexOffset: 1000 }).addTo(this.leafletMap);
  },

  /**
   * Vuela suavemente hacia cualquier punto del planeta
   */
  flyTo(lat, lon, zoom = 6) {
    if (this.leafletMap) {
      this.leafletMap.flyTo([lat, lon], zoom, {
        duration: 1.8,
        easeLinearity: 0.2
      });
    }
  },

  /**
   * Ajusta el render si cambian dimensiones
   */
  invalidateSize() {
    if (this.leafletMap) {
      this.leafletMap.invalidateSize();
    }
  }
};

window.MapEngine = MapEngine;
