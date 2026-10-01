/* ════════════════════════════════════════════════════════════
   NEXUS_OS // ARCADE AUDIO ENGINE 70s & 80s (Web Audio API)
   Sintetizador de sonido arcade vintage:
   - "Insert Coin" clásico de salón arcade 80s
   - Microswitch de palanca/botón arcade
   - Escaneo holográfico de análisis de specs
   - Zumbido CRT y Chiptune jingles
   ════════════════════════════════════════════════════════════ */

const NexusAudio = (function () {
    'use strict';

    let audioCtx = null;
    let enabled = true;
    let initialized = false;

    function init() {
        if (initialized) return;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            initialized = true;
        } catch (e) {
            console.warn('[NEXUS_AUDIO] Web Audio API no soportado');
        }
    }

    function ensureContext() {
        if (!audioCtx) init();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx && enabled;
    }

    function now() { return audioCtx.currentTime; }

    function createGain(value = 1) {
        const g = audioCtx.createGain();
        g.gain.value = value;
        return g;
    }

    function createOsc(type, freq) {
        const osc = audioCtx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        return osc;
    }

    // ═══ 1. INSERT COIN (Clásico sonido de salón recreativo 80s) ═══
    function insertCoin() {
        if (!ensureContext()) return;
        const t = now();

        // Primer tono agudo rápido
        const osc1 = createOsc('square', 987.77); // B5
        const gain1 = createGain(0.12);
        gain1.gain.setValueAtTime(0.12, t);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc1.connect(gain1).connect(audioCtx.destination);
        osc1.start(t);
        osc1.stop(t + 0.08);

        // Segundo tono triunfal más agudo (E6)
        const osc2 = createOsc('square', 1318.51); // E6
        const gain2 = createGain(0.16);
        gain2.gain.setValueAtTime(0.16, t + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc2.connect(gain2).connect(audioCtx.destination);
        osc2.start(t + 0.08);
        osc2.stop(t + 0.35);
    }

    // ═══ 2. BOTÓN ARCADE MICROSWITCH (Click físico de máquina recreativa) ═══
    function buttonClick() {
        if (!ensureContext()) return;
        const t = now();

        // Ruido de impacto mecánico
        const dur = 0.04;
        const bufferSize = audioCtx.sampleRate * dur;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2800;

        const gain = createGain(0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        noise.connect(filter).connect(gain).connect(audioCtx.destination);
        noise.start(t);
        noise.stop(t + dur);

        // Pulso sonoro de baja frecuencia (rebote de chasis)
        const osc = createOsc('triangle', 380);
        const og = createGain(0.08);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        osc.connect(og).connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.03);
    }

    // ═══ 3. HOVER / BLIP DE MENÚ 80s ═══
    function hover() {
        if (!ensureContext()) return;
        const t = now();

        const osc = createOsc('triangle', 440);
        const gain = createGain(0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.05);
    }

    // ═══ 4. ESCANEO / ANÁLISIS DE SPECS (Sci-fi 70s sweep) ═══
    function scanSpecs() {
        if (!ensureContext()) return;
        const t = now();

        const osc = createOsc('sawtooth', 300);
        osc.frequency.linearRampToValueAtTime(1400, t + 0.2);
        osc.frequency.linearRampToValueAtTime(600, t + 0.35);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1800;

        const gain = createGain(0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(filter).connect(gain).connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
    }

    // ═══ 5. BOOT CRT ENCENDIDO ═══
    function boot() {
        if (!ensureContext()) return;
        const t = now();

        // Zumbido grave de transformador
        const osc1 = createOsc('sawtooth', 55);
        const gain1 = createGain(0);
        gain1.gain.linearRampToValueAtTime(0.07, t + 0.5);
        gain1.gain.linearRampToValueAtTime(0.015, t + 1.2);
        gain1.gain.linearRampToValueAtTime(0, t + 2.2);

        const f1 = audioCtx.createBiquadFilter();
        f1.type = 'lowpass';
        f1.frequency.value = 180;
        osc1.connect(f1).connect(gain1).connect(audioCtx.destination);
        osc1.start(t);
        osc1.stop(t + 2.2);

        // Silbido de alta tensión de monitor CRT (15 kHz atenuado)
        const osc2 = createOsc('sine', 7800);
        const gain2 = createGain(0);
        gain2.gain.linearRampToValueAtTime(0.012, t + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
        osc2.connect(gain2).connect(audioCtx.destination);
        osc2.start(t + 0.1);
        osc2.stop(t + 1.6);
    }

    // ═══ 6. LOGRO / ÉXITO CHIPTUNE ═══
    function success() {
        if (!ensureContext()) return;
        const t = now();
        const melody = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

        melody.forEach((freq, i) => {
            const osc = createOsc('square', freq);
            const gain = createGain(0.08);
            gain.gain.setValueAtTime(0.08, t + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.15);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(t + i * 0.08);
            osc.stop(t + i * 0.08 + 0.15);
        });
    }

    // ═══ 7. ERROR / BUZZER ═══
    function error() {
        if (!ensureContext()) return;
        const t = now();

        const osc = createOsc('sawtooth', 150);
        osc.frequency.linearRampToValueAtTime(70, t + 0.25);

        const gain = createGain(0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    return {
        init,
        insertCoin,
        buttonClick,
        hover,
        scanSpecs,
        boot,
        success,
        error,
        get enabled() { return enabled; },
        toggle() {
            enabled = !enabled;
            return enabled;
        }
    };
})();
