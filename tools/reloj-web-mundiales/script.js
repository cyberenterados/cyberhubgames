/**
 * ====================================================================
 * WINDOWS VISTA AERO - TIME & WEATHER VORTEX
 * 100+ Países, Canvas Cósmico de Reloj & Aurora, Sonido Procedural
 * ====================================================================
 */

// ====================================================================
// 1. DATASET ESCALABLE DE 100+ PAÍSES Y CIUDADES DEL MUNDO
// Cada entrada cuenta con zona horaria IANA real, clima y datos base.
// Para añadir más lugares en el futuro, simplemente añade elementos aquí.
// ====================================================================
const WORLD_LOCATIONS = [
    // --- AMÉRICA ---
    { country: 'Argentina', city: 'Buenos Aires', flag: '🇦🇷', tz: 'America/Argentina/Buenos_Aires', baseTemp: 19, climate: 'Templado' },
    { country: 'México', city: 'Ciudad de México', flag: '🇲🇽', tz: 'America/Mexico_City', baseTemp: 22, climate: 'Subtropical' },
    { country: 'Colombia', city: 'Bogotá', flag: '🇨🇴', tz: 'America/Bogota', baseTemp: 15, climate: 'Andino templado' },
    { country: 'Chile', city: 'Santiago', flag: '🇨🇱', tz: 'America/Santiago', baseTemp: 18, climate: 'Mediterráneo' },
    { country: 'Perú', city: 'Lima', flag: '🇵🇪', tz: 'America/Lima', baseTemp: 20, climate: 'Desértico templado' },
    { country: 'Brasil', city: 'São Paulo', flag: '🇧🇷', tz: 'America/Sao_Paulo', baseTemp: 24, climate: 'Subtropical húmedo' },
    { country: 'Brasil', city: 'Río de Janeiro', flag: '🇧🇷', tz: 'America/Sao_Paulo', baseTemp: 27, climate: 'Tropical' },
    { country: 'Estados Unidos', city: 'Nueva York', flag: '🇺🇸', tz: 'America/New_York', baseTemp: 16, climate: 'Continental' },
    { country: 'Estados Unidos', city: 'Los Ángeles', flag: '🇺🇸', tz: 'America/Los_Angeles', baseTemp: 23, climate: 'Mediterráneo costero' },
    { country: 'Estados Unidos', city: 'Chicago', flag: '🇺🇸', tz: 'America/Chicago', baseTemp: 13, climate: 'Ventoso continental' },
    { country: 'Canadá', city: 'Toronto', flag: '🇨🇦', tz: 'America/Toronto', baseTemp: 12, climate: 'Continental húmedo' },
    { country: 'Canadá', city: 'Vancouver', flag: '🇨🇦', tz: 'America/Vancouver', baseTemp: 14, climate: 'Oceánico lluvioso' },
    { country: 'Uruguay', city: 'Montevideo', flag: '🇺🇾', tz: 'America/Montevideo', baseTemp: 17, climate: 'Templado oceánico' },
    { country: 'Paraguay', city: 'Asunción', flag: '🇵🇾', tz: 'America/Asuncion', baseTemp: 28, climate: 'Subtropical cálido' },
    { country: 'Bolivia', city: 'La Paz', flag: '🇧🇴', tz: 'America/La_Paz', baseTemp: 11, climate: 'Altiplánico frío' },
    { country: 'Ecuador', city: 'Quito', flag: '🇪🇨', tz: 'America/Guayaquil', baseTemp: 16, climate: 'Ecuatorial templado' },
    { country: 'Venezuela', city: 'Caracas', flag: '🇻🇪', tz: 'America/Caracas', baseTemp: 25, climate: 'Tropical de montaña' },
    { country: 'Costa Rica', city: 'San José', flag: '🇨🇷', tz: 'America/Costa_Rica', baseTemp: 23, climate: 'Tropical húmedo' },
    { country: 'Panamá', city: 'Panamá', flag: '🇵🇦', tz: 'America/Panama', baseTemp: 29, climate: 'Tropical marítimo' },
    { country: 'Guatemala', city: 'Guatemala', flag: '🇬🇹', tz: 'America/Guatemala', baseTemp: 21, climate: 'Primaveral montañoso' },
    { country: 'Cuba', city: 'La Habana', flag: '🇨🇺', tz: 'America/Havana', baseTemp: 28, climate: 'Cálido caribeño' },
    { country: 'Rep. Dominicana', city: 'Santo Domingo', flag: '🇩🇴', tz: 'America/Santo_Domingo', baseTemp: 29, climate: 'Tropical costero' },
    { country: 'Puerto Rico', city: 'San Juan', flag: '🇵🇷', tz: 'America/Puerto_Rico', baseTemp: 30, climate: 'Tropical cálido' },
    { country: 'Honduras', city: 'Tegucigalpa', flag: '🇭🇳', tz: 'America/Tegucigalpa', baseTemp: 24, climate: 'Tropical montano' },
    { country: 'El Salvador', city: 'San Salvador', flag: '🇸🇻', tz: 'America/El_Salvador', baseTemp: 26, climate: 'Cálido tropical' },

    // --- EUROPA ---
    { country: 'España', city: 'Madrid', flag: '🇪🇸', tz: 'Europe/Madrid', baseTemp: 19, climate: 'Mediterráneo continental' },
    { country: 'España', city: 'Barcelona', flag: '🇪🇸', tz: 'Europe/Madrid', baseTemp: 21, climate: 'Mediterráneo marítimo' },
    { country: 'Francia', city: 'París', flag: '🇫🇷', tz: 'Europe/Paris', baseTemp: 15, climate: 'Oceánico suave' },
    { country: 'Reino Unido', city: 'Londres', flag: '🇬🇧', tz: 'Europe/London', baseTemp: 14, climate: 'Oceánico nuboso' },
    { country: 'Italia', city: 'Roma', flag: '🇮🇹', tz: 'Europe/Rome', baseTemp: 21, climate: 'Mediterráneo cálido' },
    { country: 'Alemania', city: 'Berlín', flag: '🇩🇪', tz: 'Europe/Berlin', baseTemp: 13, climate: 'Continental templado' },
    { country: 'Países Bajos', city: 'Ámsterdam', flag: '🇳🇱', tz: 'Europe/Amsterdam', baseTemp: 13, climate: 'Marítimo fresco' },
    { country: 'Portugal', city: 'Lisboa', flag: '🇵🇹', tz: 'Europe/Lisbon', baseTemp: 20, climate: 'Mediterráneo soleado' },
    { country: 'Suiza', city: 'Zúrich', flag: '🇨🇭', tz: 'Europe/Zurich', baseTemp: 12, climate: 'Alpino templado' },
    { country: 'Austria', city: 'Viena', flag: '🇦🇹', tz: 'Europe/Vienna', baseTemp: 14, climate: 'Continental suave' },
    { country: 'Grecia', city: 'Atenas', flag: '🇬🇷', tz: 'Europe/Athens', baseTemp: 24, climate: 'Mediterráneo caluroso' },
    { country: 'Suecia', city: 'Estocolmo', flag: '🇸🇪', tz: 'Europe/Stockholm', baseTemp: 8, climate: 'Báltico frío' },
    { country: 'Noruega', city: 'Oslo', flag: '🇳🇴', tz: 'Europe/Oslo', baseTemp: 7, climate: 'Nórdico oceánico' },
    { country: 'Dinamarca', city: 'Copenhague', flag: '🇩🇰', tz: 'Europe/Copenhagen', baseTemp: 10, climate: 'Costero fresco' },
    { country: 'Finlandia', city: 'Helsinki', flag: '🇫🇮', tz: 'Europe/Helsinki', baseTemp: 6, climate: 'Subpolar suave' },
    { country: 'Irlanda', city: 'Dublín', flag: '🇮🇪', tz: 'Europe/Dublin', baseTemp: 12, climate: 'Templado verde' },
    { country: 'Bélgica', city: 'Bruselas', flag: '🇧🇪', tz: 'Europe/Brussels', baseTemp: 13, climate: 'Oceánico húmedo' },
    { country: 'Polonia', city: 'Varsovia', flag: '🇵🇱', tz: 'Europe/Warsaw', baseTemp: 11, climate: 'Continental frío' },
    { country: 'República Checa', city: 'Praga', flag: '🇨🇿', tz: 'Europe/Prague', baseTemp: 12, climate: 'Continental central' },
    { country: 'Hungría', city: 'Budapest', flag: '🇭🇺', tz: 'Europe/Budapest', baseTemp: 14, climate: 'Continental danubiano' },
    { country: 'Rumania', city: 'Bucarest', flag: '🇷🇴', tz: 'Europe/Bucharest', baseTemp: 15, climate: 'Continental seco' },
    { country: 'Ucrania', city: 'Kiev', flag: '🇺🇦', tz: 'Europe/Kyiv', baseTemp: 10, climate: 'Continental frío' },
    { country: 'Rusia', city: 'Moscú', flag: '🇷🇺', tz: 'Europe/Moscow', baseTemp: 6, climate: 'Continental boreal' },
    { country: 'Rusia', city: 'San Petersburgo', flag: '🇷🇺', tz: 'Europe/Moscow', baseTemp: 5, climate: 'Báltico húmedo' },
    { country: 'Islandia', city: 'Reikiavik', flag: '🇮🇸', tz: 'Atlantic/Reykjavik', baseTemp: 4, climate: 'Subártico oceánico' },
    { country: 'Turquía', city: 'Estambul', flag: '🇹🇷', tz: 'Europe/Istanbul', baseTemp: 18, climate: 'Marítimo de transición' },

    // --- ASIA ---
    { country: 'Japón', city: 'Tokio', flag: '🇯🇵', tz: 'Asia/Tokyo', baseTemp: 19, climate: 'Templado húmedo' },
    { country: 'Japón', city: 'Kioto', flag: '🇯🇵', tz: 'Asia/Tokyo', baseTemp: 18, climate: 'Subtropical templado' },
    { country: 'China', city: 'Pekín', flag: '🇨🇳', tz: 'Asia/Shanghai', baseTemp: 16, climate: 'Continental monzónico' },
    { country: 'China', city: 'Shanghái', flag: '🇨🇳', tz: 'Asia/Shanghai', baseTemp: 21, climate: 'Subtropical costero' },
    { country: 'China', city: 'Hong Kong', flag: '🇭🇰', tz: 'Asia/Hong_Kong', baseTemp: 26, climate: 'Subtropical cálido' },
    { country: 'Corea del Sur', city: 'Seúl', flag: '🇰🇷', tz: 'Asia/Seoul', baseTemp: 15, climate: 'Continental templado' },
    { country: 'India', city: 'Nueva Delhi', flag: '🇮🇳', tz: 'Asia/Kolkata', baseTemp: 31, climate: 'Semidesértico cálido' },
    { country: 'India', city: 'Bombay', flag: '🇮🇳', tz: 'Asia/Kolkata', baseTemp: 30, climate: 'Tropical costero' },
    { country: 'Singapur', city: 'Singapur', flag: '🇸🇬', tz: 'Asia/Singapore', baseTemp: 30, climate: 'Ecuatorial lluvioso' },
    { country: 'Tailandia', city: 'Bangkok', flag: '🇹🇭', tz: 'Asia/Bangkok', baseTemp: 32, climate: 'Tropical monzónico' },
    { country: 'Vietnam', city: 'Hanói', flag: '🇻🇳', tz: 'Asia/Ho_Chi_Minh', baseTemp: 26, climate: 'Subtropical húmedo' },
    { country: 'Indonesia', city: 'Yakarta', flag: '🇮🇩', tz: 'Asia/Jakarta', baseTemp: 30, climate: 'Ecuatorial tropical' },
    { country: 'Malasia', city: 'Kuala Lumpur', flag: '🇲🇾', tz: 'Asia/Kuala_Lumpur', baseTemp: 31, climate: 'Ecuatorial selvático' },
    { country: 'Filipinas', city: 'Manila', flag: '🇵🇭', tz: 'Asia/Manila', baseTemp: 31, climate: 'Tropical marítimo' },
    { country: 'Emiratos Árabes', city: 'Dubái', flag: '🇦🇪', tz: 'Asia/Dubai', baseTemp: 35, climate: 'Desértico árido' },
    { country: 'Arabia Saudita', city: 'Riad', flag: '🇸🇦', tz: 'Asia/Riyadh', baseTemp: 33, climate: 'Desértico cálido' },
    { country: 'Qatar', city: 'Doha', flag: '🇶🇦', tz: 'Asia/Qatar', baseTemp: 34, climate: 'Árido costero' },
    { country: 'Israel', city: 'Jerusalén', flag: '🇮🇱', tz: 'Asia/Jerusalem', baseTemp: 22, climate: 'Mediterráneo montañoso' },
    { country: 'Líbano', city: 'Beirut', flag: '🇱🇧', tz: 'Asia/Beirut', baseTemp: 24, climate: 'Mediterráneo costero' },
    { country: 'Kazajistán', city: 'Astaná', flag: '🇰🇿', tz: 'Asia/Almaty', baseTemp: 8, climate: 'Estepario extremo' },
    { country: 'Uzbekistán', city: 'Taskent', flag: '🇺🇿', tz: 'Asia/Tashkent', baseTemp: 20, climate: 'Continental seco' },
    { country: 'Taiwán', city: 'Taipéi', flag: '🇹🇼', tz: 'Asia/Taipei', baseTemp: 25, climate: 'Subtropical húmedo' },
    { country: 'Nepal', city: 'Katmandú', flag: '🇳🇵', tz: 'Asia/Kathmandu', baseTemp: 19, climate: 'Valle himalayo' },
    { country: 'Mongolia', city: 'Ulán Bator', flag: '🇲🇳', tz: 'Asia/Ulaanbaatar', baseTemp: 2, climate: 'Subártico seco' },

    // --- ÁFRICA ---
    { country: 'Egipto', city: 'El Cairo', flag: '🇪🇬', tz: 'Africa/Cairo', baseTemp: 28, climate: 'Desértico seco' },
    { country: 'Sudáfrica', city: 'Johannesburgo', flag: '🇿🇦', tz: 'Africa/Johannesburg', baseTemp: 19, climate: 'Subtropical altiplano' },
    { country: 'Sudáfrica', city: 'Ciudad del Cabo', flag: '🇿🇦', tz: 'Africa/Johannesburg', baseTemp: 20, climate: 'Mediterráneo austral' },
    { country: 'Marruecos', city: 'Casablanca', flag: '🇲🇦', tz: 'Africa/Casablanca', baseTemp: 22, climate: 'Oceánico mediterráneo' },
    { country: 'Kenia', city: 'Nairobi', flag: '🇰🇪', tz: 'Africa/Nairobi', baseTemp: 21, climate: 'Templado ecuatorial' },
    { country: 'Nigeria', city: 'Lagos', flag: '🇳🇬', tz: 'Africa/Lagos', baseTemp: 29, climate: 'Tropical monzónico' },
    { country: 'Ghana', city: 'Acra', flag: '🇬🇭', tz: 'Africa/Accra', baseTemp: 28, climate: 'Tropical costero' },
    { country: 'Senegal', city: 'Dakar', flag: '🇸🇳', tz: 'Africa/Dakar', baseTemp: 26, climate: 'Semidesértico marítimo' },
    { country: 'Túnez', city: 'Túnez', flag: '🇹🇳', tz: 'Africa/Tunis', baseTemp: 23, climate: 'Mediterráneo cálido' },
    { country: 'Etiopía', city: 'Adís Abeba', flag: '🇪🇹', tz: 'Africa/Addis_Ababa', baseTemp: 18, climate: 'Montañoso templado' },
    { country: 'Tanzania', city: 'Dodoma', flag: '🇹🇿', tz: 'Africa/Dar_es_Salaam', baseTemp: 26, climate: 'Semiarido tropical' },
    { country: 'Argelia', city: 'Argel', flag: '🇩🇿', tz: 'Africa/Algiers', baseTemp: 22, climate: 'Mediterráneo' },
    { country: 'Costa de Marfil', city: 'Abiyán', flag: '🇨🇮', tz: 'Africa/Abidjan', baseTemp: 28, climate: 'Tropical húmedo' },
    { country: 'Madagascar', city: 'Antananarivo', flag: '🇲🇬', tz: 'Indian/Antananarivo', baseTemp: 20, climate: 'Subtropical de meseta' },
    { country: 'Namibia', city: 'Windhoek', flag: '🇳🇦', tz: 'Africa/Windhoek', baseTemp: 23, climate: 'Semidesértico montano' },

    // --- OCEANÍA ---
    { country: 'Australia', city: 'Sídney', flag: '🇦🇺', tz: 'Australia/Sydney', baseTemp: 21, climate: 'Subtropical costero' },
    { country: 'Australia', city: 'Melbourne', flag: '🇦🇺', tz: 'Australia/Melbourne', baseTemp: 18, climate: 'Oceánico cambiante' },
    { country: 'Australia', city: 'Brisbane', flag: '🇦🇺', tz: 'Australia/Brisbane', baseTemp: 24, climate: 'Subtropical húmedo' },
    { country: 'Australia', city: 'Perth', flag: '🇦🇺', tz: 'Australia/Perth', baseTemp: 22, climate: 'Mediterráneo' },
    { country: 'Nueva Zelanda', city: 'Auckland', flag: '🇳🇿', tz: 'Pacific/Auckland', baseTemp: 17, climate: 'Oceánico templado' },
    { country: 'Nueva Zelanda', city: 'Wellington', flag: '🇳🇿', tz: 'Pacific/Auckland', baseTemp: 15, climate: 'Oceánico ventoso' },
    { country: 'Fiyi', city: 'Suva', flag: '🇫🇯', tz: 'Pacific/Fiji', baseTemp: 27, climate: 'Tropical lluvioso' },
    { country: 'Papúa N. Guinea', city: 'Port Moresby', flag: '🇵🇬', tz: 'Pacific/Port_Moresby', baseTemp: 29, climate: 'Tropical seco' },
    { country: 'Samoa', city: 'Apia', flag: '🇼🇸', tz: 'Pacific/Apia', baseTemp: 28, climate: 'Ecuatorial oceánico' },
    { country: 'Tahití (Polinesia)', city: 'Papeete', flag: '🇵🇫', tz: 'Pacific/Tahiti', baseTemp: 28, climate: 'Tropical paradisíaco' },

    // --- MÁS LUGARES EMBLEMÁTICOS PARA SUPERAR LOS 100 ---
    { country: 'Noruega', city: 'Tromsø (Ártico)', flag: '🇳🇴', tz: 'Europe/Oslo', baseTemp: 2, climate: 'Subártico polar' },
    { country: 'Chile', city: 'Punta Arenas', flag: '🇨🇱', tz: 'America/Punta_Arenas', baseTemp: 8, climate: 'Subpolar oceánico' },
    { country: 'Estados Unidos', city: 'Honolulu (Hawái)', flag: '🇺🇸', tz: 'Pacific/Honolulu', baseTemp: 28, climate: 'Tropical cálido' },
    { country: 'Estados Unidos', city: 'Anchorage (Alaska)', flag: '🇺🇸', tz: 'America/Anchorage', baseTemp: 3, climate: 'Subpolar continental' },
    { country: 'Groenlandia', city: 'Nuuk', flag: '🇬🇱', tz: 'America/Nuuk', baseTemp: -2, climate: 'Tundra ártica' },
    { country: 'Portugal', city: 'Azores (Ponta Delgada)', flag: '🇵🇹', tz: 'Atlantic/Azores', baseTemp: 18, climate: 'Oceánico atlántico' },
    { country: 'España', city: 'Islas Canarias', flag: '🇪🇸', tz: 'Atlantic/Canary', baseTemp: 23, climate: 'Primavera eterna' },
    { country: 'Mónaco', city: 'Montecarlo', flag: '🇲🇨', tz: 'Europe/Monaco', baseTemp: 20, climate: 'Mediterráneo azul' },
    { country: 'Singapur', city: 'Marina Bay', flag: '🇸🇬', tz: 'Asia/Singapore', baseTemp: 30, climate: 'Ecuatorial' },
    { country: 'Seychelles', city: 'Victoria', flag: '🇸🇨', tz: 'Indian/Mahe', baseTemp: 29, climate: 'Tropical atolón' },
    { country: 'Maldivas', city: 'Malé', flag: '🇲🇻', tz: 'Indian/Maldives', baseTemp: 30, climate: 'Tropical monzónico' },
    { country: 'Mauricio', city: 'Port Louis', flag: '🇲🇺', tz: 'Indian/Mauritius', baseTemp: 25, climate: 'Tropical insular' },
    { country: 'Chipre', city: 'Nicosia', flag: '🇨🇾', tz: 'Asia/Nicosia', baseTemp: 24, climate: 'Mediterráneo seco' },
    { country: 'Malta', city: 'La Valeta', flag: '🇲🇹', tz: 'Europe/Malta', baseTemp: 22, climate: 'Mediterráneo marino' },
    { country: 'Luxemburgo', city: 'Luxemburgo', flag: '🇱🇺', tz: 'Europe/Luxembourg', baseTemp: 13, climate: 'Oceánico suave' },
    { country: 'Andorra', city: 'Andorra la Vella', flag: '🇦🇩', tz: 'Europe/Andorra', baseTemp: 11, climate: 'Pirenaico alpino' }
];

