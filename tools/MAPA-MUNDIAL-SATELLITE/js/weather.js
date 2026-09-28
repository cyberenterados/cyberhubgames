/**
 * weather.js - Módulo de meteorología, altitud topográfica (Open-Meteo) y sismicidad (USGS)
 */

const WeatherIntelligence = {
  cache: new Map(),
  seismicCache: new Map(),
  radarData: null,
  radarTimestamp: null,

  WMO_CODES: {
    0: { label: "Cielo despejado", icon: "☀️", tactical: "Óptima visibilidad orbital" },
    1: { label: "Mayormente despejado", icon: "🌤️", tactical: "Nubosidad dispersa" },
    2: { label: "Parcialmente nublado", icon: "⛅", tactical: "Nubosidad media / Reconocimiento favorable" },
    3: { label: "Cubierto / Nublado", icon: "☁️", tactical: "Techo nuboso cerrado" },
    45: { label: "Niebla", icon: "🌫️", tactical: "Atenuación óptica superficial" },
    48: { label: "Niebla engelante", icon: "🌫️", tactical: "Condición de escarcha térmica" },
    51: { label: "Llovizna ligera", icon: "🌦️", tactical: "Humedad superficial leve" },
    53: { label: "Llovizna moderada", icon: "🌦️", tactical: "Precipitación moderada" },
    55: { label: "Llovizna densa", icon: "🌧️", tactical: "Saturación higrométrica" },
    61: { label: "Lluvia leve", icon: "🌧️", tactical: "Superficie húmeda" },
    63: { label: "Lluvia moderada", icon: "🌧️", tactical: "Atenuación de sensores" },
    65: { label: "Lluvia fuerte", icon: "🌧️", tactical: "Precipitación severa" },
    71: { label: "Nieve ligera", icon: "🌨️", tactical: "Acumulación baja" },
    73: { label: "Nieve moderada", icon: "❄️", tactical: "Alerta de congelamiento" },
    75: { label: "Nevada intensa", icon: "❄️", tactical: "Condición térmica crítica" },
    80: { label: "Chubascos leves", icon: "🌦️", tactical: "Inestabilidad local" },
    81: { label: "Chubascos moderados", icon: "🌧️", tactical: "Células convectivas" },
    82: { label: "Chubascos violentos", icon: "⛈️", tactical: "Frente convectivo severo" },
    95: { label: "Tormenta eléctrica", icon: "⚡", tactical: "Alerta de descargas y ráfagas" },
    96: { label: "Tormenta con granizo", icon: "⛈️", tactical: "Riesgo de impacto mecánico" },
    99: { label: "Tormenta severa", icon: "🌩️", tactical: "Alerta de amenaza extrema" }
  },

  /**
   * Obtiene la capa de radar meteorológico en tiempo real de RainViewer
   */
  async getLiveRadarTileUrl() {
    try {
      const resp = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      if (resp.ok) {
        const data = await resp.json();
        this.radarData = data;
        const host = data.host || 'https://tilecache.rainviewer.com';
        const past = (data.radar && data.radar.past) || [];
        if (past.length > 0) {
          const latest = past[past.length - 1];
          this.radarTimestamp = latest.time;
          return `${host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`;
        }
      }
    } catch (e) {
      console.warn('RainViewer radar no disponible temporalmente:', e);
    }
    return null;
  },

  /**
   * Obtiene condiciones meteorológicas y elevación topográfica
   */
  async getWeather(lat, lon) {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (Date.now() - cached.timestamp < 10 * 60 * 1000) {
        return cached.data;
      }
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,surface_pressure&timezone=auto`;
      const response = await fetch(url);

      if (!response.ok) throw new Error(`Open-Meteo HTTP ${response.status}`);
      const data = await response.json();
      const current = data.current_weather;

      let humidity = 65;
      let pressure = 1013;
      if (data.hourly && data.hourly.time) {
        const hourIdx = Math.min(new Date().getHours(), data.hourly.time.length - 1);
        if (data.hourly.relativehumidity_2m && data.hourly.relativehumidity_2m[hourIdx] !== undefined) {
          humidity = data.hourly.relativehumidity_2m[hourIdx];
        }
        if (data.hourly.surface_pressure && data.hourly.surface_pressure[hourIdx] !== undefined) {
          pressure = Math.round(data.hourly.surface_pressure[hourIdx]);
        }
      }

      // Elevación devuelta directamente por el modelo topográfico de Open-Meteo
      const elevationMeters = Math.round(data.elevation !== undefined ? data.elevation : 0);
      const elevationFeet = Math.round(elevationMeters * 3.28084);
      const terrainType = this.classifyTerrain(elevationMeters);

      const wmo = this.WMO_CODES[current.weathercode] || {
        label: "Condición variable",
        icon: "🌤️",
        tactical: "Operatividad normal"
      };

      const windCard = this.degToCompass(current.winddirection);
      const tempC = Math.round(current.temperature * 10) / 10;
      const tempF = Math.round((tempC * 9 / 5 + 32) * 10) / 10;

      const weatherResult = {
        tempC,
        tempF,
        condition: wmo.label,
        icon: wmo.icon,
        tacticalNote: wmo.tactical,
        windSpeedKmh: Math.round(current.windspeed),
        windDirectionDeg: current.winddirection,
        windCompass: windCard,
        humidity,
        pressureHpa: pressure,
        elevationMeters,
        elevationFeet,
        terrainType,
        isDay: current.is_day === 1
      };

      this.cache.set(key, { timestamp: Date.now(), data: weatherResult });
      return weatherResult;
    } catch (err) {
      console.warn("Fallo meteorológico en vivo, aplicando estimación:", err);
      return this.getFallbackWeather(lat);
    }
  },

  /**
   * Clasifica el tipo de relieve según la elevación en metros
   */
  classifyTerrain(elevation) {
    if (elevation < 0) return "Depresión / Fosa marina";
    if (elevation <= 50) return "Costero / Llanura litoral";
    if (elevation <= 250) return "Planicie / Valle bajo";
    if (elevation <= 700) return "Meseta / Lomas moderadas";
    if (elevation <= 1500) return "Relieve montañoso medio";
    if (elevation <= 3000) return "Alta montaña";
    return "Cumbre alpina / Terreno extremo";
  },

  /**
   * Consulta de actividad sísmica reciente mediante la USGS Earthquake API (Gratuita)
   */
  async getRecentEarthquakes(lat, lon) {
    const key = `${lat.toFixed(1)},${lon.toFixed(1)}`;
    if (this.seismicCache.has(key)) {
      return this.seismicCache.get(key);
    }

    try {
      // Sismos de magnitud >= 2.5 en los últimos 30 días dentro de 1000 km
      const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lon}&maxradiuskm=1000&minmagnitude=2.5&limit=3`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        const features = data.features || [];
        const quakes = features.map(f => {
          const props = f.properties;
          const coords = f.geometry.coordinates; // [lon, lat, depth]
          const distKm = Math.round(this.haversine(lat, lon, coords[1], coords[0]));
          const dateObj = new Date(props.time);
          return {
            mag: props.mag ? props.mag.toFixed(1) : "N/A",
            place: props.place || "Región no especificada",
            depthKm: coords[2] ? Math.round(coords[2]) : 10,
            distKm,
            dateStr: dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
            timeStr: dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            url: props.url
          };
        });

        this.seismicCache.set(key, quakes);
        return quakes;
      }
    } catch (e) {
      console.warn("Error consultando sismicidad USGS:", e);
    }
    return [];
  },

  haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  degToCompass(num) {
    const val = Math.floor((num / 22.5) + 0.5);
    const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[(val % 16)];
  },

  getFallbackWeather(lat = 0) {
    const isPolar = Math.abs(lat) > 60;
    const isTropical = Math.abs(lat) < 25;
    const temp = isPolar ? -8 : isTropical ? 28 : 19;
    return {
      tempC: temp,
      tempF: Math.round(temp * 9 / 5 + 32),
      condition: "Despejado",
      icon: "🌤️",
      tacticalNote: "Estimación teórica de superficie",
      windSpeedKmh: 14,
      windDirectionDeg: 120,
      windCompass: "ESE",
      humidity: 58,
      pressureHpa: 1014,
      elevationMeters: 45,
      elevationFeet: 148,
      terrainType: "Costero / Llanura litoral",
      isDay: true
    };
  }
};

window.WeatherIntelligence = WeatherIntelligence;
