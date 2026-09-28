/**
 * satellite.js - Módulo de reconocimiento satelital de alta resolución (Esri World Imagery)
 */

const SatelliteRecon = {
  currentZoom: 14,
  currentLat: 0,
  currentLon: 0,

  /**
   * Genera la URL de la imagen satelital para cualquier coordenada
   * Utiliza el servicio libre de exportación geoespacial de Esri World Imagery
   */
  getImageryUrl(lat, lon, zoom = 14, width = 450, height = 260) {
    this.currentLat = lat;
    this.currentLon = lon;
    this.currentZoom = zoom;

    // Calcular el Bounding Box (bbox) para el zoom especificado
    // A zoom 14, el delta angular es aproximadamente 0.02 grados
    const span = 360 / Math.pow(2, zoom) * 0.75;
    const minLon = lon - span;
    const maxLon = lon + span;
    const minLat = lat - (span * (height / width));
    const maxLat = lat + (span * (height / width));

    const exportUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${minLon.toFixed(6)},${minLat.toFixed(6)},${maxLon.toFixed(6)},${maxLat.toFixed(6)}&bboxSR=4326&imageSR=4326&size=${width},${height}&f=image`;
    
    return exportUrl;
  },

  /**
   * Alternativa: Cálculo de tile z/x/y para composiciones de mosaico
   */
  getTileUrl(lat, lon, zoom = 13) {
    const latRad = lat * Math.PI / 180;
    const n = Math.pow(2, zoom);
    const x = Math.floor((lon + 180) / 360 * n);
    const y = Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n);
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
  },

  /**
   * Renderiza el visor táctico satelital en el contenedor DOM dado
   */
  renderViewer(containerId, lat, lon, zoom = 13) {
    const container = document.getElementById(containerId);
    if (!container) return;

    this.currentLat = lat;
    this.currentLon = lon;
    this.currentZoom = zoom;

    const imgUrl = this.getImageryUrl(lat, lon, this.currentZoom);

    container.innerHTML = `
      <div class="recon-viewport">
        <div class="recon-hud-overlay">
          <div class="recon-reticle"></div>
          <div class="recon-scanline"></div>
          <div class="recon-target-coords">
            <span class="hud-blink">● RECON ACTIVO</span>
            <span>LAT: ${lat.toFixed(4)}° | LON: ${lon.toFixed(4)}°</span>
          </div>
          <div class="recon-zoom-controls">
            <button id="recon-zoom-in" title="Aumentar resolución">+</button>
            <span id="recon-zoom-level">Z:${this.currentZoom}</span>
            <button id="recon-zoom-out" title="Disminuir resolución">-</button>
          </div>
        </div>
        <img id="recon-satellite-img" src="${imgUrl}" alt="Reconocimiento Satelital" class="recon-img" loading="lazy" />
        <div class="recon-footer">
          <span>🛰️ ORBITAL SENSOR · RESOLUCIÓN ÓPTICA</span>
          <span class="source-tag">ESRI WORLD IMAGERY</span>
        </div>
      </div>
    `;

    // Conectar botones de zoom
    const zoomInBtn = document.getElementById('recon-zoom-in');
    const zoomOutBtn = document.getElementById('recon-zoom-out');
    const zoomLabel = document.getElementById('recon-zoom-level');
    const reconImg = document.getElementById('recon-satellite-img');

    if (zoomInBtn && zoomOutBtn && reconImg) {
      zoomInBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.currentZoom < 17) {
          this.currentZoom++;
          zoomLabel.textContent = `Z:${this.currentZoom}`;
          reconImg.src = this.getImageryUrl(this.currentLat, this.currentLon, this.currentZoom);
        }
      });

      zoomOutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.currentZoom > 5) {
          this.currentZoom--;
          zoomLabel.textContent = `Z:${this.currentZoom}`;
          reconImg.src = this.getImageryUrl(this.currentLat, this.currentLon, this.currentZoom);
        }
      });

      // Manejo de error si la imagen no carga
      reconImg.onerror = () => {
        reconImg.src = this.getTileUrl(this.currentLat, this.currentLon, Math.min(this.currentZoom, 12));
      };
    }
  }
};

window.SatelliteRecon = SatelliteRecon;