// Tipos de condiciones climáticas con iconos y probabilidades
const WEATHER_CONDITIONS = [
    { name: 'Soleado', icon: '☀️', iconNight: '✨', delta: 2 },
    { name: 'Despejado', icon: '🌤️', iconNight: '🌙', delta: 1 },
    { name: 'Parcial nublado', icon: '⛅', iconNight: '☁️', delta: -1 },
    { name: 'Nublado', icon: '☁️', iconNight: '☁️', delta: -2 },
    { name: 'Lluvia suave', icon: '🌧️', iconNight: '🌧️', delta: -3 },
    { name: 'Tormenta', icon: '⛈️', iconNight: '⚡', delta: -4 },
    { name: 'Brisa fresca', icon: '🍃', iconNight: '🌬️', delta: -2 },
    { name: 'Niebla ligera', icon: '🌫️', iconNight: '🌫️', delta: -1 },
    { name: 'Nieve suave', icon: '❄️', iconNight: '❄️', delta: -6 }
];

// ====================================================================
// 2. SISTEMA DE AUDIO PROCEDURAL CON WEB AUDIO API
// Generador de ondas armónicas estilo Windows Vista + Campanas de cristal
// ====================================================================
class AeroAudioEngine {
    constructor() {
        this.ctx = null;
        this.isAudioEnabled = false;
        this.masterGain = null;
        this.droneGain = null;
        this.osc1 = null;
        this.osc2 = null;
        this.osc3 = null;
        this.filter = null;
        this.lfo = null;
        this.pentatonicNotes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    }

