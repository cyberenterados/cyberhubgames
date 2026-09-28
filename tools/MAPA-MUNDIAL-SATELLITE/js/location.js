/**
 * location.js - Módulo de geocodificación de alta precisión, dirección milimétrica,
 * Google Plus Codes, inteligencia oceánica y Wikipedia
 */

const LocationIntelligence = {
  cache: new Map(),
  countriesData: null,

  async init() {
    try {
      const resp = await fetch('data/countries.json');
      this.countriesData = await resp.json();
    } catch (e) {
      console.warn('Countries dataset no disponible:', e);
      this.countriesData = {};
    }
  },

  /**
   * Obtiene la información geográfica completa de alta precisión para un punto (lat, lon)
   */
  async resolveLocation(lat, lon) {
    const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const plusCode = this.calculatePlusCode(lat, lon);

    let intel = {
      lat,
      lon,
      formattedCoords: this.formatDecimal(lat, lon),
      dmsCoords: this.formatDMS(lat, lon),
      plusCode,
      placeName: "Ubicación Geográfica",
      subTitle: "Coordenadas Terrestres",
      road: "",
      houseNumber: "",
      neighbourhood: "",
      suburb: "",
      city: "",
      state: "",
      postcode: "",
      country: "",
      countryCode: "",
      flag: "🌐",
      isOcean: false,
      oceanName: "",
      details: {},
      links: {
        googleMaps: `https://www.google.com/maps/@${lat},${lon},18z`,
        streetView: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}`,
        googleEarth: `https://earth.google.com/web/@${lat},${lon},200a,35d,35y,0h,45t,0r`,
        osm: `https://www.openstreetmap.org/#map=18/${lat}/${lon}`
      },
      wikiSummary: null
    };

    try {
      // Consulta a Nominatim a resolución máxima de calle y número (zoom=18)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=es`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.address) {
          const addr = data.address;
          const road = addr.road || addr.pedestrian || addr.street || "";
          const houseNumber = addr.house_number || "";
          const neighbourhood = addr.neighbourhood || addr.suburb || addr.quarter || addr.residential || addr.district || "";
          const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
          const state = addr.state || addr.region || addr.province || "";
          const country = addr.country || "";
          const countryCode = (addr.country_code || "").toUpperCase();
          const postcode = addr.postcode || "";

          intel.road = road;
          intel.houseNumber = houseNumber;
          intel.neighbourhood = neighbourhood;
          intel.city = city;
          intel.state = state;
          intel.country = country;
          intel.countryCode = countryCode;
          intel.postcode = postcode;

          // Construir título principal de dirección de precisión
          if (road) {
            intel.placeName = houseNumber ? `${road} ${houseNumber}` : road;
            intel.subTitle = [neighbourhood, city, country].filter(Boolean).join(' · ');
          } else if (neighbourhood) {
            intel.placeName = neighbourhood;
            intel.subTitle = [city, state, country].filter(Boolean).join(' · ');
          } else if (city) {
            intel.placeName = `${city}, ${country}`;
            intel.subTitle = [state, country].filter(Boolean).join(' · ');
          } else {
            intel.placeName = country || "Región Terrestre";
            intel.subTitle = state || "Zona Rural / Espacio Abierto";
          }

          intel.details = addr;

          // Enriquecer con datos del país
          if (this.countriesData && this.countriesData[countryCode]) {
            const cMeta = this.countriesData[countryCode];
            intel.flag = cMeta.flag;
            intel.capital = cMeta.capital;
            intel.currency = cMeta.currency;
            intel.continent = cMeta.continent;
          }

          // Consultar Wikipedia para la ciudad o país
          const wikiSearchTerm = city || neighbourhood || country;
          if (wikiSearchTerm) {
            intel.wikiSummary = await this.fetchWikipedia(wikiSearchTerm);
          }
        }
      }
    } catch (e) {
      console.warn("Geocodificación Nominatim atenuada, aplicando respaldo marítimo:", e);
    }

    // Si no se detectó país, evaluar cuenca oceánica
    if (!intel.country) {
      const ocean = this.detectOcean(lat, lon);
      intel.isOcean = true;
      intel.oceanName = ocean.name;
      intel.placeName = ocean.name;
      intel.subTitle = `${ocean.depthZone} · ${ocean.basin}`;
      intel.flag = "🌊";
      intel.details = {
        maritimeZone: ocean.name,
        hemisphere: `${lat >= 0 ? 'Norte' : 'Sur'} / ${lon >= 0 ? 'Este' : 'Oeste'}`,
        depthEstimate: ocean.depthEstimate
      };

      intel.wikiSummary = await this.fetchWikipedia(ocean.wikiKey || ocean.name);
    }

    this.cache.set(key, intel);
    return intel;
  },

  /**
   * Cálculo de Google Plus Code (Open Location Code) en JavaScript
   */
  calculatePlusCode(lat, lon) {
    const CODE_ALPHABET = "23456789CFGHJMPQRVWX";
    let adjustedLat = Math.min(Math.max(lat, -90), 90) + 90;
    let adjustedLon = (lon >= 180 ? lon - 360 : lon < -180 ? lon + 360 : lon) + 180;

    let code = "";
    // Nivel 1 a 4 (pares de 20x20 grados, 1x1 grados, etc.)
    let latVal = adjustedLat / 20;
    let lonVal = adjustedLon / 20;

    let latDigit = Math.floor(latVal);
    let lonDigit = Math.floor(lonVal);
    code += CODE_ALPHABET[latDigit] + CODE_ALPHABET[lonDigit];

    latVal = (latVal - latDigit) * 20;
    lonVal = (lonVal - lonDigit) * 20;
    latDigit = Math.floor(latVal);
    lonDigit = Math.floor(lonVal);
    code += CODE_ALPHABET[latDigit] + CODE_ALPHABET[lonDigit];

    latVal = (latVal - latDigit) * 20;
    lonVal = (lonVal - lonDigit) * 20;
    latDigit = Math.floor(latVal);
    lonDigit = Math.floor(lonVal);
    code += CODE_ALPHABET[latDigit] + CODE_ALPHABET[lonDigit];

    latVal = (latVal - latDigit) * 20;
    lonVal = (lonVal - lonDigit) * 20;
    latDigit = Math.floor(latVal);
    lonDigit = Math.floor(lonVal);
    code += CODE_ALPHABET[latDigit] + CODE_ALPHABET[lonDigit];

    // Separador '+' y 2 dígitos de precisión fina
    code += "+";
    latVal = (latVal - latDigit) * 20;
    lonVal = (lonVal - lonDigit) * 20;
    latDigit = Math.floor(latVal);
    lonDigit = Math.floor(lonVal);
    code += CODE_ALPHABET[latDigit] + CODE_ALPHABET[lonDigit];

    return code;
  },

  /**
   * Consulta a Wikipedia REST API
   */
  async fetchWikipedia(query) {
    if (!query) return null;
    const cleanQuery = query.trim();
    try {
      let resp = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanQuery)}`);
      if (!resp.ok) {
        resp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanQuery)}`);
      }

      if (resp.ok) {
        const data = await resp.json();
        return {
          title: data.title,
          extract: data.extract,
          thumbnail: data.thumbnail ? data.thumbnail.source : null,
          url: data.content_urls ? data.content_urls.desktop.page : null
        };
      }
    } catch (err) {
      console.warn('Wikipedia API error:', err);
    }
    return null;
  },

  /**
   * Detección de cuencas oceánicas
   */
  detectOcean(lat, lon) {
    if (lat > 66) {
      return {
        name: "Océano Ártico",
        basin: "Cuenca Polar Ártica",
        depthZone: "Aguas Glaciales",
        depthEstimate: "1,038 m promedio",
        wikiKey: "Océano Ártico"
      };
    }
    if (lat < -60) {
      return {
        name: "Océano Antártico",
        basin: "Océano Austral",
        depthZone: "Convergencia Antártica",
        depthEstimate: "3,270 m promedio",
        wikiKey: "Océano Antártico"
      };
    }

    if (lon >= -70 && lon <= 20) {
      if (lat >= 0) {
        return {
          name: "Océano Atlántico Norte",
          basin: "Cuenca del Atlántico Norte",
          depthZone: "Dorsal Mesoatlántica",
          depthEstimate: "3,646 m promedio",
          wikiKey: "Océano Atlántico"
        };
      } else {
        return {
          name: "Océano Atlántico Sur",
          basin: "Cuenca del Atlántico Sur",
          depthZone: "Fosa de Sandwich del Sur",
          depthEstimate: "3,730 m promedio",
          wikiKey: "Océano Atlántico"
        };
      }
    }

    if (lon > 20 && lon < 115 && lat < 30) {
      return {
        name: "Océano Índico",
        basin: "Cuenca Central del Índico",
        depthZone: "Fosa de Java",
        depthEstimate: "3,741 m promedio",
        wikiKey: "Océano Índico"
      };
    }

    if (lat >= 0) {
      return {
        name: "Océano Pacífico Norte",
        basin: "Cuenca del Pacífico Septentrional",
        depthZone: "Fosa de las Marianas (Sector)",
        depthEstimate: "4,280 m promedio",
        wikiKey: "Océano Pacífico"
      };
    } else {
      return {
        name: "Océano Pacífico Sur",
        basin: "Cuenca del Pacífico Meridional",
        depthZone: "Fosa de Kermadec / Tonga",
        depthEstimate: "4,188 m promedio",
        wikiKey: "Océano Pacífico"
      };
    }
  },

  formatDecimal(lat, lon) {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'O';
    return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
  },

  formatDMS(lat, lon) {
    const toDMS = (deg, isLat) => {
      const dir = deg >= 0 ? (isLat ? 'N' : 'E') : (isLat ? 'S' : 'O');
      const absDeg = Math.abs(deg);
      const d = Math.floor(absDeg);
      const minFloat = (absDeg - d) * 60;
      const m = Math.floor(minFloat);
      const s = Math.floor((minFloat - m) * 60);
      return `${d}° ${m.toString().padStart(2, '0')}' ${s.toString().padStart(2, '0')}" ${dir}`;
    };

    return `${toDMS(lat, true)} // ${toDMS(lon, false)}`;
  }
};

window.LocationIntelligence = LocationIntelligence;
