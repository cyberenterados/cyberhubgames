/**
 * sun.js - Módulo de cálculos astronómicos solares (Día / Noche / Amanecer / Atardecer / Terminador)
 * Algoritmos basados en el Solar Calculation Method de NOAA
 */

const SunCalc = {
  // Constantes matemáticas
  RAD: Math.PI / 180,
  DEG: 180 / Math.PI,

  /**
   * Calcula el día Juliano a partir de una fecha
   */
  getJulianDate(date) {
    const time = date.getTime();
    return (time / 86400000) - (date.getTimezoneOffset() / 1440) + 2440587.5;
  },

  /**
   * Calcula el siglo Juliano
   */
  getJulianCentury(julianDate) {
    return (julianDate - 2451545.0) / 36525.0;
  },

  /**
   * Calcula la posición solar y eventos astronómicos
   * @param {number} lat - Latitud en grados decimales (-90 a 90)
   * @param {number} lon - Longitud en grados decimales (-180 a 180)
   * @param {Date} [date] - Fecha y hora (por defecto Date.now())
   * @returns {Object} Datos solares: sunrise, sunset, solarNoon, isDay, sunAltitude, etc.
   */
  getSolarData(lat, lon, date = new Date()) {
    const radLat = lat * this.RAD;
    const now = date.getTime();
    
    // Inicio del día local aproximado para cálculo de eventos
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    const jd = this.getJulianDate(startOfDay);
    const t = this.getJulianCentury(jd);

    // Parámetros orbitales solares
    const geomMeanLongSun = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
    const geomMeanAnomSun = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    const eccentEarthOrbit = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);

    const sunEqOfCtr = Math.sin(geomMeanAnomSun * this.RAD) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
      Math.sin(2 * geomMeanAnomSun * this.RAD) * (0.019993 - 0.000101 * t) +
      Math.sin(3 * geomMeanAnomSun * this.RAD) * 0.000289;

    const sunTrueLong = geomMeanLongSun + sunEqOfCtr;
    const sunAppLong = sunTrueLong - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * t) * this.RAD);

    const meanObliqEcliptic = 23 + (26 + ((21.448 - t * (46.815 + t * (0.00059 - t * 0.001813)))) / 60) / 60;
    const obliqCorr = meanObliqEcliptic + 0.00256 * Math.cos((125.04 - 1934.136 * t) * this.RAD);

    const sunDeclination = Math.asin(Math.sin(obliqCorr * this.RAD) * Math.sin(sunAppLong * this.RAD));

    const varY = Math.tan((obliqCorr / 2) * this.RAD) * Math.tan((obliqCorr / 2) * this.RAD);
    const eqOfTime = 4 * this.DEG * (
      varY * Math.sin(2 * geomMeanLongSun * this.RAD) -
      2 * eccentEarthOrbit * Math.sin(geomMeanAnomSun * this.RAD) +
      4 * eccentEarthOrbit * varY * Math.sin(geomMeanAnomSun * this.RAD) * Math.cos(2 * geomMeanLongSun * this.RAD) -
      0.5 * varY * varY * Math.sin(4 * geomMeanLongSun * this.RAD) -
      1.25 * eccentEarthOrbit * eccentEarthOrbit * Math.sin(2 * geomMeanAnomSun * this.RAD)
    );

    // Ángulo cenital para amanecer/atardecer astronómico estándar (90.833 grados)
    const zenith = 90.833 * this.RAD;
    let haArg = (Math.cos(zenith) / (Math.cos(radLat) * Math.cos(sunDeclination))) - (Math.tan(radLat) * Math.tan(sunDeclination));
    
    let isPolarDay = false;
    let isPolarNight = false;
    let hourAngle = 0;

    if (haArg >= 1) {
      isPolarNight = true;
    } else if (haArg <= -1) {
      isPolarDay = true;
    } else {
      hourAngle = Math.acos(haArg) * this.DEG;
    }

    // Solar noon en minutos desde medianoche UTC
    const solarNoonMinutes = (720 - 4 * lon - eqOfTime);
    const sunriseMinutes = solarNoonMinutes - hourAngle * 4;
    const sunsetMinutes = solarNoonMinutes + hourAngle * 4;

    // Convertir minutos a objetos Date UTC
    const baseDayUtc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const sunriseDate = isPolarNight ? null : isPolarDay ? null : new Date(baseDayUtc.getTime() + sunriseMinutes * 60000);
    const sunsetDate = isPolarNight ? null : isPolarDay ? null : new Date(baseDayUtc.getTime() + sunsetMinutes * 60000);
    const solarNoonDate = new Date(baseDayUtc.getTime() + solarNoonMinutes * 60000);

    // Altura solar instantánea (para determinar si es de día en este segundo exacto)
    const currentJd = this.getJulianDate(date);
    const currentT = this.getJulianCentury(currentJd);
    const gmst = (280.46061837 + 360.98564736629 * (currentJd - 2451545.0)) % 360;
    const lmst = (gmst + lon) % 360;
    const rightAscension = Math.atan2(
      Math.cos(obliqCorr * this.RAD) * Math.sin(sunAppLong * this.RAD),
      Math.cos(sunAppLong * this.RAD)
    ) * this.DEG;
    
    let localHourAngle = (lmst - rightAscension) % 360;
    if (localHourAngle < -180) localHourAngle += 360;
    if (localHourAngle > 180) localHourAngle -= 360;

    const sunAltitude = Math.asin(
      Math.sin(radLat) * Math.sin(sunDeclination) +
      Math.cos(radLat) * Math.cos(sunDeclination) * Math.cos(localHourAngle * this.RAD)
    ) * this.DEG;

    const isDay = sunAltitude > -0.833;
    const isTwilight = sunAltitude <= -0.833 && sunAltitude >= -18;
    const isNight = sunAltitude < -18;

    let statusText = "Día ☀️";
    if (isPolarDay) statusText = "Día Polar ☀️";
    else if (isPolarNight) statusText = "Noche Polar 🌙";
    else if (isDay) statusText = "Día pleno ☀️";
    else if (isTwilight) statusText = "Crepúsculo 🌅";
    else statusText = "Noche 🌙";

    return {
      isDay,
      isTwilight,
      isNight,
      isPolarDay,
      isPolarNight,
      statusText,
      sunAltitude: Math.round(sunAltitude * 10) / 10,
      sunrise: sunriseDate,
      sunset: sunsetDate,
      solarNoon: solarNoonDate,
      sunDeclination: sunDeclination * this.DEG,
      subsolarPoint: {
        lat: sunDeclination * this.DEG,
        lng: -((date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60 - 720) / 4)
      }
    };
  },

  /**
   * Formatea una fecha UTC al huso local especificado
   */
  formatTime(date, timeZone) {
    if (!date) return "--:--";
    try {
      return new Intl.DateTimeFormat('es-ES', {
        timeZone: timeZone || 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
    } catch (e) {
      return date.toISOString().substring(11, 16);
    }
  },

  /**
   * Genera coordenadas del terminador solar (curva día/noche en la Tierra)
   * Devuelve un array de polígonos GeoJSON para proyectar en Leaflet
   */
  getDayNightPolygon(date = new Date()) {
    const jd = this.getJulianDate(date);
    const t = this.getJulianCentury(jd);
    const geomMeanLongSun = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
    const geomMeanAnomSun = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    const sunEqOfCtr = Math.sin(geomMeanAnomSun * this.RAD) * 1.914602;
    const sunTrueLong = geomMeanLongSun + sunEqOfCtr;
    const obliqCorr = 23.439291;
    const dec = Math.asin(Math.sin(obliqCorr * this.RAD) * Math.sin(sunTrueLong * this.RAD));

    // Longitud del punto subsolar
    const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    const subsolarLon = -(utcHours - 12) * 15;

    const points = [];
    const step = 2; // grados por paso

    for (let lon = -180; lon <= 180; lon += step) {
      const ha = (lon - subsolarLon) * this.RAD;
      // Latitud donde el ángulo cenital es 90°: tan(lat) = -cos(ha) / tan(dec)
      let lat = -Math.atan(Math.cos(ha) / Math.tan(dec)) * this.DEG;
      if (isNaN(lat)) lat = 0;
      points.push([lon, lat]);
    }

    // Cerrar el polígono de sombra hacia el polo nocturno
    const shadowPole = dec >= 0 ? -90 : 90;
    const ring = [[-180, shadowPole]];
    points.forEach(p => ring.push(p));
    ring.push([180, shadowPole]);
    ring.push([-180, shadowPole]);

    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [ring]
      },
      properties: {
        name: "Night Shadow"
      }
    };
  }
};

window.SunCalc = SunCalc;