    init() {
        if (this.ctx) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // Crear sintetizador ambiental de fondo (Lush Vista Ambient Pad)
        this.setupAmbientDrone();
    }

    setupAmbientDrone() {
        // Filtro cálido paso bajo
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.setValueAtTime(550, this.ctx.currentTime);
        this.filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

        this.droneGain = this.ctx.createGain();
        this.droneGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

        // Osciladores afinados en acordes suaves (Do - Mi - Sol - Si)
        this.osc1 = this.ctx.createOscillator();
        this.osc1.type = 'sine';
        this.osc1.frequency.setValueAtTime(130.81, this.ctx.currentTime); // C3

        this.osc2 = this.ctx.createOscillator();
        this.osc2.type = 'triangle';
        this.osc2.frequency.setValueAtTime(196.00, this.ctx.currentTime); // G3

        this.osc3 = this.ctx.createOscillator();
        this.osc3.type = 'sine';
        this.osc3.frequency.setValueAtTime(246.94, this.ctx.currentTime); // B3 (Maj7th color)

        // LFO para movimiento orgánico del filtro
        this.lfo = this.ctx.createOscillator();
        this.lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // 0.12 Hz lento
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(220, this.ctx.currentTime);

        this.lfo.connect(lfoGain);
        lfoGain.connect(this.filter.frequency);

        this.osc1.connect(this.filter);
        this.osc2.connect(this.filter);
        this.osc3.connect(this.filter);
        this.filter.connect(this.droneGain);
        this.droneGain.connect(this.masterGain);

        this.osc1.start();
        this.osc2.start();
        this.osc3.start();
        this.lfo.start();
    }

