// ============================================================================
// NEON RACER 90s ARCADE - ULTRA HIGH-PERFORMANCE PSEUDO-3D ENGINE
// Arquitectura Senior de Videojuegos Retro (HTML5 Canvas & JavaScript Puro)
// Inspirado en los clásicos de los 90: OutRun, Daytona USA y Ridge Racer
// ============================================================================

/**
 * 1. MOTOR DE AUDIO PROCEDURAL SINTETIZADO (Web Audio API)
 * Simulación en tiempo real de motor policilíndrico, caja de cambios arcade,
 * derrapes por filtrado pasa-banda y jingles estilo FM-Synth de los 90.
 */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem('neon_racer_muted') === 'true';
        this.engineOsc1 = null;
        this.engineOsc2 = null;
        this.engineGain = null;
        this.engineFilter = null;
        this.skidSource = null;
        this.skidGain = null;
        this.nitroOsc = null;
        this.nitroGain = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            this.setupEngineSound();
            this.setupSkidSound();
            this.setupNitroSound();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio no disponible en el navegador:', e);
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('neon_racer_muted', this.muted);
        if (this.engineGain && this.ctx) {
            this.engineGain.gain.setValueAtTime(this.muted ? 0 : 0.05, this.ctx.currentTime);
        }
        return !this.muted;
    }

    setupEngineSound() {
        if (!this.ctx) return;
        // Dos osciladores desfasados para generar armónicos ricos de motor deportivo
        this.engineOsc1 = this.ctx.createOscillator();
        this.engineOsc2 = this.ctx.createOscillator();
        this.engineOsc1.type = 'sawtooth';
        this.engineOsc2.type = 'triangle';

        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.setValueAtTime(380, this.ctx.currentTime);
        this.engineFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

        this.engineOsc1.connect(this.engineFilter);
        this.engineOsc2.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);

        this.engineOsc1.start();
        this.engineOsc2.start();
    }

    setupSkidSound() {
        if (!this.ctx) return;
        // Generador de ruido blanco procesado con filtro pasa-banda para chirrido de caucho
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1150, this.ctx.currentTime);
        filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

        this.skidGain = this.ctx.createGain();
        this.skidGain.gain.setValueAtTime(0, this.ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(this.skidGain);
        this.skidGain.connect(this.ctx.destination);
        whiteNoise.start();
    }

    setupNitroSound() {
        if (!this.ctx) return;
        this.nitroOsc = this.ctx.createOscillator();
        this.nitroOsc.type = 'sine';
        this.nitroOsc.frequency.setValueAtTime(190, this.ctx.currentTime);

        this.nitroGain = this.ctx.createGain();
        this.nitroGain.gain.setValueAtTime(0, this.ctx.currentTime);

        this.nitroOsc.connect(this.nitroGain);
        this.nitroGain.connect(this.ctx.destination);
        this.nitroOsc.start();
    }

    updateEngine(rpmRatio, isAccelerating, gear) {
        if (!this.ctx || this.muted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        // Modulación de frecuencia según RPM de marcha
        const baseFreq = (gear === 'LO' ? 55 : 45) + rpmRatio * (gear === 'LO' ? 140 : 185);
        const filterCutoff = 350 + rpmRatio * 550;
        const targetGain = (isAccelerating ? 0.07 : 0.035) + rpmRatio * 0.03;

        this.engineOsc1.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.04);
        this.engineOsc2.frequency.setTargetAtTime(baseFreq * 0.5, this.ctx.currentTime, 0.04);
        this.engineFilter.frequency.setTargetAtTime(filterCutoff, this.ctx.currentTime, 0.04);
        this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.04);
    }

    playGearShift() {
        if (!this.ctx || this.muted) return;
        // Pequeño corte de inyección / rev blip al cambiar de marcha
        const now = this.ctx.currentTime;
        this.engineGain.gain.setValueAtTime(0.01, now);
        this.engineGain.gain.exponentialRampToValueAtTime(0.07, now + 0.12);
    }

    setSkid(active, intensity = 1) {
        if (!this.ctx || this.muted) return;
        const target = active ? 0.07 * Math.min(1.2, intensity) : 0;
        this.skidGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.04);
    }

    setNitro(active) {
        if (!this.ctx || this.muted) return;
        const target = active ? 0.12 : 0;
        this.nitroGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.06);
        if (active && this.nitroOsc) {
            this.nitroOsc.frequency.setValueAtTime(260 + Math.random() * 120, this.ctx.currentTime);
        }
    }

    playCrash() {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(170, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.3);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playCheckpoint() {
        if (!this.ctx || this.muted) return;
        // Jingle clásico arcade de checkpoint (Acorde ascendente estilo FM)
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const now = this.ctx.currentTime;
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0.12, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.25);
        });
    }

    playVictory() {
        if (!this.ctx || this.muted) return;
        const notes = [392.00, 523.25, 659.25, 783.99, 1046.50];
        const now = this.ctx.currentTime;
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);

            gain.gain.setValueAtTime(0.1, now + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.35);
        });
    }
}

/**
 * 2. CONFIGURACIÓN DE LOS 5 NIVELES TEMÁTICOS (ARTE & ATMÓSFERA 90s)
 */
const TRACK_LEVELS = [
    {
        id: 1,
        name: "SUNSET HIGHWAY",
        sub: "Miami '88 • Palmeras & Atardecer Neón",
        length: 2200,
        timeLimit: 75,
        targetSpeed: 240,
        skyType: 'sunset',
        colors: {
            skyTop: '#160224',
            skyMid: '#740039',
            skyBot: '#e83e38',
            sun: '#ffe600',
            mountainFar: '#33021f',
            mountainNear: '#550734',
            roadEven: '#120d24',
            roadOdd: '#1a1333',
            rumbleEven: '#00f0ff',
            rumbleOdd: '#ff007f',
            lane: '#ffe600',
            grassEven: '#090515',
            grassOdd: '#0d081f'
        },
        trafficCount: 14,
        curveIntensity: 1.0,
        hillIntensity: 0.6,
        decorations: ['palm', 'billboard', 'neonPole'],
        weather: 'clear'
    },
    {
        id: 2,
        name: "CYBER METROPOLIS",
        sub: "Rascacielos iluminados & Tráfico nocturno",
        length: 2600,
        timeLimit: 80,
        targetSpeed: 260,
        skyType: 'city',
        colors: {
            skyTop: '#030510',
            skyMid: '#0a1226',
            skyBot: '#15223e',
            sun: '#00f0ff',
            mountainFar: '#0b1328',
            mountainNear: '#131e3d',
            roadEven: '#0f1422',
            roadOdd: '#171e33',
            rumbleEven: '#00f0ff',
            rumbleOdd: '#7000ff',
            lane: '#00f0ff',
            grassEven: '#05070f',
            grassOdd: '#070b17'
        },
        trafficCount: 18,
        curveIntensity: 1.6,
        hillIntensity: 0.8,
        decorations: ['building', 'cyberSign', 'neonPylon'],
        weather: 'clear'
    },
    {
        id: 3,
        name: "NEON CANYON",
        sub: "Montañas rusas, colinas y curvas ciegas",
        length: 2800,
        timeLimit: 85,
        targetSpeed: 270,
        skyType: 'canyon',
        colors: {
            skyTop: '#160202',
            skyMid: '#440909',
            skyBot: '#8c1414',
            sun: '#ff7700',
            mountainFar: '#2b0606',
            mountainNear: '#470b0b',
            roadEven: '#180d0d',
            roadOdd: '#221313',
            rumbleEven: '#ff5500',
            rumbleOdd: '#ffe600',
            lane: '#ffffff',
            grassEven: '#0d0404',
            grassOdd: '#140606'
        },
        trafficCount: 16,
        curveIntensity: 2.2,
        hillIntensity: 2.1,
        decorations: ['rock', 'cactus', 'canyonPylon'],
        weather: 'clear'
    },
    {
        id: 4,
        name: "TOKYO STORM",
        sub: "Lluvia nocturna, relámpagos & asfalto mojado",
        length: 2900,
        timeLimit: 90,
        targetSpeed: 280,
        skyType: 'storm',
        colors: {
            skyTop: '#020308',
            skyMid: '#0c0f20',
            skyBot: '#181d36',
            sun: '#4361ee',
            mountainFar: '#060812',
            mountainNear: '#0c1022',
            roadEven: '#0c121e',
            roadOdd: '#131b2a',
            rumbleEven: '#3a86ff',
            rumbleOdd: '#ff007f',
            lane: '#00f0ff',
            grassEven: '#03050a',
            grassOdd: '#060812'
        },
        trafficCount: 22,
        curveIntensity: 1.8,
        hillIntensity: 1.2,
        decorations: ['neonPole', 'building', 'cyberSign'],
        weather: 'rain'
    },
    {
        id: 5,
        name: "MATRIX OVERDRIVE",
        sub: "Cuadrícula virtual Tron a velocidad supersónica",
        length: 3300,
        timeLimit: 95,
        targetSpeed: 300,
        skyType: 'matrix',
        colors: {
            skyTop: '#000b07',
            skyMid: '#002216',
            skyBot: '#00422c',
            sun: '#00ff88',
            mountainFar: '#00140e',
            mountainNear: '#00261a',
            roadEven: '#02120c',
            roadOdd: '#041c12',
            rumbleEven: '#00ff88',
            rumbleOdd: '#00f0ff',
            lane: '#00ff88',
            grassEven: '#000704',
            grassOdd: '#000d08'
        },
        trafficCount: 25,
        curveIntensity: 2.7,
        hillIntensity: 1.5,
        decorations: ['matrixPylon', 'wirePyramid', 'laserArch'],
        weather: 'matrix'
    }
];

