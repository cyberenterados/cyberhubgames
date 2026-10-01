/* ════════════════════════════════════════════════════════════
   PROYECTO GAMMA // VECTOR DEFENSE 1983 — TACTICAL ENGINE v2.5
   - Renderizado Poligonal Vectorial Puro (Neon Bloom 'lighter')
   - Skyline de la Ciudad en Wireframe 2.5D + Cúpulas Geodésicas
   - 3 Baterías de Silos Terrestres con Torretas Giratorias Dinámicas
   - Misiles Balísticos ICBM, Ojivas MIRV y Cazas Tempest Poligonales
   - Cúpulas de Choque Flak, Reacciones en Cadena & Pulso PEM
   - Rejilla Terrestre Deformable con Ondas Expansivas (Warp Grid)
   - Sintetizador Web Audio API: Sirena de Ataque & Sub-Bass
   - Sincronización de Telemetría con MongoDB Atlas
   ════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const viewport = document.getElementById('radarViewport');
    const crosshair = document.getElementById('crosshair');

    let W = 0;
    let H = 0;
    let dpr = 1;

    function resize() {
        dpr = window.devicePixelRatio || 1;
        W = viewport.clientWidth || window.innerWidth;
        H = viewport.clientHeight || (window.innerHeight - 140);
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        initCities();
        initSilos();
    }

    // ═══ ESTADO DE LA PARTIDA ═══
    let score = 0;
    let level = 1;
    let isPaused = true;
    let gameOver = false;
    let wavePending = 12;
    let frameCount = 0;
    let mouseX = 0;
    let mouseY = 0;
    let empCharge = 100;
    let empRadius = 0;
    let empActive = false;
    let highScore = Number(localStorage.getItem('gamma_high_score') || 0);
    let screenShakeTime = 0;

    // Elementos del HUD
    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');
    const citiesAliveEl = document.getElementById('citiesAlive');
    const empReadyText = document.getElementById('empReadyText');
    const syncStatusEl = document.getElementById('syncStatus');
    const pauseOverlay = document.getElementById('pause-overlay');
    const modalHeading = document.getElementById('modalHeading');
    const modalDesc = document.getElementById('modalDesc');
    const btnResume = document.getElementById('btnResume');
    const alertsLayer = document.getElementById('alertsLayer');

    // ═══ SINTETIZADOR WEB AUDIO API ═══
    let audioCtx = null;
    let soundEnabled = true;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playTone(freq, type, dur, vol = 0.08) {
        if (!soundEnabled || !audioCtx) return;
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const t = audioCtx.currentTime;
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(vol, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + dur);
        } catch (e) {}
    }

    const sfx = {
        launch: () => {
            if (!soundEnabled || !audioCtx) return;
            const t = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, t);
            osc.frequency.exponentialRampToValueAtTime(900, t + 0.15);
            gain.gain.setValueAtTime(0.06, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + 0.18);
        },
        flakExplosion: () => {
            if (!soundEnabled || !audioCtx) return;
            const t = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(95, t);
            osc.frequency.linearRampToValueAtTime(35, t + 0.35);
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + 0.4);
        },
        empBlast: () => {
            if (!soundEnabled || !audioCtx) return;
            const t = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(2000, t);
            osc.frequency.exponentialRampToValueAtTime(60, t + 0.8);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + 0.85);
        },
        cityDestroyed: () => {
            playTone(80, 'sawtooth', 0.6, 0.2);
            setTimeout(() => playTone(50, 'square', 0.8, 0.2), 150);
        },
        waveCleared: () => {
            [523, 659, 784, 1046].forEach((f, i) => {
                setTimeout(() => playTone(f, 'square', 0.2, 0.08), i * 100);
            });
        }
    };

    // ═══ 1. CIUDAD POLIGONAL & CÚPULAS GEODÉSICAS ═══
    let cities = [];
    const CITY_COUNT = 5;

    function initCities() {
        cities = [];
        const spacing = W / (CITY_COUNT + 1);
        for (let i = 1; i <= CITY_COUNT; i++) {
            cities.push({
                id: i,
                x: spacing * i,
                y: H - 35,
                width: 44,
                height: 30,
                alive: true,
                buildings: [
                    { ox: -18, w: 10, h: 22 },
                    { ox: -6,  w: 12, h: 32 },
                    { ox: 8,   w: 10, h: 18 }
                ],
                shieldPulse: Math.random() * Math.PI * 2
            });
        }
        updateCitiesHUD();
    }

    function drawCity(city) {
        const cx = city.x;
        const cy = city.y;

        if (!city.alive) {
            ctx.strokeStyle = '#551111';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - 20, cy + 15);
            ctx.lineTo(cx - 8, cy + 8);
            ctx.lineTo(cx + 4, cy + 12);
            ctx.lineTo(cx + 18, cy + 15);
            ctx.stroke();
            return;
        }

        ctx.strokeStyle = '#39FF14';
        ctx.lineWidth = 1.2;

        city.buildings.forEach(b => {
            const bx = cx + b.ox;
            const by = cy - b.h + 15;
            ctx.strokeRect(bx, by, b.w, b.h);

            ctx.fillStyle = '#00F3FF';
            for (let wy = by + 4; wy < by + b.h - 4; wy += 6) {
                for (let wx = bx + 3; wx < bx + b.w - 2; wx += 4) {
                    if (Math.sin(frameCount * 0.05 + wx + wy) > 0.3) {
                        ctx.fillRect(wx, wy, 1.5, 1.5);
                    }
                }
            }
        });

        city.shieldPulse += 0.03;
        const pulseAlpha = 0.2 + Math.sin(city.shieldPulse) * 0.15;
        ctx.beginPath();
        ctx.arc(cx, cy + 10, 30, Math.PI, 0);
        ctx.strokeStyle = `rgba(0, 243, 255, ${pulseAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // ═══ 2. SILOS TERRESTRES & TORRETAS GIRATORIAS ═══
    let silos = [];

    function initSilos() {
        silos = [
            { id: 'alfa',   name: 'ALFA',   x: W * 0.15, y: H - 20, maxAmmo: 12, ammo: 12, angle: -Math.PI / 2 },
            { id: 'delta',  name: 'DELTA',  x: W * 0.50, y: H - 20, maxAmmo: 18, ammo: 18, angle: -Math.PI / 2 },
            { id: 'omega',  name: 'OMEGA',  x: W * 0.85, y: H - 20, maxAmmo: 12, ammo: 12, angle: -Math.PI / 2 },
        ];
        updateSilosHUD();
    }

    function updateSiloAngles() {
        silos.forEach(s => {
            s.angle = Math.atan2(mouseY - s.y, mouseX - s.x);
        });
    }

    function drawSilo(silo) {
        const sx = silo.x;
        const sy = silo.y;

        ctx.strokeStyle = silo.ammo > 0 ? '#FFB000' : '#553300';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx - 24, sy + 15);
        ctx.lineTo(sx - 16, sy - 8);
        ctx.lineTo(sx + 16, sy - 8);
        ctx.lineTo(sx + 24, sy + 15);
        ctx.closePath();
        ctx.stroke();

        const barrelLength = 22;
        const bx = sx + Math.cos(silo.angle) * barrelLength;
        const by = sy - 4 + Math.sin(silo.angle) * barrelLength;

        ctx.strokeStyle = silo.ammo > 0 ? '#39FF14' : '#444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 4);
        ctx.lineTo(bx, by);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sx, sy - 4, 6, 0, Math.PI * 2);
        ctx.fillStyle = silo.ammo > 0 ? '#FFB000' : '#222';
        ctx.fill();
    }

    // ═══ 3. ENEMIGOS: ICBM, MIRV & CAZAS TEMPEST ═══
    let enemies = [];

    function spawnEnemy() {
        const aliveCities = cities.filter(c => c.alive);
        if (aliveCities.length === 0) return;

        const targetCity = aliveCities[Math.floor(Math.random() * aliveCities.length)];
        const startX = Math.random() * W;
        const speed = 1.2 + (level * 0.25);

        const typeRoll = Math.random();
        let type = 'icbm';
        if (level >= 2 && typeRoll > 0.65) type = 'mirv';
        if (level >= 3 && typeRoll > 0.85) type = 'tempest';

        const angle = Math.atan2(targetCity.y - 0, targetCity.x - startX);

        enemies.push({
            type,
            x: startX,
            y: 0,
            originX: startX,
            originY: 0,
            targetX: targetCity.x,
            targetY: targetCity.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            speed,
            split: false,
            trail: [],
            angle
        });
    }

    function updateAndDrawEnemies() {
        ctx.strokeStyle = '#FF2222';
        ctx.fillStyle = '#FF2222';

        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            e.x += e.vx;
            e.y += e.vy;

            e.trail.push({ x: e.x, y: e.y });
            if (e.trail.length > 25) e.trail.shift();

            ctx.beginPath();
            ctx.moveTo(e.originX, e.originY);
            for (const pt of e.trail) {
                ctx.lineTo(pt.x, pt.y);
            }
            ctx.lineWidth = e.type === 'mirv' ? 1.8 : 1.2;
            ctx.strokeStyle = e.type === 'mirv' ? '#FF0055' : '#FF2222';
            ctx.stroke();

            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.rotate(e.angle);

            if (e.type === 'tempest') {
                ctx.strokeStyle = '#00F3FF';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(-8, -7);
                ctx.lineTo(-4, 0);
                ctx.lineTo(-8, 7);
                ctx.closePath();
                ctx.stroke();
            } else {
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.moveTo(6, 0);
                ctx.lineTo(-4, -3);
                ctx.lineTo(-4, 3);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();

            if (e.type === 'mirv' && !e.split && e.y > H * 0.35) {
                e.split = true;
                showTacticalAlert('¡ALERTA MIRV FRAGMENTADO!', '#FF0055', e.x, e.y);
                [-0.4, 0.4].forEach(offsetAngle => {
                    const newAngle = e.angle + offsetAngle;
                    enemies.push({
                        type: 'icbm',
                        x: e.x,
                        y: e.y,
                        originX: e.x,
                        originY: e.y,
                        targetX: Math.max(20, Math.min(W - 20, e.targetX + offsetAngle * 120)),
                        targetY: e.targetY,
                        vx: Math.cos(newAngle) * e.speed,
                        vy: Math.sin(newAngle) * e.speed,
                        speed: e.speed,
                        split: true,
                        trail: [],
                        angle: newAngle
                    });
                });
            }

            if (e.y >= e.targetY) {
                cities.forEach(c => {
                    if (c.alive && Math.hypot(c.x - e.x, c.y - e.y) < 40) {
                        c.alive = false;
                        sfx.cityDestroyed();
                        showTacticalAlert('¡CIUDAD DESTRUIDA!', '#FF2222', c.x, c.y - 40);
                        triggerScreenShake(20);
                        updateCitiesHUD();
                    }
                });

                createExplosion(e.x, e.y, 45, 'damage');
                enemies.splice(i, 1);
            }
        }
    }

    // ═══ 4. INTERCEPTORES & CÚPULAS FLAK ═══
    let interceptors = [];
    let explosions = [];

    function fireInterceptor(targetX, targetY) {
        if (gameOver || isPaused) return;

        const availableSilos = silos.filter(s => s.ammo > 0);
        if (availableSilos.length === 0) {
            showTacticalAlert('¡TODOS LOS SILOS VACÍOS!', '#FFB000', W / 2, H - 80);
            return;
        }

        availableSilos.sort((a, b) => Math.hypot(a.x - targetX, a.y - targetY) - Math.hypot(b.x - targetX, b.y - targetY));
        const chosenSilo = availableSilos[0];
        chosenSilo.ammo -= 1;
        updateSilosHUD();

        const angle = Math.atan2(targetY - chosenSilo.y, targetX - chosenSilo.x);
        const speed = 16;

        interceptors.push({
            x: chosenSilo.x,
            y: chosenSilo.y,
            originX: chosenSilo.x,
            originY: chosenSilo.y,
            targetX,
            targetY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            trail: []
        });

        sfx.launch();
    }

    function updateAndDrawInterceptors() {
        ctx.strokeStyle = '#39FF14';
        ctx.lineWidth = 1.5;

        for (let i = interceptors.length - 1; i >= 0; i--) {
            const int = interceptors[i];
            int.x += int.vx;
            int.y += int.vy;

            int.trail.push({ x: int.x, y: int.y });
            if (int.trail.length > 15) int.trail.shift();

            ctx.beginPath();
            ctx.moveTo(int.originX, int.originY);
            for (const pt of int.trail) ctx.lineTo(pt.x, pt.y);
            ctx.stroke();

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(int.x - 2, int.y - 2, 4, 4);

            if (Math.hypot(int.targetX - int.x, int.targetY - int.y) < 18) {
                createExplosion(int.targetX, int.targetY, 55, 'shield');
                interceptors.splice(i, 1);
            }
        }
    }

    // ═══ 5. CÚPULAS DE EXPLOSIÓN Y REACCIONES EN CADENA ═══
    function createExplosion(x, y, maxRadius, type) {
        explosions.push({
            x,
            y,
            radius: 2,
            maxRadius,
            expanding: true,
            type,
            chainMultiplier: 1
        });
        sfx.flakExplosion();
        createSparkParticles(x, y, type === 'shield' ? '#39FF14' : '#FF2222', 20);
    }

    function updateAndDrawExplosions() {
        for (let i = explosions.length - 1; i >= 0; i--) {
            const exp = explosions[i];

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';

            const alpha = exp.expanding ? 0.6 : (exp.radius / exp.maxRadius) * 0.5;
            const mainColor = exp.type === 'shield' ? '#39FF14' : '#FF2222';
            const ringColor = exp.type === 'shield' ? '#00F3FF' : '#FFB000';

            ctx.fillStyle = exp.type === 'shield' ? `rgba(57, 255, 20, ${alpha * 0.3})` : `rgba(255, 34, 34, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = ringColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
            ctx.stroke();

            if (exp.radius > 15) {
                ctx.strokeStyle = mainColor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(exp.x, exp.y, exp.radius * 0.6, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();

            if (exp.expanding) {
                exp.radius += 2.2;
                if (exp.radius >= exp.maxRadius) exp.expanding = false;
            } else {
                exp.radius -= 1.2;
                if (exp.radius <= 0) {
                    explosions.splice(i, 1);
                    continue;
                }
            }

            if (exp.type === 'shield') {
                for (let j = enemies.length - 1; j >= 0; j--) {
                    const e = enemies[j];
                    if (Math.hypot(e.x - exp.x, e.y - exp.y) < exp.radius) {
                        const earned = 100 * exp.chainMultiplier * level;
                        score += earned;
                        updateScoreHUD();

                        if (exp.chainMultiplier > 1) {
                            showTacticalAlert(`CADENA x${exp.chainMultiplier}! +${earned}`, '#00F3FF', e.x, e.y);
                        } else {
                            showTacticalAlert(`INTERCEPTADO! +${earned}`, '#39FF14', e.x, e.y);
                        }

                        empCharge = Math.min(100, empCharge + 5);
                        updateEmpHUD();

                        const nextMultiplier = exp.chainMultiplier + 1;
                        explosions.push({
                            x: e.x,
                            y: e.y,
                            radius: 2,
                            maxRadius: 35,
                            expanding: true,
                            type: 'shield',
                            chainMultiplier: nextMultiplier
                        });

                        enemies.splice(j, 1);
                    }
                }
            }
        }
    }

    // ═══ 6. SUPER-ARMA: PULSO PEM (EMP SHOCKWAVE) ═══
    function triggerEmpBlast() {
        if (empCharge < 100 || isPaused || gameOver) return;

        empCharge = 0;
        empActive = true;
        empRadius = 0;
        updateEmpHUD();
        sfx.empBlast();
        triggerScreenShake(30);
        showTacticalAlert('¡PULSO PEM DETONADO!', '#00F3FF', W / 2, H / 2);

        enemies.forEach(e => {
            createExplosion(e.x, e.y, 40, 'shield');
            score += 150 * level;
        });
        enemies = [];
        updateScoreHUD();
    }

    function updateAndDrawEmp() {
        if (!empActive) return;

        empRadius += 25;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = '#00F3FF';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, empRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, empRadius * 0.9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (empRadius > Math.max(W, H) * 1.2) {
            empActive = false;
        }
    }

    // ═══ 7. REJILLA TERRESTRE VECTORIAL (WARPED GRID) ═══
    function drawWarpedGround() {
        ctx.strokeStyle = 'rgba(57, 255, 20, 0.15)';
        ctx.lineWidth = 1;

        const groundY = H - 15;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(W, groundY);
        ctx.stroke();

        const vanishX = W / 2;
        const vanishY = H + 60;
        for (let x = 0; x < W; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, groundY);
            ctx.lineTo(vanishX + (x - vanishX) * 1.8, vanishY);
            ctx.stroke();
        }
    }

    // ═══ 8. SISTEMA DE PARTÍCULAS ═══
    let particles = [];

    function createSparkParticles(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                size: 1.5 + Math.random() * 2,
                alpha: 1,
                decay: 0.03 + Math.random() * 0.03
            });
        }
    }

    function updateAndDrawParticles() {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                particles.splice(i, 1);
                continue;
            }

            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.restore();
    }

    // ═══ SCREEN SHAKE & ALERTAS TÁCTICAS ═══
    function triggerScreenShake(intensity = 15) {
        screenShakeTime = intensity;
    }

    function showTacticalAlert(text, color, x, y) {
        const el = document.createElement('div');
        el.className = 'tactical-alert-text';
        el.textContent = text;
        el.style.left = `${Math.max(40, Math.min(W - 40, x))}px`;
        el.style.top = `${Math.max(40, Math.min(H - 40, y))}px`;
        el.style.color = color;
        alertsLayer.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }

    // ═══ HUD & SINCRONIZACIÓN ═══
    function updateScoreHUD() {
        scoreEl.textContent = String(score).padStart(5, '0');
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('gamma_high_score', highScore);
        }
    }

    function updateCitiesHUD() {
        const count = cities.filter(c => c.alive).length;
        citiesAliveEl.textContent = `${count} / 5`;

        if (count === 0 && !gameOver) {
            triggerGameOver();
        }
    }

    function updateSilosHUD() {
        const alfaBox = document.getElementById('ammoAlfa');
        const deltaBox = document.getElementById('ammoDelta');
        const omegaBox = document.getElementById('ammoOmega');

        function renderAmmo(container, silo) {
            if (!container) return;
            container.innerHTML = '';
            for (let i = 0; i < silo.maxAmmo; i++) {
                const b = document.createElement('div');
                b.className = `ammo-bullet ${i < silo.ammo ? '' : 'empty'}`;
                container.appendChild(b);
            }
        }

        renderAmmo(alfaBox, silos[0]);
        renderAmmo(deltaBox, silos[1]);
        renderAmmo(omegaBox, silos[2]);
    }

    function updateEmpHUD() {
        empReadyText.textContent = empCharge >= 100 ? '⚡ 100% LISTO' : `${empCharge}% CARGANDO`;
        empReadyText.className = empCharge >= 100 ? 'stat-val font-arcade t-cyan' : 'stat-val font-arcade t-dim';
    }

    // ═══ OLEADAS & PROGRESIÓN ═══
    function checkWaveProgression() {
        if (enemies.length === 0 && wavePending <= 0 && explosions.length === 0 && !gameOver) {
            level++;
            levelEl.textContent = String(level).padStart(2, '0');
            wavePending = 12 + (level * 6);

            silos.forEach(s => s.ammo = s.maxAmmo);
            updateSilosHUD();

            const aliveCities = cities.filter(c => c.alive).length;
            const cityBonus = aliveCities * 500 * level;
            score += cityBonus;
            updateScoreHUD();

            sfx.waveCleared();
            showTacticalAlert(`¡OLEADA ${level} SUPERADA! BONUS +${cityBonus}`, '#39FF14', W / 2, H / 2);
        }
    }

    // ═══ GAME OVER & MONGODB REPORT ═══
    function triggerGameOver() {
        gameOver = true;
        isPaused = true;
        pauseOverlay.classList.remove('hidden');

        modalHeading.textContent = 'DEFENSA TOTALMENTE COLAPSADA';
        modalHeading.style.color = '#FF2222';
        modalDesc.innerHTML = `Todas las ciudades han sido impactadas.<br>PUNTUACIÓN FINAL: <strong>${score}</strong> | OLEADAS SUPERADAS: <strong>${level - 1}</strong>`;
        btnResume.innerHTML = '<span>[ 🔄 REINICIAR DEFENSA ]</span>';

        reportGameResult();
    }

    async function reportGameResult() {
        const token = localStorage.getItem('nexus_token');
        if (!token) {
            syncStatusEl.innerHTML = '<span class="t-dim">MODO LOCAL (INVITADO)</span>';
            return;
        }

        try {
            syncStatusEl.innerHTML = '<span class="t-amber">GUARDANDO EN MONGODB...</span>';
            const payload = {
                gameId: 'space-invaders',
                score: Number(score || 0),
                level: Number(level || 0),
                time_seconds: Math.floor(frameCount / 60)
            };

            const apiBase = window.CYBERHUB_API_URL ||
                localStorage.getItem('nexus_api_url') ||
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:5000/api'
                    : 'https://cyberhubgamesback.onrender.com/api');

            const res = await fetch(`${apiBase}/games/report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                syncStatusEl.innerHTML = '<span class="t-green">MONGO SYNC: RECORD GUARDADO</span>';
            }
        } catch (e) {
            syncStatusEl.innerHTML = '<span class="t-dim">OFFLINE / RETRY LATER</span>';
        }
    }

    function resetGame() {
        score = 0;
        level = 1;
        wavePending = 12;
        frameCount = 0;
        empCharge = 100;
        empActive = false;
        enemies = [];
        interceptors = [];
        explosions = [];
        particles = [];
        gameOver = false;
        isPaused = false;

        initCities();
        initSilos();
        updateScoreHUD();
        updateEmpHUD();
        levelEl.textContent = '01';

        pauseOverlay.classList.add('hidden');
        btnResume.innerHTML = '<span>[ 🕹️ INICIAR DEFENSA TÁCTICA ]</span>';
    }

    // ═══ CONTROL DE PAUSA / INICIO ═══
    function togglePause() {
        if (gameOver) {
            resetGame();
            return;
        }
        isPaused = !isPaused;
        if (isPaused) {
            pauseOverlay.classList.remove('hidden');
            modalHeading.textContent = 'SISTEMA SUSPENDIDO';
            modalHeading.style.color = '#39FF14';
            modalDesc.textContent = 'Defensa en espera. Presiona reanudar para volver al combate balístico.';
            btnResume.innerHTML = '<span>[ REANUDAR DEFENSA ]</span>';
        } else {
            pauseOverlay.classList.add('hidden');
        }
    }

    // ═══ MAIN GAME LOOP ═══
    function updateAndDraw() {
        frameCount++;

        ctx.fillStyle = 'rgba(2, 4, 2, 0.28)';
        ctx.fillRect(0, 0, W, H);

        if (screenShakeTime > 0) {
            const ox = (Math.random() - 0.5) * screenShakeTime;
            const oy = (Math.random() - 0.5) * screenShakeTime;
            ctx.save();
            ctx.translate(ox, oy);
            screenShakeTime *= 0.88;
            if (screenShakeTime < 0.5) screenShakeTime = 0;
        }

        drawWarpedGround();
        cities.forEach(drawCity);
        updateSiloAngles();
        silos.forEach(drawSilo);

        if (!isPaused && !gameOver) {
            const spawnInterval = Math.max(25, 90 - (level * 8));
            if (frameCount % spawnInterval === 0 && wavePending > 0) {
                spawnEnemy();
                wavePending--;
            }
            checkWaveProgression();
        }

        updateAndDrawEnemies();
        updateAndDrawInterceptors();
        updateAndDrawExplosions();
        updateAndDrawEmp();
        updateAndDrawParticles();

        if (screenShakeTime > 0) {
            ctx.restore();
        }

        requestAnimationFrame(updateAndDraw);
    }

    // ═══ EVENTOS DE ENTRADA Y APUNTADO ═══
    function updateTargetCoordinates(clientX, clientY) {
        const rect = viewport.getBoundingClientRect();
        mouseX = clientX - rect.left;
        mouseY = clientY - rect.top;

        crosshair.style.display = 'block';
        crosshair.style.left = `${mouseX}px`;
        crosshair.style.top = `${mouseY}px`;
    }

    viewport.addEventListener('mousemove', (e) => {
        updateTargetCoordinates(e.clientX, e.clientY);
    });

    viewport.addEventListener('mousedown', (e) => {
        initAudio();
        updateTargetCoordinates(e.clientX, e.clientY);
        if (mouseY < H - 40) {
            fireInterceptor(mouseX, mouseY);
        }
    });

    viewport.addEventListener('touchstart', (e) => {
        e.preventDefault();
        initAudio();
        const touch = e.touches[0];
        updateTargetCoordinates(touch.clientX, touch.clientY);
        if (mouseY < H - 40) {
            fireInterceptor(mouseX, mouseY);
        }
    });

    window.addEventListener('keydown', (e) => {
        initAudio();
        if (e.key === 'Enter' || (e.key === ' ' && isPaused)) {
            togglePause();
            return;
        }
        if (e.key.toLowerCase() === 'p' || e.key === 'Escape') togglePause();
        if (e.key.toLowerCase() === 'e') triggerEmpBlast();
    });

    btnResume.addEventListener('click', (e) => {
        e.stopPropagation();
        initAudio();
        if (gameOver) resetGame();
        else togglePause();
    });

    // Clic en el overlay para arrancar
    pauseOverlay.addEventListener('click', (e) => {
        if (e.target === pauseOverlay) {
            initAudio();
            togglePause();
        }
    });

    document.getElementById('btnPause').addEventListener('click', togglePause);
    document.getElementById('btnFireEmp').addEventListener('click', () => {
        initAudio();
        triggerEmpBlast();
    });

    document.getElementById('btnAudioToggle').addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        document.getElementById('audioIcon').textContent = soundEnabled ? '🔊 AUDIO ON' : '🔇 AUDIO OFF';
    });

    // ═══ ARRANQUE ═══
    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(updateAndDraw);

})();