    start() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        if (this.masterGain) {
            this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
            this.masterGain.gain.linearRampToValueAtTime(0.28, this.ctx.currentTime + 1.8);
        }
        this.isAudioEnabled = true;
    }

    stop() {
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
            this.masterGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);
        }
        this.isAudioEnabled = false;
    }

    // Tocar sutil campana de cristal cuando un cuadrito se cristaliza en pantalla
    playGlassChime() {
        if (!this.isAudioEnabled || !this.ctx) return;

        const noteIndex = Math.floor(Math.random() * this.pentatonicNotes.length);
        const freq = this.pentatonicNotes[noteIndex];

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        // Envolvente rápida y resonante como cristal de Windows Vista
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.045, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.85);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.9);
    }
}

const aeroAudio = new AeroAudioEngine();

// ====================================================================
// 3. CANVAS ENGINE: RELOJ CÓSMICO Y AURORA BOREAL WINDOWS VISTA
// Animación fluida de 60fps con efecto de viaje en el tiempo
// ====================================================================
class AeroCosmicClockCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.time = 0;
        this.particles = [];
        this.gears = [];

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Inicializar partículas del vórtice temporal
        for (let i = 0; i < 90; i++) {
            this.particles.push({
                angle: Math.random() * Math.PI * 2,
                radius: Math.random() * Math.max(this.width, this.height) * 0.7,
                speed: 0.002 + Math.random() * 0.006,
                radialSpeed: 0.2 + Math.random() * 0.7,
                size: 1 + Math.random() * 2.5,
                alpha: 0.15 + Math.random() * 0.6,
                hue: Math.random() > 0.4 ? 195 : 155 // Cyan o Esmeralda Vista
            });
        }

        // Anillos concéntricos y engranajes holográficos
        this.gears = [
            { radius: 120, teeth: 24, speed: 0.003, dir: 1, type: 'gear' },
            { radius: 210, speed: -0.002, dir: -1, type: 'romans' },
            { radius: 310, teeth: 48, speed: 0.0015, dir: 1, type: 'outerRing' },
            { radius: 420, speed: -0.0008, dir: -1, type: 'constellation' }
        ];

        this.render = this.render.bind(this);
        requestAnimationFrame(this.render);
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);
    }

    render() {
        this.time += 0.016;

        // Limpiar lienzo
        this.ctx.fillStyle = '#040914';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 1. Dibujar Ondas Aurora Windows Vista
        this.drawAuroraWaves();

        // 2. Dibujar Vórtice de Partículas de Tiempo
        this.drawTimeVortex();

        // 3. Dibujar Reloj Celestial Holográfico Central
        this.drawHolographicClock();

        requestAnimationFrame(this.render);
    }

    drawAuroraWaves() {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';

        const waveLayers = [
            { yRatio: 0.35, color: 'rgba(0, 210, 255, 0.12)', speed: 0.0008, amp: 70, freq: 0.0018 },
            { yRatio: 0.45, color: 'rgba(0, 245, 160, 0.09)', speed: -0.0007, amp: 85, freq: 0.0015 },
            { yRatio: 0.60, color: 'rgba(0, 120, 215, 0.11)', speed: 0.0009, amp: 60, freq: 0.0022 },
            { yRatio: 0.70, color: 'rgba(120, 90, 235, 0.08)', speed: -0.0006, amp: 75, freq: 0.0019 }
        ];

        waveLayers.forEach(layer => {
            this.ctx.beginPath();
            const baseY = this.height * layer.yRatio;
            this.ctx.moveTo(0, baseY);

            for (let x = 0; x <= this.width; x += 15) {
                const wave1 = Math.sin(x * layer.freq + this.time * layer.speed * 60) * layer.amp;
                const wave2 = Math.cos(x * layer.freq * 0.5 - this.time * layer.speed * 40) * (layer.amp * 0.4);
                this.ctx.lineTo(x, baseY + wave1 + wave2);
            }

            this.ctx.lineTo(this.width, this.height);
            this.ctx.lineTo(0, this.height);
            this.ctx.closePath();

            const grad = this.ctx.createLinearGradient(0, baseY - 60, 0, baseY + 180);
            grad.addColorStop(0, layer.color);
            grad.addColorStop(0.5, layer.color);
            grad.addColorStop(1, 'rgba(0,0,0,0)');

            this.ctx.fillStyle = grad;
            this.ctx.fill();
        });

        this.ctx.restore();
    }

    drawTimeVortex() {
        const cx = this.width / 2;
        const cy = this.height / 2;
        const maxDist = Math.max(this.width, this.height) * 0.75;

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';

        this.particles.forEach(p => {
            p.angle += p.speed;
            p.radius += p.radialSpeed;
            if (p.radius > maxDist) {
                p.radius = 40 + Math.random() * 60;
                p.angle = Math.random() * Math.PI * 2;
            }

            const x = cx + Math.cos(p.angle) * p.radius;
            const y = cy + Math.sin(p.angle) * p.radius;

            this.ctx.beginPath();
            this.ctx.arc(x, y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `hsla(${p.hue}, 100%, 75%, ${p.alpha * 0.7})`;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = `hsl(${p.hue}, 100%, 65%)`;
            this.ctx.fill();
        });

        this.ctx.restore();
    }

    drawHolographicClock() {
        const cx = this.width / 2;
        const cy = this.height / 2;
        const baseRadius = Math.min(this.width, this.height) * 0.36;

        this.ctx.save();
        this.ctx.translate(cx, cy);

        // 1. Resplandor del núcleo central Aero
        const coreGlow = this.ctx.createRadialGradient(0, 0, 10, 0, 0, baseRadius * 1.4);
        coreGlow.addColorStop(0, 'rgba(0, 210, 255, 0.16)');
        coreGlow.addColorStop(0.4, 'rgba(0, 140, 220, 0.08)');
        coreGlow.addColorStop(0.8, 'rgba(0, 245, 160, 0.03)');
        coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = coreGlow;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, baseRadius * 1.4, 0, Math.PI * 2);
        this.ctx.fill();

        // 2. Anillos concéntricos giratorios
        this.gears.forEach(g => {
            const r = (g.radius / 300) * baseRadius;
            const angle = this.time * g.speed;

            this.ctx.save();
            this.ctx.rotate(angle);

            this.ctx.strokeStyle = 'rgba(0, 210, 255, 0.22)';
            this.ctx.lineWidth = 1.2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, r, 0, Math.PI * 2);
            this.ctx.stroke();

            // Detalles según el tipo
            if (g.type === 'gear') {
                // Pequeños dientes de engranaje de cristal
                const teethCount = g.teeth;
                this.ctx.fillStyle = 'rgba(0, 245, 160, 0.35)';
                for (let t = 0; t < teethCount; t++) {
                    const tAngle = (t / teethCount) * Math.PI * 2;
                    const tx = Math.cos(tAngle) * r;
                    const ty = Math.sin(tAngle) * r;
                    this.ctx.fillRect(tx - 2, ty - 2, 4, 4);
                }
            } else if (g.type === 'romans') {
                // Números romanos flotantes
                const numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
                this.ctx.font = '10px "Segoe UI", sans-serif';
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';

                for (let n = 0; n < 12; n++) {
                    const nAngle = (n / 12) * Math.PI * 2 - Math.PI / 2;
                    const nx = Math.cos(nAngle) * r;
                    const ny = Math.sin(nAngle) * r;
                    this.ctx.fillText(numerals[n], nx, ny);
                }
            } else if (g.type === 'outerRing') {
                // Marcas de 60 segundos
                this.ctx.strokeStyle = 'rgba(0, 210, 255, 0.3)';
                for (let s = 0; s < 60; s++) {
                    const sAngle = (s / 60) * Math.PI * 2;
                    const inner = r - (s % 5 === 0 ? 8 : 4);
                    this.ctx.beginPath();
                    this.ctx.moveTo(Math.cos(sAngle) * inner, Math.sin(sAngle) * inner);
                    this.ctx.lineTo(Math.cos(sAngle) * r, Math.sin(sAngle) * r);
                    this.ctx.stroke();
                }
            }

            this.ctx.restore();
        });

        // 3. Manecillas cósmicas en tiempo real (basadas en la hora local del dispositivo)
        const now = new Date();
        const ms = now.getMilliseconds();
        const sec = now.getSeconds() + ms / 1000;
        const min = now.getMinutes() + sec / 60;
        const hr = (now.getHours() % 12) + min / 60;

        const hrAngle = (hr / 12) * Math.PI * 2 - Math.PI / 2;
        const minAngle = (min / 60) * Math.PI * 2 - Math.PI / 2;
        const secAngle = (sec / 60) * Math.PI * 2 - Math.PI / 2;

        // Manecilla Horas
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        this.ctx.lineWidth = 3.5;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(Math.cos(hrAngle) * (baseRadius * 0.45), Math.sin(hrAngle) * (baseRadius * 0.45));
        this.ctx.stroke();
        this.ctx.restore();

        // Manecilla Minutos
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 210, 255, 0.65)';
        this.ctx.lineWidth = 2.2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(Math.cos(minAngle) * (baseRadius * 0.65), Math.sin(minAngle) * (baseRadius * 0.65));
        this.ctx.stroke();
        this.ctx.restore();

        // Manecilla Segundos fluida con haz de luz
        this.ctx.save();
        this.ctx.strokeStyle = '#00f5a0';
        this.ctx.lineWidth = 1.2;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00f5a0';
        this.ctx.beginPath();
        this.ctx.moveTo(-Math.cos(secAngle) * 20, -Math.sin(secAngle) * 20);
        this.ctx.lineTo(Math.cos(secAngle) * (baseRadius * 0.78), Math.sin(secAngle) * (baseRadius * 0.78));
        this.ctx.stroke();

        // Núcleo central
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
        this.ctx.restore();

        this.ctx.restore();
    }
}