/**
 * 3. CLASE SEGMENTO DE PISTA PSEUDO-3D
 * Contiene coordenadas proyectadas, marcas de neumáticos persistentes y soporte de checkpoints.
 */
class RoadSegment {
    constructor(index) {
        this.index = index;
        this.p1 = { world: { x: 0, y: 0, z: 0 }, camera: { x: 0, y: 0, z: 0 }, screen: { x: 0, y: 0, w: 0, scale: 0 } };
        this.p2 = { world: { x: 0, y: 0, z: 0 }, camera: { x: 0, y: 0, z: 0 }, screen: { x: 0, y: 0, w: 0, scale: 0 } };
        this.curve = 0;
        this.sprites = [];
        this.cars = [];
        this.skidmarks = []; // Marcas de derrape fijas en el asfalto de este segmento
        this.color = null;
        this.clip = 0;
        this.isCheckpoint = false;
        this.isFinishLine = false;
        this.gateLabel = '';
    }
}

/**
 * 4. MOTOR PRINCIPAL DE JUEGO (GAME ENGINE 90s)
 */
class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.sound = new SoundEngine();

        // Game Loop desacoplado (Glenn Fiedler - Fix Your Timestep)
        this.fixedStep = 1 / 60; // Física a 60 Hz constantes
        this.lastTime = performance.now();
        this.accumulator = 0;

        // Proyección y Dimensiones
        this.width = 1280;
        this.height = 720;
        this.roadWidth = 2000;
        this.segmentLength = 200;
        this.rumbleLength = 3;
        this.trackLength = 0;
        this.lanes = 3;

        // Cámara con FOV Dinámico
        this.fieldOfView = 100;
        this.targetFOV = 100;
        this.cameraHeight = 1000;
        this.cameraDepth = 1 / Math.tan((this.fieldOfView / 2) * Math.PI / 180);
        this.drawDistance = 280;

        // Estado del Jugador
        this.playerX = 0;       // -1 = borde izq, 1 = borde der
        this.playerZ = 0;       // Distancia recorrida
        this.speed = 0;
        this.maxSpeed = 260;    // km/h base
        this.accel = 0.38;
        this.breaking = -0.75;
        this.decel = -0.16;
        this.offRoadDecel = -0.55;
        this.offRoadLimit = 85;
        this.centrifugal = 0.28;
        this.skySpeedFar = 0.0008;
        this.skySpeedNear = 0.0022;
        this.skyOffsetFar = 0;
        this.skyOffsetNear = 0;

        // Transmisión y Marchas Arcade
        this.gear = 'LO'; // 'LO' o 'HI'
        this.gearShiftThreshold = 145; // km/h

        // Sistema de Nitro
        this.nitro = 100;
        this.nitroMax = 100;
        this.isBoosting = false;
        this.nitroTopSpeed = 340;

        // Físicas de Derrape y Combos
        this.isDrifting = false;
        this.driftFactor = 0;
        this.driftScore = 0;
        this.driftMultiplier = 1.0;

        // Sacudida de Cámara
        this.shakeIntensity = 0;

        // Partículas y Efectos
        this.particles = [];
        this.speedLines = [];

        // Circuitos y Tráfico
        this.segments = [];
        this.cars = [];
        this.currentLevelIndex = 0;
        this.currentLevel = TRACK_LEVELS[0];

        // Progreso, Puntuación y Checkpoints
        this.timeLeft = 75;
        this.score = 0;
        this.overtakes = 0;
        this.topSpeedReached = 0;
        this.checkpointsReached = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.raceFinished = false;

        // Teclas
        this.keys = { up: false, down: false, left: false, right: false, nitro: false };

        // Relámpago para Tokyo Storm
        this.lightningTimer = 0;
        this.lightningFlash = 0;

        this.initControls();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.loop = this.loop.bind(this);
    }

    resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.floor(window.innerWidth * dpr);
        this.canvas.height = Math.floor(window.innerHeight * dpr);
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.updateCameraDepth();
    }

    updateCameraDepth() {
        this.cameraDepth = 1 / Math.tan((this.fieldOfView / 2) * Math.PI / 180);
    }

    initControls() {
        window.addEventListener('keydown', (e) => {
            this.sound.init();
            const k = e.key.toLowerCase();
            if (k === 'arrowup' || k === 'w') this.keys.up = true;
            if (k === 'arrowdown' || k === 's') this.keys.down = true;
            if (k === 'arrowleft' || k === 'a') this.keys.left = true;
            if (k === 'arrowright' || k === 'd') this.keys.right = true;
            if (k === ' ' || e.shiftKey) this.keys.nitro = true;
            if (k === 'escape' || k === 'p') this.togglePause();
        });

        window.addEventListener('keyup', (e) => {
            const k = e.key.toLowerCase();
            if (k === 'arrowup' || k === 'w') this.keys.up = false;
            if (k === 'arrowdown' || k === 's') this.keys.down = false;
            if (k === 'arrowleft' || k === 'a') this.keys.left = false;
            if (k === 'arrowright' || k === 'd') this.keys.right = false;
            if (k === ' ' || !e.shiftKey) this.keys.nitro = false;
        });

        const bindTouch = (id, keyName) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const onDown = (e) => {
                e.preventDefault();
                this.sound.init();
                this.keys[keyName] = true;
            };
            const onUp = (e) => {
                e.preventDefault();
                this.keys[keyName] = false;
            };
            btn.addEventListener('touchstart', onDown, { passive: false });
            btn.addEventListener('touchend', onUp, { passive: false });
            btn.addEventListener('touchcancel', onUp, { passive: false });
            btn.addEventListener('mousedown', onDown);
            btn.addEventListener('mouseup', onUp);
            btn.addEventListener('mouseleave', onUp);
        };

        bindTouch('leftBtn', 'left');
        bindTouch('rightBtn', 'right');
        bindTouch('upBtn', 'up');
        bindTouch('downBtn', 'down');
        bindTouch('nitroTouchBtn', 'nitro');
    }

    // --- CONSTRUCCIÓN DEL CIRCUITO CON CHECKPOINTS ---
    loadLevel(levelIndex) {
        this.currentLevelIndex = levelIndex;
        this.currentLevel = TRACK_LEVELS[levelIndex];
        this.buildTrack();
        this.resetRace();
    }

    buildTrack() {
        this.segments = [];
        const lvl = this.currentLevel;
        const totalSegments = lvl.length;

        const addStraight = (num) => {
            for (let i = 0; i < num; i++) this.addSegment(0, 0);
        };
        const addCurve = (num, curve, hill) => {
            for (let i = 0; i < num; i++) {
                const c = Math.sin((i / num) * Math.PI) * curve * lvl.curveIntensity;
                const h = Math.sin((i / num) * Math.PI) * hill * lvl.hillIntensity * 850;
                this.addSegment(c, h);
            }
        };

        addStraight(60);

        let segmentsBuilt = 60;
        while (segmentsBuilt < totalSegments - 120) {
            const pattern = Math.floor(Math.random() * 4);
            const len = 45 + Math.floor(Math.random() * 55);

            if (pattern === 0) {
                addStraight(len);
            } else if (pattern === 1) {
                const curve = (Math.random() > 0.5 ? 1 : -1) * (2.2 + Math.random() * 2.2);
                const hill = (Math.random() - 0.5) * 2.2;
                addCurve(len, curve, hill);
            } else if (pattern === 2) {
                const curve = (Math.random() > 0.5 ? 1 : -1) * 3.2;
                addCurve(len / 2, curve, 1.2);
                addCurve(len / 2, -curve, -1.2);
            } else {
                const hill = (Math.random() > 0.5 ? 2.0 : -2.0);
                addCurve(len, 0.6, hill);
            }
            segmentsBuilt += len;
        }

        addStraight(120);

        this.trackLength = this.segments.length * this.segmentLength;

        // Establecer Checkpoints (25%, 50%, 75%) y Meta (100%)
        const cpIndices = [
            Math.floor(this.segments.length * 0.25),
            Math.floor(this.segments.length * 0.50),
            Math.floor(this.segments.length * 0.75)
        ];
        cpIndices.forEach((idx, i) => {
            if (this.segments[idx]) {
                this.segments[idx].isCheckpoint = true;
                this.segments[idx].gateLabel = `CHECKPOINT ${i + 1}`;
                this.segments[idx].sprites.push({ type: 'checkpointGate', offset: 0 });
            }
        });

        // Meta al final
        const finishIdx = this.segments.length - 40;
        if (this.segments[finishIdx]) {
            this.segments[finishIdx].isFinishLine = true;
            this.segments[finishIdx].gateLabel = 'FINISH';
            this.segments[finishIdx].sprites.push({ type: 'finishGate', offset: 0 });
        }

        this.placeDecorations();
        this.generateTraffic();
    }

    addSegment(curve, y) {
        const n = this.segments.length;
        const segment = new RoadSegment(n);
        const lastY = n > 0 ? this.segments[n - 1].p2.world.y : 0;

        segment.p1.world.y = lastY;
        segment.p1.world.z = n * this.segmentLength;
        segment.p2.world.y = lastY + y;
        segment.p2.world.z = (n + 1) * this.segmentLength;
        segment.curve = curve;

        const isEven = Math.floor(n / this.rumbleLength) % 2 === 0;
        const c = this.currentLevel.colors;
        segment.color = {
            road: isEven ? c.roadEven : c.roadOdd,
            rumble: isEven ? c.rumbleEven : c.rumbleOdd,
            lane: isEven ? c.lane : null,
            grass: isEven ? c.grassEven : c.grassOdd
        };

        this.segments.push(segment);
    }

    placeDecorations() {
        const lvl = this.currentLevel;
        for (let n = 25; n < this.segments.length - 50; n += 5 + Math.floor(Math.random() * 8)) {
            const seg = this.segments[n];
            if (seg.isCheckpoint || seg.isFinishLine) continue;

            const side = Math.random() > 0.5 ? 1 : -1;
            const offset = (1.35 + Math.random() * 1.6) * side;
            const type = lvl.decorations[Math.floor(Math.random() * lvl.decorations.length)];
            seg.sprites.push({ type, offset });

            if (Math.random() > 0.65) {
                const altType = lvl.decorations[Math.floor(Math.random() * lvl.decorations.length)];
                seg.sprites.push({ type: altType, offset: -offset });
            }
        }
    }

    generateTraffic() {
        this.cars = [];
        const count = this.currentLevel.trafficCount;
        const carTypes = ['muscle', 'truck', 'gt', 'muscle'];
        const carColors = ['#ffcc00', '#00f0ff', '#ff007f', '#00ff66', '#ffffff', '#ff3300'];

        for (let i = 0; i < count; i++) {
            const type = carTypes[i % carTypes.length];
            const color = carColors[i % carColors.length];
            const offset = (Math.random() * 1.6) - 0.8;
            const z = 1200 + (i * (this.trackLength / count)) + Math.random() * 400;
            const speed = (type === 'truck' ? 100 : 130) + Math.random() * 80;

            this.cars.push({
                type: type,
                offset: offset,
                z: z,
                speed: speed,
                color: color,
                width: type === 'truck' ? 82 : 72,
                height: type === 'truck' ? 52 : 38,
                laneChangeTimer: 2 + Math.random() * 5,
                targetOffset: offset,
                overtaken: false
            });
        }
    }

    resetRace() {
        this.playerX = 0;
        this.playerZ = 0;
        this.speed = 0;
        this.gear = 'LO';
        this.nitro = 100;
        this.score = 0;
        this.overtakes = 0;
        this.topSpeedReached = 0;
        this.checkpointsReached = 0;
        this.driftScore = 0;
        this.driftMultiplier = 1.0;
        this.timeLeft = this.currentLevel.timeLimit;
        this.raceFinished = false;
        this.particles = [];
        this.speedLines = [];
        this.shakeIntensity = 0;
        this.fieldOfView = 100;
        this.targetFOV = 100;
        this.updateCameraDepth();

        // Limpiar marcas de derrape
        this.segments.forEach(s => s.skidmarks = []);

        this.showBanner("STAGE START!", 1200);
    }

    start() {
        this.sound.init();
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.accumulator = 0;
        requestAnimationFrame(this.loop);
    }

    stop() {
        this.isRunning = false;
    }

    togglePause() {
        if (!this.isRunning || this.raceFinished) return;
        this.isPaused = !this.isPaused;
        const modal = document.getElementById('pauseModal');
        if (modal) {
            if (this.isPaused) modal.classList.add('active');
            else modal.classList.remove('active');
        }
        if (!this.isPaused) {
            this.lastTime = performance.now();
            requestAnimationFrame(this.loop);
        }
    }

    // --- BUCLE DE JUEGO (GAME LOOP DESACOPLADO CON DELTA TIME) ---
    loop(currentTime) {
        if (!this.isRunning) return;

        if (!this.isPaused) {
            const frameTime = Math.min(0.1, (currentTime - this.lastTime) / 1000); // Clamped a 100ms
            this.lastTime = currentTime;
            this.accumulator += frameTime;

            // Simulación física a 60 Hz constantes
            while (this.accumulator >= this.fixedStep) {
                this.update(this.fixedStep);
                this.accumulator -= this.fixedStep;
            }

            this.render();
        }

        requestAnimationFrame(this.loop);
    }

    findSegment(z) {
        return this.segments[Math.floor(z / this.segmentLength) % this.segments.length];
    }

    // --- ACTUALIZACIÓN DE FÍSICAS Y JUGABILIDAD ARCADE ---
    update(dt) {
        // 1. Cronómetro
        this.timeLeft -= dt;
        if (this.timeLeft <= 0 && !this.raceFinished) {
            this.timeLeft = 0;
            this.gameOver();
            return;
        }

        const playerSegment = this.findSegment(this.playerZ);
        const speedPercent = this.speed / this.maxSpeed;

        // Comprobar Meta (Victoria)
        if (this.playerZ >= this.trackLength - 100 && !this.raceFinished) {
            this.raceFinished = true;
            this.victory();
            return;
        }

        // Comprobar Checkpoints
        if (playerSegment.isCheckpoint && !playerSegment.cleared) {
            playerSegment.cleared = true;
            this.checkpointsReached++;
            this.timeLeft += 25; // Tiempo añadido
            this.sound.playCheckpoint();
            this.showCheckpointAlert("+25s EXTENDED!");
        }

        // 2. Manejo de Nitro
        this.isBoosting = false;
        if (this.keys.nitro && this.nitro > 0 && this.speed > 70) {
            this.isBoosting = true;
            this.nitro = Math.max(0, this.nitro - 26 * dt);
            this.speed += this.accel * 2.3 * 180 * dt;
            this.sound.setNitro(true);
            this.shakeIntensity = Math.max(this.shakeIntensity, 3.5);

            // Llamas de nitro y chispas
            for (let i = 0; i < 3; i++) {
                this.particles.push({
                    x: this.width / 2 + (Math.random() - 0.5) * 32,
                    y: this.height - 35,
                    vx: (Math.random() - 0.5) * 7,
                    vy: 6 + Math.random() * 9,
                    color: Math.random() > 0.4 ? '#00f0ff' : '#ff007f',
                    life: 0.35,
                    size: 7 + Math.random() * 8
                });
            }
        } else {
            this.sound.setNitro(false);
            if (this.nitro < this.nitroMax) {
                this.nitro += 3.5 * dt;
            }
        }

        // 3. Transmisión Arcade y Marchas (LO / HI)
        const prevGear = this.gear;
        if (this.speed > this.gearShiftThreshold) {
            this.gear = 'HI';
        } else if (this.speed < this.gearShiftThreshold - 25) {
            this.gear = 'LO';
        }
        if (prevGear !== this.gear) {
            this.sound.playGearShift();
        }

        // 4. Aceleración, Frenado y Resistencia
        const effectiveMax = this.isBoosting ? this.nitroTopSpeed : this.maxSpeed;
        const gearAccelMultiplier = this.gear === 'LO' ? 1.35 : 1.0;

        if (this.keys.up) {
            this.speed += this.accel * gearAccelMultiplier * 135 * dt;
        } else if (this.keys.down) {
            this.speed += this.breaking * 180 * dt;
        } else {
            this.speed += this.decel * 110 * dt;
        }

        // Penalización por salirse del asfalto (|playerX| > 1.0)
        if (Math.abs(this.playerX) > 1.0) {
            if (this.speed > this.offRoadLimit) {
                this.speed += this.offRoadDecel * 160 * dt;
            }
            this.shakeIntensity = Math.max(this.shakeIntensity, 2.5);
            // Polvo lateral
            this.particles.push({
                x: this.width / 2 + (this.playerX > 0 ? 110 : -110),
                y: this.height - 30,
                vx: (Math.random() - 0.5) * 7,
                vy: -3 - Math.random() * 4,
                color: this.currentLevel.id === 3 ? '#ff5500' : '#888888',
                life: 0.3,
                size: 5 + Math.random() * 4
            });
        }

        this.speed = Math.max(0, Math.min(this.speed, effectiveMax));
        if (this.speed > this.topSpeedReached) this.topSpeedReached = Math.round(this.speed);

        // 5. Giro, Fuerza Centrífuga y Derrape (Drifting)
        const dx = dt * 2.0 * (this.speed / this.maxSpeed);
        if (this.keys.left) this.playerX -= dx;
        if (this.keys.right) this.playerX += dx;

        this.playerX -= dx * speedPercent * playerSegment.curve * this.centrifugal;

        // Detección de derrape intencional
        const tryingToDrift = this.keys.down && (this.keys.left || this.keys.right) && this.speed > 120;
        const sharpCurveDrift = Math.abs(playerSegment.curve) > 2.2 && this.speed > 200;
        this.isDrifting = tryingToDrift || sharpCurveDrift;

        if (this.isDrifting) {
            this.driftFactor = (this.keys.left ? -1 : 1) * 0.28;
            this.driftMultiplier = Math.min(5.0, this.driftMultiplier + dt * 1.5);
            this.driftScore += Math.round(200 * this.driftMultiplier * dt);
            this.nitro = Math.min(this.nitroMax, this.nitro + 16 * dt);
            this.sound.setSkid(true, this.driftMultiplier);

            // Depositar marcas de neumáticos en el segmento actual
            if (playerSegment.skidmarks.length < 8) {
                playerSegment.skidmarks.push({
                    offset: this.playerX + (this.driftFactor * 0.1),
                    alpha: 0.8
                });
            }

            // Humo denso de neumáticos
            for (let i = 0; i < 2; i++) {
                this.particles.push({
                    x: this.width / 2 + (this.driftFactor > 0 ? 55 : -55) + (Math.random() - 0.5) * 20,
                    y: this.height - 30,
                    vx: -this.driftFactor * 6 + (Math.random() - 0.5) * 4,
                    vy: -2 - Math.random() * 4,
                    color: 'rgba(255, 255, 255, 0.65)',
                    life: 0.45,
                    size: 8 + Math.random() * 10
                });
            }
            this.showDriftBadge(this.driftMultiplier);
        } else {
            this.sound.setSkid(false);
            this.driftFactor *= 0.82;
            if (this.driftScore > 0) {
                this.score += this.driftScore;
                this.driftScore = 0;
                this.driftMultiplier = 1.0;
                this.hideDriftBadge();
            }
        }

        this.playerX = Math.max(-2.2, Math.min(2.2, this.playerX));

        // 6. Avance de Posición y Parallax
        this.playerZ += (this.speed * 28) * dt;
        this.skyOffsetFar += playerSegment.curve * speedPercent * this.skySpeedFar;
        this.skyOffsetNear += playerSegment.curve * speedPercent * this.skySpeedNear;
        this.score += Math.round((this.speed / 10) * dt);

        // 7. FOV Dinámico (Efecto de velocidad)
        this.targetFOV = 100 + (this.speed / this.maxSpeed) * 14 + (this.isBoosting ? 22 : 0);
        this.fieldOfView += (this.targetFOV - this.fieldOfView) * 0.08;
        this.updateCameraDepth();

        // 8. Tráfico, Adelantamientos y Colisiones
        this.updateTraffic(dt);

        // 9. Partículas y Líneas de Velocidad
        this.updateParticles(dt);

        // 10. Audio del Motor
        const rpmRatio = (this.speed % 150) / 150;
        this.sound.updateEngine(rpmRatio, this.keys.up, this.gear);

        // 11. Relámpagos (Tokyo Storm)
        if (this.currentLevel.weather === 'rain') {
            this.lightningTimer -= dt;
            if (this.lightningTimer <= 0) {
                this.lightningFlash = 0.85;
                this.lightningTimer = 3.5 + Math.random() * 6;
            }
            if (this.lightningFlash > 0) {
                this.lightningFlash -= dt * 3.2;
            }
        }

        this.shakeIntensity *= 0.88;
        this.updateHUD();
    }

    updateTraffic(dt) {
        for (let car of this.cars) {
            car.z += (car.speed * 28) * dt;

            // Ciclo de envoltura de pista para los autos
            if (car.z > this.trackLength) {
                car.z -= this.trackLength;
                car.overtaken = false;
            }

            // Cambio de carril suave ocasional
            car.laneChangeTimer -= dt;
            if (car.laneChangeTimer <= 0) {
                car.targetOffset = (Math.random() * 1.6) - 0.8;
                car.laneChangeTimer = 2.5 + Math.random() * 4;
            }
            car.offset += (car.targetOffset - car.offset) * 0.04;

            // Si el rival se queda muy atrás del jugador, reciclarlo adelante
            if (car.z < this.playerZ - 1200) {
                car.z = this.playerZ + this.drawDistance * this.segmentLength * 0.85;
                car.offset = (Math.random() * 1.6) - 0.8;
                car.overtaken = false;
            }

            // DETECCIÓN DE CLOSE CALL (Adelantamiento al límite)
            const distZ = car.z - this.playerZ;
            if (distZ < 0 && distZ > -120 && !car.overtaken) {
                if (Math.abs(this.playerX - car.offset) < 0.85 && this.speed > 180) {
                    car.overtaken = true;
                    this.score += 250;
                    this.overtakes++;
                    this.nitro = Math.min(this.nitroMax, this.nitro + 18);
                    this.showCloseCall();
                }
            }

            // COLISIÓN CON EL JUGADOR
            if (Math.abs(distZ) < 170) {
                if (Math.abs(this.playerX - car.offset) < 0.62) {
                    this.sound.playCrash();
                    this.shakeIntensity = 14;
                    this.speed = Math.max(35, this.speed * 0.58);

                    const pushDir = this.playerX > car.offset ? 0.38 : -0.38;
                    this.playerX += pushDir;
                    car.offset -= pushDir * 0.5;

                    for (let i = 0; i < 22; i++) {
                        this.particles.push({
                            x: this.width / 2 + (this.playerX * 100),
                            y: this.height - 85,
                            vx: (Math.random() - 0.5) * 18,
                            vy: (Math.random() - 0.5) * 18,
                            color: Math.random() > 0.5 ? '#ffe600' : '#ff007f',
                            life: 0.5,
                            size: 3 + Math.random() * 4
                        });
                    }
                }
            }
        }
    }

    updateParticles(dt) {
        // Líneas de velocidad (Speed Lines) al superar 200 km/h o con Nitro
        if (this.speed > 205 || this.isBoosting) {
            const count = this.isBoosting ? 5 : 2;
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 80 + Math.random() * (this.width * 0.6);
                this.speedLines.push({
                    x: this.width / 2 + Math.cos(angle) * dist,
                    y: this.height * 0.5 + Math.sin(angle) * dist,
                    vx: Math.cos(angle) * (18 + Math.random() * 15),
                    vy: Math.sin(angle) * (18 + Math.random() * 15),
                    len: 30 + Math.random() * 50,
                    life: 0.25,
                    color: this.isBoosting ? 'rgba(0, 240, 255, 0.7)' : 'rgba(255, 255, 255, 0.5)'
                });
            }
        }

        // Lluvia si es Tokyo Storm
        if (this.currentLevel.weather === 'rain') {
            for (let i = 0; i < 6; i++) {
                this.particles.push({
                    x: Math.random() * this.width,
                    y: 0,
                    vx: -4 - Math.random() * 4,
                    vy: 22 + Math.random() * 15,
                    color: 'rgba(0, 240, 255, 0.4)',
                    life: 0.6,
                    size: 2,
                    isRain: true
                });
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        for (let i = this.speedLines.length - 1; i >= 0; i--) {
            const sl = this.speedLines[i];
            sl.x += sl.vx;
            sl.y += sl.vy;
            sl.life -= dt;
            if (sl.life <= 0) this.speedLines.splice(i, 1);
        }
    }

    // --- SISTEMA DE PROYECCIÓN MATEMÁTICA PSEUDO-3D ---
    project(p, cameraX, cameraY, cameraZ) {
        p.camera.x = (p.world.x || 0) - cameraX;
        p.camera.y = (p.world.y || 0) - cameraY;
        p.camera.z = (p.world.z || 0) - cameraZ;
        p.screen.scale = this.cameraDepth / p.camera.z;
        p.screen.x = Math.round((this.width / 2) + (p.screen.scale * p.camera.x * this.width / 2));
        p.screen.y = Math.round((this.height / 2) - (p.screen.scale * p.camera.y * this.height / 2));
        p.screen.w = Math.round((p.screen.scale * this.roadWidth * this.width / 2));
    }

    // --- RENDERIZADO VISUAL CON OCLUSIÓN Y WRAPPING CORREGIDO ---
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        ctx.save();
        if (this.shakeIntensity > 0.5) {
            const sx = (Math.random() - 0.5) * this.shakeIntensity;
            const sy = (Math.random() - 0.5) * this.shakeIntensity;
            ctx.translate(sx, sy);
        }

        // 1. Horizonte Parallax Multicapa
        this.renderSky(ctx);

        // 2. Proyección y Dibujado de Carretera
        const baseSegment = this.findSegment(this.playerZ);
        const baseIndex = baseSegment.index;
        const cameraX = this.playerX * this.roadWidth;
        const cameraY = this.cameraHeight + baseSegment.p1.world.y;
        const cameraZ = this.playerZ;

        let maxy = this.height;
        let x = 0;
        let dx = -(baseSegment.curve * (this.playerZ % this.segmentLength / this.segmentLength));

        // Pasada 1: Segmentos de asfalto (Atrás hacia adelante con Z-wrapping corregido)
        for (let n = 0; n < this.drawDistance; n++) {
            const segmentIndex = (baseIndex + n) % this.segments.length;
            const segment = this.segments[segmentIndex];
            const loopOffset = (baseIndex + n >= this.segments.length) ? this.trackLength : 0;
            segment.clip = maxy;

            this.project(segment.p1, cameraX - x, cameraY, cameraZ - loopOffset);
            x += dx;
            dx += segment.curve;
            this.project(segment.p2, cameraX - x, cameraY, cameraZ - loopOffset);

            if (segment.p1.camera.z <= this.cameraDepth || segment.p2.screen.y >= maxy) {
                continue;
            }

            this.renderSegment(ctx, segment);
            maxy = segment.p2.screen.y;
        }

        // Pasada 2: Objetos, Decoraciones y Autos de adelante hacia atrás con clipping estricto
        for (let n = this.drawDistance - 1; n > 0; n--) {
            const segmentIndex = (baseIndex + n) % this.segments.length;
            const segment = this.segments[segmentIndex];

            // Decoraciones y Arcos de Meta/Checkpoint
            for (let sprite of segment.sprites) {
                this.renderSprite(ctx, segment, sprite);
            }

            // Autos Rivales
            for (let car of this.cars) {
                if (Math.floor(car.z / this.segmentLength) === segment.index) {
                    this.renderCar(ctx, segment, car);
                }
            }
        }

        // 3. Líneas de Velocidad Radiales
        this.renderSpeedLines(ctx);

        // 4. Auto del Jugador (Superdeportivo 90s)
        this.renderPlayer(ctx);

        // 5. Partículas (Fuego, humo, lluvia)
        this.renderParticles(ctx);

        // 6. Relámpago ambiental
        if (this.lightningFlash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash * 0.45})`;
            ctx.fillRect(0, 0, this.width, this.height);
        }

        ctx.restore();
    }

    renderSky(ctx) {
        const lvl = this.currentLevel;
        const c = lvl.colors;
        const horizonY = this.height * 0.5;

        // Gradiente de 4 paradas
        const grad = ctx.createLinearGradient(0, 0, 0, horizonY);
        grad.addColorStop(0, c.skyTop);
        grad.addColorStop(0.5, c.skyMid);
        grad.addColorStop(1, c.skyBot);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, horizonY);

        // Sol / Luna Retro 90s con Halo
        const sunX = this.width * 0.5 - (this.skyOffsetFar * 800 % this.width);
        const sunRadius = Math.min(this.width, this.height) * 0.14;

        ctx.save();
        const sunGrad = ctx.createLinearGradient(sunX, horizonY - sunRadius * 2, sunX, horizonY);
        sunGrad.addColorStop(0, c.sun);
        sunGrad.addColorStop(0.6, '#ff007f');
        sunGrad.addColorStop(1, c.skyBot);
        ctx.fillStyle = sunGrad;
        ctx.shadowColor = c.sun;
        ctx.shadowBlur = 35;

        ctx.beginPath();
        ctx.arc(sunX, horizonY - sunRadius * 0.6, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // Líneas horizontales retro cortadas
        ctx.fillStyle = c.skyMid;
        for (let i = 0; i < 6; i++) {
            const lineY = horizonY - sunRadius * 0.8 + (i * 11);
            const lineH = 2 + i * 1.6;
            ctx.fillRect(sunX - sunRadius, lineY, sunRadius * 2, lineH);
        }
        ctx.restore();

        // Capa Parallax 1: Montañas Lejanas
        ctx.fillStyle = c.mountainFar;
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        const offsetFar = (this.skyOffsetFar * 1600) % 240;
        for (let x = -240; x < this.width + 240; x += 120) {
            const peakH = 45 + Math.sin((x + offsetFar) * 0.015) * 40;
            ctx.lineTo(x - offsetFar, horizonY - peakH);
        }
        ctx.lineTo(this.width, horizonY);
        ctx.closePath();
        ctx.fill();

        // Capa Parallax 2: Silueta Cercana (Rascacielos / Colinas)
        ctx.fillStyle = c.mountainNear;
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        const offsetNear = (this.skyOffsetNear * 2400) % 180;
        for (let x = -180; x < this.width + 180; x += 90) {
            const peakH = 25 + Math.sin((x + offsetNear) * 0.03) * 22;
            ctx.lineTo(x - offsetNear, horizonY - peakH);
        }
        ctx.lineTo(this.width, horizonY);
        ctx.closePath();
        ctx.fill();
    }

    renderSegment(ctx, segment) {
        const p1 = segment.p1.screen;
        const p2 = segment.p2.screen;

        // Terreno Exterior
        ctx.fillStyle = segment.color.grass;
        ctx.fillRect(0, p2.y, this.width, p1.y - p2.y);

        // Bordillo (Rumble Strip)
        const r1 = p1.w / Math.max(6, 2 * this.lanes);
        const r2 = p2.w / Math.max(6, 2 * this.lanes);
        this.drawPolygon(ctx, p1.x - p1.w - r1, p1.y, p1.x - p1.w, p1.y, p2.x - p2.w, p2.y, p2.x - p2.w - r2, p2.y, segment.color.rumble);
        this.drawPolygon(ctx, p1.x + p1.w + r1, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x + p2.w + r2, p2.y, segment.color.rumble);

        // Asfalto
        this.drawPolygon(ctx, p1.x - p1.w, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x - p2.w, p2.y, segment.color.road);

        // Líneas divisoras
        if (segment.color.lane) {
            const l1 = p1.w / 32;
            const l2 = p2.w / 32;
            for (let lane = 1; lane < this.lanes; lane++) {
                const laneX1 = p1.x - p1.w + (p1.w * 2 / this.lanes) * lane;
                const laneX2 = p2.x - p2.w + (p2.w * 2 / this.lanes) * lane;
                this.drawPolygon(ctx, laneX1 - l1, p1.y, laneX1 + l1, p1.y, laneX2 + l2, p2.y, laneX2 - l2, p2.y, segment.color.lane);
            }
        }

        // Marcas de Derrape en el Asfalto (Tire Skid Marks fijas en el segmento)
        if (segment.skidmarks.length > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            for (let mark of segment.skidmarks) {
                const mx1 = p1.x + (mark.offset * p1.w);
                const mx2 = p2.x + (mark.offset * p2.w);
                const mw1 = Math.max(2, p1.w * 0.05);
                const mw2 = Math.max(2, p2.w * 0.05);
                this.drawPolygon(ctx, mx1 - mw1, p1.y, mx1 + mw1, p1.y, mx2 + mw2, p2.y, mx2 - mw2, p2.y, 'rgba(10, 10, 15, 0.5)');
            }
        }
    }

    drawPolygon(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);
        ctx.closePath();
        ctx.fill();
    }

    // --- RENDERIZADO DE SPRITES LATERALES Y ARCOS DE CHECKPOINT ---
    renderSprite(ctx, segment, sprite) {
        const p = segment.p1.screen;
        const scale = p.scale;
        const spriteX = p.x + (scale * sprite.offset * this.roadWidth * this.width / 2);
        const spriteY = p.y;

        // Oclusión estricta de colinas
        if (spriteY > segment.clip) return;

        const size = Math.round(scale * 1200);
        if (size < 4) return;

        ctx.save();
        ctx.translate(spriteX, spriteY);

        if (sprite.type === 'checkpointGate' || sprite.type === 'finishGate') {
            // Arco elevado de Checkpoint o Meta
            const gw = p.w * 2.3;
            const gh = size * 1.5;
            ctx.fillStyle = '#11172a';
            ctx.fillRect(-gw / 2, -gh, 14, gh); // Poste izquierdo
            ctx.fillRect(gw / 2 - 14, -gh, 14, gh); // Poste derecho

            // Viga transversal
            ctx.fillStyle = '#060a17';
            ctx.fillRect(-gw / 2, -gh, gw, size * 0.45);

            // Letrero Neón
            ctx.strokeStyle = sprite.type === 'finishGate' ? '#00ff88' : '#ffe600';
            ctx.lineWidth = 3;
            ctx.strokeRect(-gw / 2 + 10, -gh + 5, gw - 20, size * 0.45 - 10);

            ctx.font = `bold ${Math.max(10, Math.round(size * 0.22))}px Orbitron, sans-serif`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(segment.gateLabel, 0, -gh + size * 0.22);
        } else if (sprite.type === 'palm') {
            ctx.strokeStyle = '#ff007f';
            ctx.lineWidth = Math.max(2, size * 0.04);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(size * 0.1, -size * 0.6, size * 0.05, -size);
            ctx.stroke();

            ctx.fillStyle = '#00ff88';
            for (let a = 0; a < 6; a++) {
                ctx.beginPath();
                ctx.arc(size * 0.05 + Math.cos(a) * size * 0.35, -size + Math.sin(a) * size * 0.18, size * 0.15, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (sprite.type === 'building') {
            const bw = size * 0.65;
            const bh = size * 1.7;
            ctx.fillStyle = '#080d1a';
            ctx.fillRect(-bw / 2, -bh, bw, bh);
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = Math.max(1, size * 0.02);
            ctx.strokeRect(-bw / 2, -bh, bw, bh);

            ctx.fillStyle = Math.sin(segment.index) > 0 ? '#ffe600' : '#ff007f';
            for (let wy = -bh + 12; wy < -12; wy += size * 0.2) {
                ctx.fillRect(-bw / 2 + size * 0.1, wy, size * 0.13, size * 0.08);
                ctx.fillRect(bw / 2 - size * 0.23, wy, size * 0.13, size * 0.08);
            }
        } else if (sprite.type === 'neonPole') {
            const ph = size * 1.25;
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = Math.max(2, size * 0.03);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -ph);
            ctx.lineTo(size * 0.35, -ph);
            ctx.stroke();

            ctx.fillStyle = '#ffe600';
            ctx.shadowColor = '#ffe600';
            ctx.shadowBlur = 12;
            ctx.fillRect(size * 0.25, -ph - size * 0.05, size * 0.15, size * 0.1);
        } else if (sprite.type === 'rock') {
            ctx.fillStyle = '#661414';
            ctx.strokeStyle = '#ff5500';
            ctx.lineWidth = Math.max(1, size * 0.02);
            ctx.beginPath();
            ctx.moveTo(-size * 0.35, 0);
            ctx.lineTo(-size * 0.25, -size * 0.55);
            ctx.lineTo(size * 0.1, -size * 0.75);
            ctx.lineTo(size * 0.4, -size * 0.2);
            ctx.lineTo(size * 0.35, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = Math.max(1, size * 0.03);
            ctx.strokeRect(-size * 0.15, -size, size * 0.3, size);
            ctx.fillStyle = 'rgba(0, 255, 136, 0.25)';
            ctx.fillRect(-size * 0.15, -size, size * 0.3, size);
        }

        ctx.restore();
    }

    // --- RENDERIZADO DE LOS 4 MODELOS DE AUTOS RIVALES ---
    renderCar(ctx, segment, car) {
        const p = segment.p1.screen;
        const scale = p.scale;
        const carX = p.x + (scale * car.offset * this.roadWidth * this.width / 2);
        const carY = p.y;

        if (carY > segment.clip) return;

        const w = Math.round(scale * car.width * this.width * 0.65);
        const h = Math.round(scale * car.height * this.height * 0.65);
        if (w < 4) return;

        ctx.save();
        ctx.translate(carX, carY);

        // Sombra de asfalto
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(-w * 0.55, -h * 0.1, w * 1.1, h * 0.2);

        if (car.type === 'truck') {
            // Camión Pesado / Trailer 90s
            ctx.fillStyle = '#1c2541';
            ctx.fillRect(-w * 0.5, -h * 0.95, w, h * 0.9);
            ctx.strokeStyle = car.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(-w * 0.5, -h * 0.95, w, h * 0.9);

            // Luces de techo de camión
            ctx.fillStyle = '#ffe600';
            ctx.fillRect(-w * 0.4, -h * 0.92, w * 0.15, h * 0.08);
            ctx.fillRect(w * 0.25, -h * 0.92, w * 0.15, h * 0.08);

            // Luces traseras inferiores
            ctx.fillStyle = '#ff1e38';
            ctx.fillRect(-w * 0.45, -h * 0.25, w * 0.2, h * 0.15);
            ctx.fillRect(w * 0.25, -h * 0.25, w * 0.2, h * 0.15);
        } else if (car.type === 'gt') {
            // Bólido GT con alerón ancho
            ctx.fillStyle = car.color;
            ctx.beginPath();
            ctx.moveTo(-w * 0.46, 0);
            ctx.lineTo(-w * 0.5, -h * 0.45);
            ctx.lineTo(-w * 0.35, -h * 0.88);
            ctx.lineTo(w * 0.35, -h * 0.88);
            ctx.lineTo(w * 0.5, -h * 0.45);
            ctx.lineTo(w * 0.46, 0);
            ctx.closePath();
            ctx.fill();

            // Alerón alto GT
            ctx.fillStyle = '#060a17';
            ctx.fillRect(-w * 0.56, -h * 1.1, w * 1.12, h * 0.15);
            ctx.fillStyle = '#ff0033';
            ctx.fillRect(-w * 0.4, -h * 0.5, w * 0.2, h * 0.14);
            ctx.fillRect(w * 0.2, -h * 0.5, w * 0.2, h * 0.14);
        } else {
            // Muscle Coupe 90s
            ctx.fillStyle = car.color;
            ctx.beginPath();
            ctx.moveTo(-w * 0.45, 0);
            ctx.lineTo(-w * 0.48, -h * 0.4);
            ctx.lineTo(-w * 0.32, -h * 0.82);
            ctx.lineTo(w * 0.32, -h * 0.82);
            ctx.lineTo(w * 0.48, -h * 0.4);
            ctx.lineTo(w * 0.45, 0);
            ctx.closePath();
            ctx.fill();

            // Doble franja deportiva
            ctx.fillStyle = '#05070e';
            ctx.fillRect(-w * 0.1, -h * 0.82, w * 0.2, h * 0.82);

            // Faros traseros gemelos redondos
            ctx.fillStyle = '#ff0033';
            ctx.beginPath();
            ctx.arc(-w * 0.3, -h * 0.4, h * 0.12, 0, Math.PI * 2);
            ctx.arc(w * 0.3, -h * 0.4, h * 0.12, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // --- RENDERIZADO DEL AUTO DEL JUGADOR (SUPERDEPORTIVO 90s) ---
    renderPlayer(ctx) {
        const carW = Math.min(this.width * 0.34, 290);
        const carH = carW * 0.53;
        const carX = this.width / 2 + (this.driftFactor * 40);
        const carY = this.height - 22;

        ctx.save();
        ctx.translate(carX, carY);

        const steerAngle = (this.keys.left ? -0.065 : this.keys.right ? 0.065 : 0) + this.driftFactor * 0.28;
        ctx.rotate(steerAngle);

        // Sombra de asfalto
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.beginPath();
        ctx.ellipse(0, 0, carW * 0.56, carH * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 1. Chasis Wedge (Ferrari Testarossa / Lamborghini Diablo style)
        const bodyGrad = ctx.createLinearGradient(0, -carH, 0, 0);
        bodyGrad.addColorStop(0, '#ff0055');
        bodyGrad.addColorStop(0.55, '#d60047');
        bodyGrad.addColorStop(1, '#7a0026');
        ctx.fillStyle = bodyGrad;

        ctx.beginPath();
        ctx.moveTo(-carW * 0.48, 0);
        ctx.lineTo(-carW * 0.53, -carH * 0.36);
        ctx.lineTo(-carW * 0.44, -carH * 0.58);
        ctx.lineTo(-carW * 0.32, -carH * 0.9);
        ctx.lineTo(carW * 0.32, -carH * 0.9);
        ctx.lineTo(carW * 0.44, -carH * 0.58);
        ctx.lineTo(carW * 0.53, -carH * 0.36);
        ctx.lineTo(carW * 0.48, 0);
        ctx.closePath();
        ctx.fill();

        // Contorno Neón
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 2. Luneta Trasera y Ranuras (Louver)
        ctx.fillStyle = '#060a17';
        ctx.fillRect(-carW * 0.28, -carH * 0.84, carW * 0.56, carH * 0.3);
        ctx.fillStyle = '#162038';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(-carW * 0.27, -carH * 0.82 + (i * carH * 0.075), carW * 0.54, carH * 0.025);
        }

        // 3. Alerón Aerodinámico
        ctx.fillStyle = '#05070e';
        ctx.fillRect(-carW * 0.53, -carH * 0.98, carW * 1.06, carH * 0.1);
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(-carW * 0.55, -carH * 1.04, carW * 0.08, carH * 0.16);
        ctx.fillRect(carW * 0.47, -carH * 1.04, carW * 0.08, carH * 0.16);

        // 4. Luces Traseras Neón
        const brakeOn = this.keys.down;
        ctx.fillStyle = brakeOn ? '#ffffff' : '#ff0044';
        ctx.shadowColor = '#ff0044';
        ctx.shadowBlur = brakeOn ? 25 : 12;
        ctx.fillRect(-carW * 0.44, -carH * 0.5, carW * 0.34, carH * 0.14);
        ctx.fillRect(carW * 0.1, -carH * 0.5, carW * 0.34, carH * 0.14);
        ctx.shadowBlur = 0;

        // 5. Escapes y Llamas de Aceleración / Nitro
        ctx.fillStyle = '#1a1f33';
        ctx.fillRect(-carW * 0.3, -carH * 0.12, carW * 0.14, carH * 0.1);
        ctx.fillRect(carW * 0.16, -carH * 0.12, carW * 0.14, carH * 0.1);

        if (this.keys.up || this.isBoosting) {
            const flameLen = (this.isBoosting ? 32 : 14) + Math.random() * 8;
            ctx.fillStyle = this.isBoosting ? '#00f0ff' : '#ffe600';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 15;

            ctx.beginPath();
            ctx.moveTo(-carW * 0.28, -carH * 0.06);
            ctx.lineTo(-carW * 0.23, flameLen);
            ctx.lineTo(-carW * 0.18, -carH * 0.06);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(carW * 0.18, -carH * 0.06);
            ctx.lineTo(carW * 0.23, flameLen);
            ctx.lineTo(carW * 0.28, -carH * 0.06);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // 6. Ruedas Anchas con Llantas
        ctx.fillStyle = '#05070e';
        ctx.fillRect(-carW * 0.53, -carH * 0.32, carW * 0.14, carH * 0.32);
        ctx.fillRect(carW * 0.39, -carH * 0.32, carW * 0.14, carH * 0.32);

        ctx.restore();
    }

    renderSpeedLines(ctx) {
        for (let sl of this.speedLines) {
            ctx.strokeStyle = sl.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sl.x, sl.y);
            ctx.lineTo(sl.x + sl.vx * (sl.len / 20), sl.y + sl.vy * (sl.len / 20));
            ctx.stroke();
        }
    }

    renderParticles(ctx) {
        for (let p of this.particles) {
            ctx.fillStyle = p.color;
            if (p.isRain) {
                ctx.fillRect(p.x, p.y, p.size, p.size * 5);
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // --- HUD Y NOTIFICACIONES ARCADE ---
    updateHUD() {
        const speedKmh = Math.floor(this.speed);
        const speedEl = document.getElementById('speedDisplay');
        if (speedEl) speedEl.textContent = String(speedKmh).padStart(3, '0');

        // Indicador de Marcha (LO / HI)
        const gearEl = document.getElementById('gearDisplay');
        if (gearEl) {
            gearEl.textContent = this.gear;
            if (this.gear === 'LO') {
                gearEl.className = 'gear-chip low';
            } else {
                gearEl.className = speedKmh > 240 ? 'gear-chip redline' : 'gear-chip';
            }
        }

        // Barra RPM
        const rpmBar = document.getElementById('rpmBar');
        if (rpmBar) {
            const rpmRatio = (this.speed % 150) / 150;
            rpmBar.style.width = `${Math.min(100, Math.max(5, rpmRatio * 100))}%`;
        }

        // Barra Nitro
        const nitroBar = document.getElementById('nitroBar');
        const nitroLabel = document.getElementById('nitroLabel');
        if (nitroBar) nitroBar.style.width = `${this.nitro}%`;
        if (nitroLabel) nitroLabel.textContent = this.nitro > 25 ? 'READY' : 'LOW';

        // Timer
        const timerEl = document.getElementById('timerDisplay');
        if (timerEl) {
            const mins = Math.floor(this.timeLeft / 60);
            const secs = Math.floor(this.timeLeft % 60);
            const ms = Math.floor((this.timeLeft % 1) * 10);
            timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
        }

        // Score
        const scoreEl = document.getElementById('scoreDisplay');
        if (scoreEl) scoreEl.textContent = String(this.score).padStart(5, '0');

        // Posición
        const posEl = document.getElementById('posDisplay');
        if (posEl) {
            const ahead = this.cars.filter(c => c.z > this.playerZ).length;
            posEl.innerHTML = `${ahead + 1}<span class="pos-total">/${this.cars.length + 1}</span>`;
        }

        // Minimapa de Progreso
        const progressPercent = Math.min(100, Math.max(0, (this.playerZ / this.trackLength) * 100));
        const progressFill = document.getElementById('trackProgressFill');
        const playerPin = document.getElementById('playerPin');
        if (progressFill) progressFill.style.height = `${progressPercent}%`;
        if (playerPin) playerPin.style.bottom = `${progressPercent}%`;
    }

    showBanner(text, duration = 1500) {
        const banner = document.getElementById('arcadeBanner');
        const bannerText = document.getElementById('bannerText');
        if (!banner || !bannerText) return;
        bannerText.textContent = text;
        banner.classList.add('show');
        setTimeout(() => banner.classList.remove('show'), duration);
    }

    showCheckpointAlert(text) {
        const el = document.getElementById('checkpointPopup');
        const txt = document.getElementById('checkpointText');
        if (!el || !txt) return;
        txt.textContent = text;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 1800);
    }

    showCloseCall() {
        const el = document.getElementById('closeCallPopup');
        if (!el) return;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 1200);
    }

    showDriftBadge(multiplier) {
        const el = document.getElementById('driftBadge');
        const txt = document.getElementById('driftText');
        if (!el || !txt) return;
        txt.textContent = `x${multiplier.toFixed(1)}`;
        el.classList.add('show');
    }

    hideDriftBadge() {
        const el = document.getElementById('driftBadge');
        if (el) el.classList.remove('show');
    }

    // --- FIN DE CARRERA (VICTORIA / DERROTA) ---
    victory() {
        this.sound.playVictory();
        this.isRunning = false;

        const timeSpent = this.currentLevel.timeLimit - this.timeLeft;
        const mins = Math.floor(timeSpent / 60);
        const secs = Math.floor(timeSpent % 60);
        const ms = Math.floor((timeSpent % 1) * 10);
        const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;

        const bestKey = `neon_racer_best_lvl_${this.currentLevel.id}`;
        const prevBest = localStorage.getItem(bestKey);
        if (!prevBest || timeSpent < parseFloat(prevBest)) {
            localStorage.setItem(bestKey, timeSpent);
        }

        const token = localStorage.getItem('nexus_token');
        if (token) {
            fetch('http://localhost:5000/api/games/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    gameId: 'neon_racer',
                    score: this.score,
                    level: this.currentLevelIndex + 1,
                    time_seconds: Math.round(timeSpent)
                })
            }).catch(() => {});
        }

        const ahead = this.cars.filter(c => c.z > this.playerZ).length;
        document.getElementById('victoryLevelName').textContent = `${this.currentLevel.name} COMPLETADO`;
        document.getElementById('vicFinalTime').textContent = timeFormatted;
        document.getElementById('vicFinalPos').textContent = `${ahead + 1}º`;
        document.getElementById('vicTopSpeed').textContent = `${this.topSpeedReached} KM/H`;
        document.getElementById('vicFinalScore').textContent = this.score.toLocaleString();

        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('victoryScreen').classList.add('active');
    }

    gameOver() {
        this.isRunning = false;
        const progressPercent = Math.round((this.playerZ / this.trackLength) * 100);
        document.getElementById('goDistance').textContent = `${progressPercent}%`;
        document.getElementById('goFinalScore').textContent = this.score.toLocaleString();

        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('gameOverScreen').classList.add('active');
    }
}

/**
 * 5. CONTROLADOR DE INTERFAZ DE USUARIO (UI CONTROLLER)
 */
class UIController {
    constructor(engine) {
        this.engine = engine;
        this.mainScreen = document.getElementById('mainScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.victoryScreen = document.getElementById('victoryScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.pauseModal = document.getElementById('pauseModal');

        this.initEventListeners();
        this.updateLevelPreviews();
    }

    initEventListeners() {
        // Selector de 5 Niveles
        const cards = document.querySelectorAll('.level-card');
        cards.forEach((card) => {
            card.addEventListener('click', () => {
                cards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                const lvlId = parseInt(card.dataset.level) - 1;
                this.engine.loadLevel(lvlId);
            });
        });

        // Botón Start
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });

        // Toggle Sonido en Menú y Juego
        const setupSoundBtn = (btnId) => {
            const btn = document.getElementById(btnId);
            if (!btn) return;
            btn.addEventListener('click', () => {
                const unmuted = this.engine.sound.toggleMute();
                document.getElementById('audioToggleMenu').textContent = unmuted ? '🔊 SONIDO: ON' : '🔇 SONIDO: OFF';
                document.getElementById('audioToggleGame').textContent = unmuted ? '🔊' : '🔇';
            });
        };
        setupSoundBtn('audioToggleMenu');
        setupSoundBtn('audioToggleGame');

        // Botones de Pausa
        document.getElementById('pauseBtn').addEventListener('click', () => this.engine.togglePause());
        document.getElementById('resumeBtn').addEventListener('click', () => this.engine.togglePause());
        document.getElementById('restartPauseBtn').addEventListener('click', () => {
            this.engine.togglePause();
            this.startGame();
        });
        document.getElementById('quitBtn').addEventListener('click', () => {
            this.engine.togglePause();
            this.goToMenu();
        });

        // Pantalla de Victoria
        document.getElementById('nextLevelBtn').addEventListener('click', () => {
            this.victoryScreen.classList.remove('active');
            let nextIndex = (this.engine.currentLevelIndex + 1) % TRACK_LEVELS.length;
            this.selectLevel(nextIndex);
            this.startGame();
        });
        document.getElementById('vicReplayBtn').addEventListener('click', () => {
            this.victoryScreen.classList.remove('active');
            this.startGame();
        });
        document.getElementById('vicMenuBtn').addEventListener('click', () => {
            this.victoryScreen.classList.remove('active');
            this.goToMenu();
        });

        // Pantalla de Game Over
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.gameOverScreen.classList.remove('active');
            this.startGame();
        });
        document.getElementById('goMenuBtn').addEventListener('click', () => {
            this.gameOverScreen.classList.remove('active');
            this.goToMenu();
        });
    }

    selectLevel(index) {
        const cards = document.querySelectorAll('.level-card');
        cards.forEach((card, idx) => {
            if (idx === index) card.classList.add('active');
            else card.classList.remove('active');
        });
        this.engine.loadLevel(index);
    }

    startGame() {
        this.mainScreen.classList.remove('active');
        this.victoryScreen.classList.remove('active');
        this.gameOverScreen.classList.remove('active');
        this.gameScreen.classList.add('active');

        document.getElementById('stageNameDisplay').textContent = this.engine.currentLevel.name;
        this.engine.loadLevel(this.engine.currentLevelIndex);
        this.engine.start();
    }

    goToMenu() {
        this.engine.stop();
        this.gameScreen.classList.remove('active');
        this.victoryScreen.classList.remove('active');
        this.gameOverScreen.classList.remove('active');
        this.mainScreen.classList.add('active');
        this.updateLevelPreviews();
    }

    updateLevelPreviews() {
        for (let i = 1; i <= 5; i++) {
            const bestTime = localStorage.getItem(`neon_racer_best_lvl_${i}`);
            const el = document.getElementById(`bestTime${i}`);
            if (el) {
                if (bestTime) {
                    const t = parseFloat(bestTime);
                    const mins = Math.floor(t / 60);
                    const secs = Math.floor(t % 60);
                    el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                } else {
                    el.textContent = '--:--';
                }
            }
        }
    }
}

/**
 * 6. INICIALIZACIÓN GLOBAL
 */
let engine;
let ui;
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    engine = new GameEngine(canvas);
    engine.loadLevel(0);
    ui = new UIController(engine);
});

