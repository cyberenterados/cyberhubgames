/**
 * timezone.js - Motor de gestión de husos horarios, cálculo IANA y reloj maestro
 */

const TimezoneEngine = {
  // Caché de zonas y datos
  data: null,
  activeInterval: null,
  clockSubscribers: [],

  /**
   * Inicializa el motor de husos cargando la configuración
   */
  async init() {
    try {
      const resp = await fetch('data/timezone-data.json');
      this.data = await resp.json();
    } catch (e) {
      console.warn('Usando configuración de timezone fallback:', e);
      this.data = { bands: [], cities: [], legend: [] };
    }
    this.startMasterClock();
  },

  /**
   * Inicia el latido continuo del reloj maestro (cada 1s)
   */
  startMasterClock() {
    if (this.activeInterval) clearInterval(this.activeInterval);
    const tick = () => {
      const now = new Date();
      this.clockSubscribers.forEach(cb => {
        try { cb(now); } catch (err) { console.error('Error en clock subscriber:', err); }
      });
    };
    tick();
    this.activeInterval = setInterval(tick, 1000);
  },

  /**
   * Suscribe una función para recibir el tick por segundo
   */
  subscribe(callback) {
    this.clockSubscribers.push(callback);
    callback(new Date());
  },

  /**
   * Determina la zona horaria IANA para cualquier coordenada (lat, lon)
   * Usa aproximación náutica inteligente combinada con ciudades cercanas del dataset
   */
  getTimezoneForCoords(lat, lon, countryCode = null) {
    // 1. Si tenemos código de país, buscar si coincide con una ciudad del dataset
    if (countryCode && this.data && this.data.cities) {
      const match = this.data.cities.find(c => c.countryCode === countryCode);
      if (match && match.timezone) {
        return {
          iana: match.timezone,
          name: match.name,
          offsetNum: match.offsetNum,
          offsetStr: match.defaultOffset
        };
      }
    }

    // 2. Buscar la ciudad más cercana en un radio geodésico razonable (< 700km)
    if (this.data && this.data.cities && this.data.cities.length > 0) {
      let closest = null;
      let minDistance = Infinity;

      for (const city of this.data.cities) {
        const d = this.calcDistance(lat, lon, city.coords[0], city.coords[1]);
        if (d < minDistance) {
          minDistance = d;
          closest = city;
        }
      }

      if (closest && minDistance < 800) {
        return {
          iana: closest.timezone,
          name: closest.name,
          offsetNum: closest.offsetNum,
          offsetStr: closest.defaultOffset,
          nearCity: closest.name
        };
      }
    }

    // 3. Cálculo de huso náutico basado en longitud (-180 a 180)
    // Cada 15 grados equivale a 1 hora
    let hoursOffset = Math.round(lon / 15);
    if (hoursOffset > 14) hoursOffset = 14;
    if (hoursOffset < -12) hoursOffset = -12;

    const sign = hoursOffset >= 0 ? '+' : '-';
    const absHours = Math.abs(hoursOffset);
    const offsetStr = `UTC${sign}${absHours}`;

    // Mapeo IANA Etc/GMT (Ojo: Etc/GMT invierte signos en estándar POSIX, pero usamos formateo con offset)
    return {
      iana: this.getIanaForOffset(hoursOffset),
      name: `Huso ${offsetStr}`,
      offsetNum: hoursOffset,
      offsetStr: offsetStr,
      isNautical: true
    };
  },

  /**
   * Obtiene un identificador IANA equivalente para un offset entero
   */
  getIanaForOffset(offset) {
    // Para visualización confiable usamos ciudades de referencia representativas
    const offsetMap = {
      '-12': 'Pacific/Kwajalein',
      '-11': 'Pacific/Pago_Pago',
      '-10': 'Pacific/Honolulu',
      '-9': 'America/Anchorage',
      '-8': 'America/Los_Angeles',
      '-7': 'America/Denver',
      '-6': 'America/Chicago',
      '-5': 'America/New_York',
      '-4': 'America/Santiago',
      '-3': 'America/Argentina/Buenos_Aires',
      '-2': 'America/Noronha',
      '-1': 'Atlantic/Cape_Verde',
      '0': 'UTC',
      '1': 'Europe/Paris',
      '2': 'Africa/Cairo',
      '3': 'Europe/Moscow',
      '4': 'Asia/Dubai',
      '5': 'Asia/Karachi',
      '6': 'Asia/Dhaka',
      '7': 'Asia/Bangkok',
      '8': 'Asia/Singapore',
      '9': 'Asia/Tokyo',
      '10': 'Australia/Sydney',
      '11': 'Pacific/Noumea',
      '12': 'Pacific/Auckland',
      '13': 'Pacific/Tongatapu',
      '14': 'Pacific/Kiritimati'
    };
    return offsetMap[String(offset)] || 'UTC';
  },

  /**
   * Formatea la hora actual para una zona horaria IANA dada
   */
  getTimeStrings(iana, date = new Date()) {
    try {
      const timeFmt = new Intl.DateTimeFormat('es-ES', {
        timeZone: iana,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const dateFmt = new Intl.DateTimeFormat('es-ES', {
        timeZone: iana,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const offsetFmt = new Intl.DateTimeFormat('en-US', {
        timeZone: iana,
        timeZoneName: 'shortOffset'
      });

      const parts = offsetFmt.formatToParts(date);
      const tzPart = parts.find(p => p.type === 'timeZoneName');
      const offsetDisplay = tzPart ? tzPart.value.replace('GMT', 'UTC') : 'UTC';

      return {
        time: timeFmt.format(date),
        dateStr: dateFmt.format(date),
        offset: offsetDisplay,
        valid: true
      };
    } catch (e) {
      // Fallback a UTC
      return {
        time: date.toISOString().substring(11, 19),
        dateStr: date.toISOString().substring(0, 10),
        offset: 'UTC',
        valid: false
      };
    }
  },

  /**
   * Calcula la diferencia horaria relativa respecto al usuario local
   */
  getRelativeDifference(targetIana, date = new Date()) {
    try {
      const targetStr = new Intl.DateTimeFormat('en-US', {
        timeZone: targetIana,
        hour: 'numeric',
        hour12: false
      }).format(date);

      const localHour = date.getHours();
      const targetHour = parseInt(targetStr, 10);
      let diff = targetHour - localHour;
      if (diff > 12) diff -= 24;
      if (diff < -12) diff += 24;

      if (diff === 0) return "Misma hora que tu reloj local";
      if (diff > 0) return `+${diff}h respecto a tu hora local`;
      return `${diff}h respecto a tu hora local`;
    } catch (e) {
      return "";
    }
  },

  /**
   * Distancia Haversine en kilómetros entre dos coordenadas
   */
  calcDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
};

window.TimezoneEngine = TimezoneEngine;