// ====================================================================
// 4. GESTOR DE MINI CUADRITOS Y POBLACIÓN ALEATORIA DE LA PANTALLA
// Llena la pantalla en orden aleatorio de manera progresiva y autónoma
// ====================================================================
class WorldTilesManager {
    constructor() {
        this.gridEl = document.getElementById('tiles-grid');
        this.activeCountEl = document.getElementById('active-count');
        this.totalCountEl = document.getElementById('total-count');
        this.statusMsgEl = document.getElementById('status-msg');
        this.utcClockEl = document.getElementById('utc-clock');

        this.locations = [...WORLD_LOCATIONS];
        this.activeCards = [];
        this.spawnTimer = null;
        this.clockInterval = null;
        this.isSpawning = false;

        this.init();
    }

    init() {
        this.totalCountEl.textContent = this.locations.length;
        this.startUtcClock();
        this.startWave();

        // Iniciar reloj central de actualización
        this.clockInterval = setInterval(() => {
            this.updateAllCardClocks();
        }, 1000);
    }

    startUtcClock() {
        const updateUtc = () => {
            const now = new Date();
            const h = String(now.getUTCHours()).padStart(2, '0');
            const m = String(now.getUTCMinutes()).padStart(2, '0');
            const s = String(now.getUTCSeconds()).padStart(2, '0');
            if (this.utcClockEl) {
                this.utcClockEl.textContent = `${h}:${m}:${s}`;
            }
        };
        updateUtc();
        setInterval(updateUtc, 1000);
    }

