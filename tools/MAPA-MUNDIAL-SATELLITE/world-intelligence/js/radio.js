/**
 * radio.js - Módulo de audio y sintonización de radios locales en vivo (Radio Browser API)
 * Permite escuchar transmisiones reales del país/ciudad seleccionada
 */

const RadioIntelligence = {
  currentAudio: null,
  currentStation: null,
  isPlaying: false,
  cache: new Map(),

  async init() {
    this.currentAudio = new Audio();
    this.currentAudio.preload = "none";

    this.currentAudio.addEventListener('playing', () => {
      this.isPlaying = true;
      this.updatePlayerUI();
    });

    this.currentAudio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updatePlayerUI();
    });

    this.currentAudio.addEventListener('error', (e) => {
      console.warn("Error en stream de radio:", e);
      this.isPlaying = false;
      this.updatePlayerUI(true);
    });
  },

  /**
   * Obtiene las 5 estaciones más populares para un código de país (ISO)
   */
  async getStationsForCountry(countryCode) {
    if (!countryCode) return [];
    const code = countryCode.toUpperCase();
    if (this.cache.has(code)) {
      return this.cache.get(code);
    }

    try {
      const url = `https://de1.api.radio-browser.info/json/stations/bycountrycodeexact/${code}?limit=5&order=votes&reverse=true`;
      const resp = await fetch(url);
      if (resp.ok) {
        const list = await resp.json();
        const stations = list.map(s => ({
          id: s.stationuuid,
          name: s.name.trim(),
          streamUrl: s.url_resolved || s.url,
          tags: s.tags || "",
          bitrate: s.bitrate ? `${s.bitrate} kbps` : "Live",
          codec: s.codec || "MP3",
          favicon: s.favicon || null
        }));

        this.cache.set(code, stations);
        return stations;
      }
    } catch (err) {
      console.warn("No se pudieron cargar emisoras de radio:", err);
    }
    return [];
  },

  /**
   * Reproduce una estación específica
   */
  play(streamUrl, stationName) {
    if (!this.currentAudio) return;

    if (this.currentStation && this.currentStation.streamUrl === streamUrl && this.isPlaying) {
      this.pause();
      return;
    }

    this.currentStation = { streamUrl, name: stationName };
    this.currentAudio.src = streamUrl;
    this.currentAudio.play().catch(e => {
      console.warn("Error al reproducir audio:", e);
    });
    this.updatePlayerUI();
  },

  /**
   * Pausa la reproducción
   */
  pause() {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
  },

  /**
   * Actualiza el widget visual del reproductor en el panel
   */
  updatePlayerUI(hasError = false) {
    const statusLabel = document.getElementById('radio-live-status');
    const nowPlayingName = document.getElementById('radio-now-playing');
    const playBtnIcon = document.getElementById('radio-play-icon');

    if (nowPlayingName) {
      nowPlayingName.textContent = this.currentStation ? this.currentStation.name : "Selecciona una emisora";
    }

    if (statusLabel) {
      if (hasError) {
        statusLabel.textContent = "● ERROR EN STREAM";
        statusLabel.style.color = "var(--accent-crimson)";
      } else if (this.isPlaying) {
        statusLabel.textContent = "● EN VIVO (AUDIO AIRPLAY)";
        statusLabel.style.color = "var(--accent-emerald)";
      } else {
        statusLabel.textContent = "○ DETENIDO";
        statusLabel.style.color = "var(--parchment-dark)";
      }
    }

    if (playBtnIcon) {
      playBtnIcon.textContent = this.isPlaying ? "❚❚" : "▶";
    }

    // Actualizar botones de cada emisora en la lista
    document.querySelectorAll('.station-play-btn').forEach(btn => {
      const url = btn.getAttribute('data-stream');
      if (this.currentStation && this.currentStation.streamUrl === url && this.isPlaying) {
        btn.textContent = "PAUSAR";
        btn.classList.add('playing');
      } else {
        btn.textContent = "SINTONIZAR";
        btn.classList.remove('playing');
      }
    });
  }
};

window.RadioIntelligence = RadioIntelligence;
