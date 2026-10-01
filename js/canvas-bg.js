/* ════════════════════════════════════════════════════════════
   NEXUS_OS // CANVAS BACKGROUND: 70s-80s RETRO SERVER MAINFRAME
   Simulación de servidor clásico sirviendo datos antiguos:
   - Carrete de cinta magnética 70s girando
   - Bus de datos y memoria hexadecimal en ámbar/verde fósforo
   - Lluvia de telemetría arcade
   - Nodos de CPU vintage con LEDs parpadeantes
   ════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    const canvas = document.getElementById('serverCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, dpr;
    let frame = 0;

    // Configuración de Servidor Vintage
    const CFG = {
        AMBER: { r: 255, g: 176, b: 0 },
        GREEN: { r: 57, g: 255, b: 20 },
        FONT_SIZE: 13,
        CHARS: '010101789ABCDEF⚡☢★▲►▼■□ΔΣΩΨλ$#&/[]{}'.split(''),
        COL_WIDTH: 18,
    };

    let rainCols = [];
    let memoryBlocks = [];
    let tapeRotation = 0;
    let scanlineY = 0;

    function resize() {
        dpr = window.devicePixelRatio || 1;
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        initRain();
        initMemoryBlocks();
    }

    function mixColor(t, alpha = 1) {
        // t=0 -> verde fósforo, t=1 -> ámbar
        const r = Math.round(CFG.GREEN.r + (CFG.AMBER.r - CFG.GREEN.r) * t);
        const g = Math.round(CFG.GREEN.g + (CFG.AMBER.g - CFG.GREEN.g) * t);
        const b = Math.round(CFG.GREEN.b + (CFG.AMBER.b - CFG.GREEN.b) * t);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    function initRain() {
        const totalCols = Math.floor(W / CFG.COL_WIDTH);
        rainCols = [];
        for (let i = 0; i < totalCols; i++) {
            // Solo activamos un 40% de columnas para no saturar la lectura
            if (Math.random() > 0.6) {
                rainCols.push({
                    x: i * CFG.COL_WIDTH,
                    y: Math.random() * -H,
                    speed: 0.4 + Math.random() * 1.2,
                    length: 6 + Math.floor(Math.random() * 15),
                    colorMix: Math.random(),
                    chars: [],
                    timer: 0,
                    interval: 2 + Math.floor(Math.random() * 5),
                });
            }
        }
    }

    function initMemoryBlocks() {
        memoryBlocks = [];
        const count = Math.min(8, Math.floor(W / 180));
        for (let i = 0; i < count; i++) {
            memoryBlocks.push({
                x: 30 + Math.random() * (W - 200),
                y: 40 + Math.random() * (H - 120),
                addr: '0x' + (Math.floor(Math.random() * 0xFFFF)).toString(16).toUpperCase().padStart(4, '0'),
                value: 'MEM_LOAD: ' + (Math.random() * 99).toFixed(1) + '%',
                colorMix: Math.random(),
                pulsePhase: Math.random() * Math.PI * 2,
            });
        }
    }

    // Dibujar carretel de cinta magnética (Mainframe 70s)
    function drawTapeReel(x, y, radius, rotation, colorMix) {
        ctx.save();
        ctx.translate(x, y);

        // Brida exterior del carrete
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.strokeStyle = mixColor(colorMix, 0.15);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Núcleo central
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 10, 4, 0.4)';
        ctx.fill();
        ctx.strokeStyle = mixColor(colorMix, 0.25);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 3 Agujeros clásicos de cinta de 9 pistas
        for (let i = 0; i < 3; i++) {
            const angle = rotation + (i * Math.PI * 2 / 3);
            const hx = Math.cos(angle) * (radius * 0.6);
            const hy = Math.sin(angle) * (radius * 0.6);
            ctx.beginPath();
            ctx.arc(hx, hy, radius * 0.18, 0, Math.PI * 2);
            ctx.fillStyle = mixColor(colorMix, 0.08);
            ctx.fill();
            ctx.strokeStyle = mixColor(colorMix, 0.2);
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawGrid() {
        ctx.strokeStyle = 'rgba(255, 176, 0, 0.03)';
        ctx.lineWidth = 0.5;
        const step = 45;
        for (let x = 0; x < W; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
        for (let y = 0; y < H; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }
    }

    function render() {
        frame++;
        tapeRotation += 0.008;

        // Limpieza con desvanecimiento CRT
        ctx.fillStyle = 'rgba(8, 6, 2, 0.14)';
        ctx.fillRect(0, 0, W, H);

        drawGrid();

        // Carreteles de cinta magnética decorativos en el fondo
        drawTapeReel(W - 90, 90, 60, tapeRotation, 1);
        drawTapeReel(W - 200, 90, 50, -tapeRotation * 1.2, 0);

        // Lluvia de telemetría antigua
        ctx.font = `${CFG.FONT_SIZE}px 'Share Tech Mono', monospace`;
        ctx.textAlign = 'center';

        for (const col of rainCols) {
            col.y += col.speed;
            col.timer++;

            if (col.timer >= col.interval) {
                col.timer = 0;
                col.chars.unshift(CFG.CHARS[Math.floor(Math.random() * CFG.CHARS.length)]);
                if (col.chars.length > col.length) col.chars.pop();
            }

            for (let i = 0; i < col.chars.length; i++) {
                const charY = col.y - (i * CFG.FONT_SIZE);
                if (charY < -20 || charY > H + 20) continue;

                // Primer caracter más brillante (cabeza del paquete)
                const isHead = i === 0;
                const alpha = isHead ? 0.85 : Math.max(0.04, 0.45 - (i / col.length) * 0.4);
                ctx.fillStyle = mixColor(col.colorMix, alpha);
                ctx.fillText(col.chars[i], col.x, charY);
            }

            if (col.y - col.length * CFG.FONT_SIZE > H) {
                col.y = -20;
                col.speed = 0.4 + Math.random() * 1.2;
                col.colorMix = Math.random();
            }
        }

        // Bloques de memoria de servidor vintage
        for (const b of memoryBlocks) {
            const pulse = 0.05 + Math.sin(frame * 0.02 + b.pulsePhase) * 0.03;
            ctx.strokeStyle = mixColor(b.colorMix, pulse);
            ctx.lineWidth = 0.8;
            ctx.strokeRect(b.x, b.y, 140, 22);

            ctx.font = "10px 'Share Tech Mono', monospace";
            ctx.textAlign = 'left';
            ctx.fillStyle = mixColor(b.colorMix, pulse * 3);
            ctx.fillText(`${b.addr} // ${b.value}`, b.x + 8, b.y + 15);
        }

        // Línea de escaneo analógica suave (CRT Sweep)
        scanlineY += 0.8;
        if (scanlineY > H) scanlineY = 0;

        const scanGrad = ctx.createLinearGradient(0, scanlineY - 40, 0, scanlineY + 40);
        scanGrad.addColorStop(0, 'transparent');
        scanGrad.addColorStop(0.5, 'rgba(255, 176, 0, 0.04)');
        scanGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = scanGrad;
        ctx.fillRect(0, scanlineY - 40, W, 80);

        requestAnimationFrame(render);
    }

    window.addEventListener('resize', resize);
    resize();
    render();
})();