    // Mezcla aleatoria tipo Fisher-Yates
    shuffleLocations(array) {
        const copy = [...array];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    // Iniciar oleada de aparición aleatoria
    startWave() {
        if (this.spawnTimer) clearInterval(this.spawnTimer);

        // Limpiar rejilla y reiniciar contadores
        this.gridEl.innerHTML = '';
        this.activeCards = [];
        this.activeCountEl.textContent = '0';
        this.statusMsgEl.textContent = 'Aparición aleatoria en progreso...';

        const randomizedQueue = this.shuffleLocations(this.locations);
        let currentIndex = 0;
        this.isSpawning = true;

        // Intervalo de aparición progresiva: cada 120ms - 240ms aparece un nuevo país
        const spawnNext = () => {
            if (currentIndex >= randomizedQueue.length) {
                this.isSpawning = false;
                this.statusMsgEl.textContent = `¡Pantalla completa! ${this.activeCards.length} Países sincronizados en tiempo real.`;
                return;
            }

            const loc = randomizedQueue[currentIndex];
            this.createCard(loc);
            currentIndex++;
            this.activeCountEl.textContent = this.activeCards.length;

            // Reproducir sonido sutil de cristalización
            aeroAudio.playGlassChime();

            // Tiempo aleatorio dinámico entre cuadritos para mayor naturalidad
            const nextDelay = Math.floor(100 + Math.random() * 120);
            this.spawnTimer = setTimeout(spawnNext, nextDelay);
        };

        spawnNext();
    }

    createCard(location) {
        const card = document.createElement('div');
        card.className = 'aero-card';

        // Generar clima dinámico coherente
        const weatherObj = this.generateWeather(location);

        // Obtener hora y fecha actual en la zona horaria del país
        const timeData = this.getTimeData(location.tz);

        // Asignar clase de día / noche para el resplandor temático
        card.classList.add(timeData.isDay ? 'is-day' : 'is-night');

        card.innerHTML = `
            <div class="card-header">
                <div class="card-location">
                    <div class="card-country-row">
                        <span class="card-flag">${location.flag}</span>
                        <span class="card-country" title="${location.country}">${location.country}</span>
                    </div>
                    <span class="card-city" title="${location.city}">${location.city}</span>
                </div>
                <div class="card-daynight-badge" title="${timeData.isDay ? 'De día' : 'De noche'}">
                    ${timeData.isDay ? '☀️' : '🌙'}
                </div>
            </div>

            <div class="card-body">
                <div class="card-time">
                    <span class="card-hours-mins">${timeData.hhMm}</span><span class="card-seconds">:${timeData.ss}</span>
                </div>
                <div class="card-date-badge">${timeData.dateStr}</div>
            </div>

            <div class="card-footer">
                <div class="weather-info">
                    <span class="weather-icon">${timeData.isDay ? weatherObj.cond.icon : weatherObj.cond.iconNight}</span>
                    <span class="weather-desc" title="${weatherObj.cond.name}">${weatherObj.cond.name}</span>
                </div>
                <div class="weather-temp">${weatherObj.temp}°C</div>
            </div>
        `;

        this.gridEl.appendChild(card);

        // Guardar referencia para actualizaciones en vivo
        const cardRef = {
            el: card,
            tz: location.tz,
            hhMmEl: card.querySelector('.card-hours-mins'),
            ssEl: card.querySelector('.card-seconds'),
            dateEl: card.querySelector('.card-date-badge'),
            dayNightEl: card.querySelector('.card-daynight-badge'),
            weatherIconEl: card.querySelector('.weather-icon'),
            weatherObj: weatherObj
        };

        this.activeCards.push(cardRef);
    }

    // Generar condiciones climáticas realistas según el país y la estación
    generateWeather(loc) {
        const randCond = WEATHER_CONDITIONS[Math.floor(Math.random() * WEATHER_CONDITIONS.length)];
        const variation = (Math.random() * 4 - 2);
        const temp = Math.round(loc.baseTemp + randCond.delta + variation);
        return { cond: randCond, temp: temp };
    }

    // Calcular hora y fecha en la zona horaria IANA especificada
    getTimeData(timezone) {
        try {
            const now = new Date();
            const timeFormatter = new Intl.DateTimeFormat('es-ES', {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });

            const parts = timeFormatter.formatToParts(now);
            let hour = '00', min = '00', sec = '00';

            for (const p of parts) {
                if (p.type === 'hour') hour = p.value;
                if (p.type === 'minute') min = p.value;
                if (p.type === 'second') sec = p.value;
            }

            const hNum = parseInt(hour, 10);
            const isDay = (hNum >= 6 && hNum < 19);

            // Formato de fecha corta: ej. "Lun, 12 Sep"
            const dateFormatter = new Intl.DateTimeFormat('es-ES', {
                timeZone: timezone,
                weekday: 'short',
                day: 'numeric',
                month: 'short'
            });

            const dateStr = dateFormatter.format(now);

            return {
                hhMm: `${hour}:${min}`,
                ss: sec,
                dateStr: dateStr,
                isDay: isDay
            };
        } catch (e) {
            // Fallback en caso de incompatibilidad con zona horaria antigua
            const now = new Date();
            return {
                hhMm: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
                ss: String(now.getSeconds()).padStart(2, '0'),
                dateStr: 'Global',
                isDay: true
            };
        }
    }

    // Actualizar todos los relojes de las tarjetas segundo a segundo
    updateAllCardClocks() {
        if (!this.activeCards.length) return;

        for (let i = 0; i < this.activeCards.length; i++) {
            const card = this.activeCards[i];
            const timeData = this.getTimeData(card.tz);

            if (card.hhMmEl) card.hhMmEl.textContent = timeData.hhMm;
            if (card.ssEl) card.ssEl.textContent = `:${timeData.ss}`;

            // Actualizar sol / luna si cambia la hora del día
            if (card.dayNightEl) {
                card.dayNightEl.textContent = timeData.isDay ? '☀️' : '🌙';
            }
        }
    }
}

// ====================================================================
// 5. INICIALIZACIÓN DE LA APLICACIÓN Y CONTROLADORES DE EVENTOS
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Iniciar Canvas del Reloj Cósmico y Aurora
    const cosmicCanvas = new AeroCosmicClockCanvas('aero-canvas');

    // 2. Iniciar Administrador de Países y Rejilla
    const tilesManager = new WorldTilesManager();

    // 3. Controles de Audio y Botones de la Barra Superior
    const btnAudio = document.getElementById('btn-audio');
    const audioIcon = document.getElementById('audio-icon');
    const audioLabel = document.getElementById('audio-label');
    const audioVisualizer = document.getElementById('audio-visualizer');
    const audioPrompt = document.getElementById('audio-prompt');
    const btnPromptOk = document.getElementById('btn-prompt-ok');
    const btnShuffle = document.getElementById('btn-shuffle');
    const btnFullscreen = document.getElementById('btn-fullscreen');

    function toggleAudio() {
        if (!aeroAudio.isAudioEnabled) {
            aeroAudio.start();
            audioIcon.textContent = '🔊';
            audioLabel.textContent = 'Sonido: On';
            btnAudio.classList.add('audio-playing');
            if (audioPrompt) audioPrompt.classList.add('hidden');
        } else {
            aeroAudio.stop();
            audioIcon.textContent = '🔇';
            audioLabel.textContent = 'Sonido: Off';
            btnAudio.classList.remove('audio-playing');
        }
    }

    btnAudio.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAudio();
    });

    // Iniciar audio suave al primer clic en cualquier parte de la pantalla (cumple políticas de navegadores)
    const firstInteractionHandler = () => {
        if (!aeroAudio.isAudioEnabled) {
            toggleAudio();
        }
        if (audioPrompt) audioPrompt.classList.add('hidden');
        window.removeEventListener('click', firstInteractionHandler);
    };
    window.addEventListener('click', firstInteractionHandler, { once: true });

    if (btnPromptOk) {
        btnPromptOk.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!aeroAudio.isAudioEnabled) toggleAudio();
            audioPrompt.classList.add('hidden');
        });
    }

    // Botón Nueva Oleada
    btnShuffle.addEventListener('click', () => {
        tilesManager.startWave();
    });

    // Botón Pantalla Completa
    btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            btnFullscreen.textContent = '🗗';
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            }
            btnFullscreen.textContent = '⛶';
        }
    });
});