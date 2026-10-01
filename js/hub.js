/* ════════════════════════════════════════════════════════════
   NEXUS_OS // RETRO ARCADE STORE & MAINFRAME CORE LOGIC
   PlayStore Retro 70s-80s de Juegos & Herramientas
   ════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    const API_BASE = window.CYBERHUB_API_URL ||
        localStorage.getItem('nexus_api_url') ||
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:5000/api'
            : 'https://cyberhubgamesback.onrender.com/api');
    const SERVER_ROOT = API_BASE.replace(/\/api\/?$/, '');

    // ═══ CATÁLOGO COMPLETO DE JUEGOS Y HERRAMIENTAS CON ANÁLISIS TÉCNICO ═══
    const CATALOG = [
        // ─── SECCIÓN ARCADE 70s & 80s ───
        {
            id: 'neon-racer',
            category: 'game',
            era: '1988 SYNTHWAVE OUTRUN',
            icon: '🏎️',
            title: 'NEON RACER 88',
            subtitle: 'Carreras pseudo-3D de alta velocidad inspiradas en OutRun',
            badge: 'TOP ARCADE',
            rating: '★★★★★',
            tags: ['Canvas 2D', 'Pseudo-3D', 'FM Synth 80s', 'Web Audio'],
            url: 'Juegos-/carreras-estilo-80/index.html',
            featured: true,
            specs: {
                arch: 'Motor de proyección perspectiva en Canvas 2D sin WebGL (técnica clássica de SEGA OutRun 1986).',
                algorithms: 'Cálculo de curvas hiperbólicas polinómicas en carreteras, ondulaciones verticales por función senoidal sin(z) y escalado de profundidad z-buffer manual por segmentos (70,000+ bytes de código).',
                tech: 'Vanilla JavaScript ES6+, HTML5 Canvas, Web Audio Chiptune.',
                apis: 'API de Telemetría Nexus (/api/games/report) para guardar vueltas rápidas y puntuación máxima en MongoDB.',
                backendId: 'neon-racer'
            }
        },
        {
            id: 'crypt-tris',
            category: 'game',
            era: '1984 SOVIET CHIP',
            icon: '▦',
            title: 'CRYPT-TRIS.exe',
            subtitle: 'Desencriptador de bloques y colisiones de tetrominós',
            badge: 'CLÁSICO 80s',
            rating: '★★★★★',
            tags: ['Matriz 10x20', 'SRS Rotation', 'Glitch FX', 'Puzzle'],
            url: 'Juegos-/game-tetris/index.html',
            featured: true,
            specs: {
                arch: 'Simulación matricial de rejilla bidimensional 10x20 con lógica de tetrominós clásicos.',
                algorithms: 'Sistema de Rotación Super (SRS) con wall kicks, gravedad progresiva exponencial y detección de limpieza de líneas con animación de glitch por píxel.',
                tech: 'HTML5 Canvas 2D, CSS CRT Scanlines, Web Audio sintetizado.',
                apis: 'Sincronización de récords con MongoDB (/api/games/report).',
                backendId: 'crypt-tris'
            }
        },
        {
            id: 'space-invader',
            category: 'game',
            era: '1978 SPACE AGE',
            icon: '👾',
            title: 'PROYECTO GAMMA',
            subtitle: 'Defensa de red por oleadas alienígenas estilo Space Invaders',
            badge: 'ARCADE 1978',
            rating: '★★★★☆',
            tags: ['Bucle 60FPS', 'Escudos Degenerativos', 'Shooter 70s'],
            url: 'Juegos-/SpaceInvader/index.html',
            featured: false,
            specs: {
                arch: 'Bucle de animación clásico con renderizado de vectores retro y colisiones AABB (Axis-Aligned Bounding Box).',
                algorithms: 'Movimiento escalonado en formación de enjambre con incremento progresivo de velocidad por invasor eliminado y cálculo de destrucción por píxel en búnkeres de defensa.',
                tech: 'JavaScript puro, Canvas 2D, retro sound synthesis.',
                apis: 'Reporte de oleadas y puntos a /api/games/report.',
                backendId: 'space-invaders'
            }
        },
        {
            id: 'terminal-pong',
            category: 'game',
            era: '1972 ATARI PIONEER',
            icon: '▰',
            title: 'TERMINAL_PONG',
            subtitle: 'Duelo balístico de reflejos contra el núcleo cibernético',
            badge: 'RETRO 1972',
            rating: '★★★★☆',
            tags: ['Física Elástica', 'IA de Paleta', 'CRT Retro'],
            url: 'Juegos-/PingPong-Hacker/index.html',
            featured: false,
            specs: {
                arch: 'Simulación física de oscilación vectorial 2D en terminal de fósforo verde.',
                algorithms: 'Reflexión elástica con modificación del ángulo saliente según el punto de impacto relativo en la paleta y algoritmo de predicción balística para la IA enemiga.',
                tech: 'Canvas 2D, CSS Glitch & CRT flicker.',
                apis: 'Reporte de victorias a /api/games/report.',
                backendId: 'terminal-pong'
            }
        },

        // ─── SECCIÓN HERRAMIENTAS & TELEMETRÍA ───
        {
            id: 'world-intelligence',
            category: 'tool',
            era: '2026 OSINT SUITE',
            icon: '🌍',
            title: 'WORLD INTELLIGENCE',
            subtitle: 'Centro de mando táctico geoespacial, satelital y OSINT',
            badge: 'SUITE MILITAR',
            rating: '★★★★★',
            tags: ['Leaflet HD', '7 APIs', 'NOAA SunCalc', 'Radio Streaming'],
            url: 'tools/MAPA-MUNDIAL-SATELLITE/world-intelligence/index.html',
            featured: true,
            specs: {
                arch: 'Arquitectura modular multi-capa con 9 subsistemas independientes (mapa, clima, satélite, radio, sol, telemetría, UI).',
                algorithms: 'Ecuaciones astronómicas orbitales de NOAA para terminador solar en tiempo real, generador nativo de Google Plus Codes (OLC) y Haversine geodésico.',
                tech: 'Leaflet 1.9.4, Web Audio, HTML5 Audio Streaming, GeoJSON.',
                apis: 'Esri World Imagery, Open-Meteo, RainViewer Radar, USGS Earthquake API, Radio Browser API, OpenStreetMap Nominatim, Wikipedia REST.',
                backendId: 'world-intelligence'
            }
        },
        {
            id: 'vintage-chrono',
            category: 'tool',
            era: '1880 HAUTE HORLOGERIE',
            icon: '⚙️',
            title: 'CHRONOGRAPHE D\'ART',
            subtitle: 'Reloj de esqueleto victoriano 3D con tren de engranajes real',
            badge: '3D FOTORREALISTA',
            rating: '★★★★★',
            tags: ['Three.js', 'WebGL PBR', 'B-Spline Chain', 'Web Audio'],
            url: 'tools/reloj-vintageTime-Chrono/index.html',
            featured: true,
            specs: {
                arch: 'Modelado procedimental 3D completo en Three.js (1509 líneas de código nativo sin assets externos).',
                algorithms: 'Relación física de transmisión de engranajes (72-64-48-40-30 dientes), caracol de fuerza constante con curva B-Spline CatmullRomCurve3 y campana de vidrio con índice de refracción IOR 1.52.',
                tech: 'Three.js, OrbitControls, Web Audio API (síntesis de impacto de rubí y resonancia de caja de madera).',
                apis: 'Cero dependencias de red externa (100% autónomo).',
                backendId: 'vintage-chrono'
            }
        },
        {
            id: 'keydiag-pro',
            category: 'tool',
            era: '2026 E-SPORTS LAB',
            icon: '⌨️',
            title: 'KEYDIAG PRO',
            subtitle: 'Diagnóstico exhaustivo de periféricos de entrada (NKRO & Chatter)',
            badge: 'HARDWARE LAB',
            rating: '★★★★★',
            tags: ['NKRO Test', 'Key Chatter', 'Audio Sintético', 'Mouse SVG'],
            url: 'tools/tools-key/index.html',
            featured: true,
            specs: {
                arch: 'Suite de telemetría de eventos físicos (KeyboardEvent.code) para teclados mecánicos 104 y 87 TKL.',
                algorithms: 'Detección algorítmica de N-Key Rollover con búfer concurrente, detector de chatter (rebote anormal sin keyup) y síntesis Web Audio de interruptores mecánicos por modulación de ruido blanco filtrado.',
                tech: 'Vanilla JS, SVG interactivo para mouse (LMB, RMB, MMB, botones 4 y 5), Exportación JSON.',
                apis: 'Generación y descarga de blobs JSON en cliente.',
                backendId: 'keydiag-pro'
            }
        },
        {
            id: 'vista-aero',
            category: 'tool',
            era: '2006 AERO GLASS',
            icon: '💠',
            title: 'VISTA AERO VORTEX',
            subtitle: 'Matriz global de 100+ países con husos horarios y clima dinámico',
            badge: 'GLASSMORPHISM',
            rating: '★★★★☆',
            tags: ['100+ Países', 'Intl IANA', 'Aurora Canvas', 'Ambient Pad'],
            url: 'tools/reloj-web-mundiales/index.html',
            featured: false,
            specs: {
                arch: 'Cuadrícula masiva de micro-tarjetas con efectos Aero Glassmorphism de saturación al 180% y blur.',
                algorithms: 'Algoritmo de mezcla Fisher-Yates para la animación de cristalización progresiva y cálculo en tiempo real de hora local mediante Intl.DateTimeFormat con zonas IANA.',
                tech: 'Canvas 2D para Aurora Boreal de fondo, Web Audio API para colchón armónico de acordes mayores 7ª.',
                apis: 'Dataset geográfico local embebido sin latencia de red.',
                backendId: 'vista-aero'
            }
        },
        {
            id: 'matrix-bunker',
            category: 'tool',
            era: '1999 CYBER BUNKER',
            icon: '🟢',
            title: 'TELEMETRÍA BÚNKER',
            subtitle: 'Lluvia de datos Matrix, geolocalización IP y clima exterior',
            badge: 'BÚNKER HUD',
            rating: '★★★★☆',
            tags: ['Matrix Rain', 'IP Geolocation', 'Open-Meteo', 'CRT Scan'],
            url: 'tools/Matrix-reloj-rojohora/index.html',
            featured: false,
            specs: {
                arch: 'HUD de búnker táctico clandestino montado sobre Canvas 2D a 60 fps con estela alfa degradada.',
                algorithms: 'Resolución de IP pública mediante servicio de red, cálculo de coordenadas y obtención de temperatura exterior.',
                tech: 'Canvas 2D, ipapi.co, Open-Meteo REST API.',
                apis: 'ipapi.co, Open-Meteo.',
                backendId: 'matrix-bunker'
            }
        },
        {
            id: 'usgs-monitor',
            category: 'tool',
            era: '2026 GEOLOGY LAB',
            icon: '⌁',
            title: 'MONITOR SÍSMICO USGS',
            subtitle: 'Mapa y alertas de actividad sísmica y terremotos globales',
            badge: 'MONITOREO TIERRA',
            rating: '★★★★☆',
            tags: ['USGS Realtime', 'GeoJSON', 'Alertas', 'Magnitud'],
            url: 'tools/Alert-UsgsWXP/index.html',
            featured: false,
            specs: {
                arch: 'Visualizador de eventos sísmicos en tiempo real basado en datos sismológicos del Servicio Geológico de EE.UU.',
                algorithms: 'Filtrado de eventos por magnitud mínima (M2.5+), cálculo de hipocentro y categorización de riesgo por código de color.',
                tech: 'JavaScript asíncrono, GeoJSON feeds, CSS táctico.',
                apis: 'USGS Earthquake Hazards Program API.',
                backendId: 'usgs-monitor'
            }
        },
        {
            id: 'cyber-clock',
            category: 'tool',
            era: '2027 CYBERPUNK',
            icon: '⚡',
            title: 'CYBER CLOCK',
            subtitle: 'Nodo temporal cyberpunk con cuenta regresiva dinámica a fin de año',
            badge: 'TEMPORAL NODE',
            rating: '★★★★☆',
            tags: ['Countdown', 'Neon Themes', 'Easter Eggs', 'Intl'],
            url: 'tools/RelojDigital-CuentaRegresiva2027/index.html',
            featured: false,
            specs: {
                arch: 'Reloj cronográfico futurista con detección de año automática y salto de medianoche.',
                algorithms: 'Diferencial milimétrico de tiempo astronómico UTC/Local y detector de zona horaria con easter egg para Zulia (America/Caracas).',
                tech: 'CSS Variables neón reactivas, Scanlines dinámicas.',
                apis: 'Intl.DateTimeFormat resolvedOptions.',
                backendId: 'cyber-clock'
            }
        },
        {
            id: 'oraculo-vedico',
            category: 'tool',
            era: 'VEDIC COSMOS',
            icon: '✧',
            title: 'ORÁCULO VÉDICO',
            subtitle: 'Lectura astral, mapa de nacimiento y sincronía temporal',
            badge: 'ASTRAL INTEL',
            rating: '★★★★☆',
            tags: ['Astrología Védica', 'Ciclos Lunares', 'Numerología'],
            url: 'tools/Cumplea%C3%B1os-Esoterico/index.html',
            featured: false,
            specs: {
                arch: 'Algoritmo de cálculo de tránsitos planetarios y mapa natal a partir de fecha y hora.',
                algorithms: 'Cálculo de posiciones planetarias y reducción numerológica de ciclos de vida.',
                tech: 'JavaScript matemático, Canvas/CSS esotérico.',
                apis: 'Procesamiento en cliente offline.',
                backendId: 'oraculo-vedico'
            }
        },
        {
            id: 'reloj-carmesi',
            category: 'tool',
            era: '1982 LED DISPLAY',
            icon: '🔴',
            title: 'RELOJ CARMESÍ & ALARMA',
            subtitle: 'Display LED minimalista de alta visibilidad y cronometría exacta',
            badge: 'LED DIGITAL',
            rating: '★★★★☆',
            tags: ['CSS Clamp()', 'Aria Accessibility', 'Alta Visibilidad'],
            url: 'tools/RelojHora-Rojo/index.html',
            featured: false,
            specs: {
                arch: 'Display tipográfico de máxima legibilidad optimizado para pantallas de cabecera y HUD de streaming.',
                algorithms: 'Escalado responsivo fluido mediante clamp() y ciclo de sincronización a milisegundo exacto.',
                tech: 'HTML5 semántico con atributos ARIA, JavaScript estricto.',
                apis: 'Intl.DateTimeFormat.',
                backendId: 'reloj-carmesi'
            }
        },
        {
            id: 'chrono-red',
            category: 'tool',
            era: '1985 DUAL CLOCK',
            icon: '◷',
            title: 'CHRONO-RED DESPERTADOR',
            subtitle: 'Reloj despertador de cabecera con alarmas y hora local',
            badge: 'DESPERTADOR',
            rating: '★★★★☆',
            tags: ['Alarmas', 'Hora Mundial', 'Web Audio Alert'],
            url: 'tools/alarma-rojo-reloj/index.html',
            featured: false,
            specs: {
                arch: 'Sistema de reloj con cola de alarmas programables en cliente.',
                algorithms: 'Comprobación de umbral de tiempo en bucle de baja latencia con disparo de sintetizador de audio de alarma.',
                tech: 'HTML5, Web Audio API, LocalStorage.',
                apis: 'AudioContext nativo.',
                backendId: 'chrono-red'
            }
        },
        {
            id: 'cyberenterados-news',
            category: 'tool',
            era: 'PORTAL WEB',
            icon: '↗',
            title: 'CYBERENTERADOS NEWS',
            subtitle: 'Sitio oficial de noticias, divulgación y búnker de la comunidad',
            badge: 'COMUNIDAD',
            rating: '★★★★★',
            tags: ['Portal Web', 'Noticias', 'Cyberpunk', 'Artículos'],
            url: 'https://www.cyberenterados.com.ar',
            isExternal: true,
            featured: false,
            specs: {
                arch: 'Plataforma oficial de publicación de CyberEnterados para difusión de proyectos de ciberseguridad, gaming y cultura tech.',
                algorithms: 'Diseño responsivo y entrega de contenidos en la red.',
                tech: 'HTML5, CSS3, JavaScript.',
                apis: 'Servicios web externos de CyberEnterados.',
                backendId: 'news'
            }
        },
        {
            id: 'generador-qr',
            category: 'tool',
            era: '2026 QR ENGINE',
            icon: '▦',
            title: 'LIBRE QR STUDIOS',
            subtitle: 'Generador profesional y personalizador de códigos QR avanzados',
            badge: 'UTILIDAD',
            rating: '★★★★★',
            tags: ['Códigos QR', 'Libre QR Studios', 'SVG / Canvas', 'Descarga'],
            url: 'https://www.libreqrstudios.com.ar',
            isExternal: true,
            featured: false,
            specs: {
                arch: 'Motor de generación de códigos QR matriciales con soporte para SVG vectorial de alta resolución y opciones de color corporativo.',
                algorithms: 'Codificación Reed-Solomon de corrección de errores (ECC) y enmascaramiento bidimensional.',
                tech: 'Libre QR Studios web engine.',
                apis: 'Descarga vectorial PNG/SVG.',
                backendId: 'qr'
            }
        }
    ];

    // ═══ ESTADO DE LA TIENDA ARCADE ═══
    let activeCategory = 'all';
    let searchQuery = '';
    let virtualCredits = 2;

    // ═══ ELEMENTOS DEL DOM ═══
    const elGrid = document.getElementById('arcadeGrid');
    const elSearch = document.getElementById('arcadeSearch');
    const elFilterBtns = document.querySelectorAll('.store-filter-btn');
    const elCatalogCount = document.getElementById('catalogCount');
    const elEmptyState = document.getElementById('emptyState');
    const elInsertCoinBtn = document.getElementById('btnInsertCoin');
    const elCreditsDisplay = document.getElementById('creditsCount');
    const elSpecsModal = document.getElementById('specsModal');
    const elAuthModal = document.getElementById('authModal');
    const elPilotAlias = document.getElementById('pilotAlias');
    const elPilotRep = document.getElementById('pilotReputation');
    const elBtnAuth = document.getElementById('btnAuthTrigger');
    const elSysStatus = document.getElementById('sysBackendStatus');

    // ═══ INICIALIZACIÓN ═══
    function init() {
        renderCatalog();
        setupFilters();
        setupSearch();
        setupInsertCoin();
        setupAuthSystem();
        setupSpecsModal();
        setupSoundToggle();
        updatePilotUI();
        checkBackendHealth();
        setInterval(checkBackendHealth, 30000);
        setInterval(updateClock, 1000);
        updateClock();
    }

    // ═══ RENDER DEL CATÁLOGO ARCADE STORE ═══
    function renderCatalog() {
        if (!elGrid) return;

        const normalizedQuery = searchQuery.toLowerCase().trim();

        const filtered = CATALOG.filter(item => {
            const matchesCategory =
                activeCategory === 'all' ||
                (activeCategory === 'games' && item.category === 'game') ||
                (activeCategory === 'tools' && item.category === 'tool') ||
                (activeCategory === 'featured' && item.featured);

            const matchesSearch =
                !normalizedQuery ||
                item.title.toLowerCase().includes(normalizedQuery) ||
                item.subtitle.toLowerCase().includes(normalizedQuery) ||
                item.era.toLowerCase().includes(normalizedQuery) ||
                item.tags.some(tag => tag.toLowerCase().includes(normalizedQuery));

            return matchesCategory && matchesSearch;
        });

        elGrid.innerHTML = '';

        if (filtered.length === 0) {
            if (elEmptyState) elEmptyState.style.display = 'block';
            if (elCatalogCount) elCatalogCount.textContent = '0 EJECUTABLES ENCONTRADOS';
            return;
        }

        if (elEmptyState) elEmptyState.style.display = 'none';
        if (elCatalogCount) elCatalogCount.textContent = `${filtered.length} EJECUTABLES DISPONIBLES`;

        filtered.forEach(item => {
            const card = document.createElement('article');
            card.className = `arcade-card ${item.category === 'game' ? 'arcade-card--game' : 'arcade-card--tool'}`;
            card.dataset.id = item.id;

            const tagsHTML = item.tags.map(t => `<span class="card-tag">${t}</span>`).join('');

            card.innerHTML = `
                <div class="card-marquee">
                    <span class="marquee-era">${item.era}</span>
                    <span class="marquee-badge">${item.badge}</span>
                </div>
                <div class="card-body">
                    <div class="card-header-row">
                        <div class="card-avatar">${item.icon}</div>
                        <div class="card-title-col">
                            <h3 class="card-title">${item.title}</h3>
                            <div class="card-rating">${item.rating}</div>
                        </div>
                    </div>
                    <p class="card-desc">${item.subtitle}</p>
                    <div class="card-tags-row">${tagsHTML}</div>
                </div>
                <div class="card-actions">
                    <a href="${item.url}" ${item.isExternal ? 'target="_blank" rel="noopener noreferrer"' : 'target="_blank"'} class="arcade-btn arcade-btn--launch">
                        <span>🕹️ ${item.category === 'game' ? 'INSERT COIN / JUGAR' : 'EJECUTAR'} ↗</span>
                    </a>
                    <button type="button" class="arcade-btn arcade-btn--specs" data-specs-id="${item.id}">
                        <span>🔍 ANALIZAR SPECS</span>
                    </button>
                </div>
            `;

            // Sonidos interactivos
            card.addEventListener('mouseenter', () => NexusAudio.hover());
            const launchBtn = card.querySelector('.arcade-btn--launch');
            launchBtn.addEventListener('click', () => {
                NexusAudio.insertCoin();
            });

            const specsBtn = card.querySelector('.arcade-btn--specs');
            specsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openSpecsModal(item);
            });

            elGrid.appendChild(card);
        });
    }

    // ═══ FILTROS ═══
    function setupFilters() {
        elFilterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                NexusAudio.buttonClick();
                elFilterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeCategory = btn.dataset.filter || 'all';
                renderCatalog();
            });
        });
    }

    // ═══ BÚSQUEDA ═══
    function setupSearch() {
        if (!elSearch) return;
        elSearch.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderCatalog();
        });
    }

    // ═══ SISTEMA INSERT COIN (Sonido arcade y créditos) ═══
    function setupInsertCoin() {
        if (!elInsertCoinBtn) return;
        elInsertCoinBtn.addEventListener('click', () => {
            virtualCredits += 1;
            if (elCreditsDisplay) {
                elCreditsDisplay.textContent = String(virtualCredits).padStart(2, '0');
            }
            NexusAudio.insertCoin();

            // Animación en el botón
            elInsertCoinBtn.classList.add('coin-inserted');
            setTimeout(() => elInsertCoinBtn.classList.remove('coin-inserted'), 400);
        });
    }

    // ═══ MODAL DE INSPECCIÓN TÉCNICA / ANALIZADOR DE SPECS ═══
    function setupSpecsModal() {
        const closeBtn = document.getElementById('specsModalClose');
        const modalBackdrop = document.getElementById('specsModalBackdrop');

        const closeModal = () => {
            if (elSpecsModal) elSpecsModal.classList.remove('active');
            NexusAudio.buttonClick();
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elSpecsModal && elSpecsModal.classList.contains('active')) {
                closeModal();
            }
        });
    }

    function openSpecsModal(item) {
        NexusAudio.scanSpecs();

        document.getElementById('modalSpecIcon').textContent = item.icon;
        document.getElementById('modalSpecTitle').textContent = item.title;
        document.getElementById('modalSpecEra').textContent = item.era;
        document.getElementById('modalSpecCategory').textContent = item.category === 'game' ? 'JUEGO ARCADE RETRO' : 'HERRAMIENTA / SISTEMA';
        document.getElementById('modalSpecDesc').textContent = item.subtitle;

        document.getElementById('modalSpecArch').textContent = item.specs.arch;
        document.getElementById('modalSpecAlgorithms').textContent = item.specs.algorithms;
        document.getElementById('modalSpecTech').textContent = item.specs.tech;
        document.getElementById('modalSpecApis').textContent = item.specs.apis;

        // Botón directo para lanzarlo
        const launchActionBtn = document.getElementById('modalSpecLaunchBtn');
        if (launchActionBtn) {
            launchActionBtn.href = item.url;
            launchActionBtn.onclick = () => NexusAudio.insertCoin();
        }

        // Consultar récord del piloto si está logueado
        const statsBox = document.getElementById('modalSpecPilotStats');
        const token = localStorage.getItem('nexus_token');
        if (token && item.specs.backendId) {
            statsBox.innerHTML = '<span class="t-amber">> CONSULTANDO TELEMETRÍA EN MONGODB ATLAS...</span>';
            fetch(`${API_BASE}/games/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (data.pilot && data.pilot.games_stats) {
                    const stats = data.pilot.games_stats[item.specs.backendId];
                    if (stats && stats.matches_played > 0) {
                        statsBox.innerHTML = `
                            <div class="stat-pill"><span class="lbl">HIGH SCORE:</span> <span class="val t-green">${stats.high_score}</span></div>
                            <div class="stat-pill"><span class="lbl">MÁX NIVEL:</span> <span class="val t-amber">${stats.max_level}</span></div>
                            <div class="stat-pill"><span class="lbl">PARTIDAS:</span> <span class="val t-dim">${stats.matches_played}</span></div>
                        `;
                    } else {
                        statsBox.innerHTML = '<span class="t-dim">> SIN SESIONES REGISTRADAS PARA ESTE PILOTO.</span>';
                    }
                }
            })
            .catch(() => {
                statsBox.innerHTML = '<span class="t-dim">> MODO LOCAL / INVITADO.</span>';
            });
        } else {
            statsBox.innerHTML = '<span class="t-dim">> INICIA SESIÓN COMO PILOTO PARA REGISTRAR PUNTAJES.</span>';
        }

        if (elSpecsModal) elSpecsModal.classList.add('active');
    }

    // ═══ SISTEMA DE AUTENTICACIÓN PILOTO (LOGIN / REGISTER CON BACKEND) ═══
    function setupAuthSystem() {
        const btnClose = document.getElementById('authModalClose');
        const backdrop = document.getElementById('authModalBackdrop');
        const form = document.getElementById('arcadeAuthForm');
        const toggleBtn = document.getElementById('authModeToggle');
        const usernameGroup = document.getElementById('authUsernameGroup');
        const submitBtn = document.getElementById('authSubmitBtn');
        const modalTitle = document.getElementById('authModalTitle');
        const authStatus = document.getElementById('authStatusMessage');

        let mode = 'LOGIN';

        if (elBtnAuth) {
            elBtnAuth.addEventListener('click', () => {
                NexusAudio.buttonClick();
                if (localStorage.getItem('nexus_token')) {
                    // Cerrar sesión
                    localStorage.removeItem('nexus_token');
                    localStorage.removeItem('nexus_pilot');
                    NexusAudio.buttonClick();
                    updatePilotUI();
                } else {
                    if (elAuthModal) elAuthModal.classList.add('active');
                }
            });
        }

        const closeAuth = () => {
            if (elAuthModal) elAuthModal.classList.remove('active');
            NexusAudio.buttonClick();
        };

        if (btnClose) btnClose.addEventListener('click', closeAuth);
        if (backdrop) backdrop.addEventListener('click', closeAuth);

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                NexusAudio.buttonClick();
                if (mode === 'LOGIN') {
                    mode = 'REGISTER';
                    modalTitle.textContent = '[ RECLUTAR NUEVO PILOTO ]';
                    usernameGroup.style.display = 'block';
                    document.getElementById('authUsername').required = true;
                    submitBtn.textContent = '[ REGISTRAR PILOTO ► ]';
                    toggleBtn.textContent = '¿Ya tienes credenciales? Iniciar Sesión';
                } else {
                    mode = 'LOGIN';
                    modalTitle.textContent = '[ IDENTIFICACIÓN DE PILOTO ]';
                    usernameGroup.style.display = 'none';
                    document.getElementById('authUsername').required = false;
                    submitBtn.textContent = '[ LOG_IN ► ]';
                    toggleBtn.textContent = '¿Nuevo recluta? Crear cuenta de piloto';
                }
            });
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                NexusAudio.buttonClick();

                const email = document.getElementById('authEmail').value;
                const password = document.getElementById('authPassword').value;
                const username = document.getElementById('authUsername').value;

                authStatus.textContent = 'ESTABLECIENDO ENLACE CON MONGODB ATLAS...';
                authStatus.className = 'auth-status-msg t-amber';

                const endpoint = mode === 'LOGIN' ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`;
                const payload = mode === 'LOGIN' ? { email, password } : { username, email, password };

                try {
                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        throw new Error(data.error || 'Credenciales no reconocidas por el búnker.');
                    }

                    if (mode === 'LOGIN') {
                        localStorage.setItem('nexus_token', data.token);
                        localStorage.setItem('nexus_pilot', JSON.stringify(data.pilot));
                        authStatus.textContent = `ACCESO AUTORIZADO: ${data.pilot.username}`;
                        authStatus.className = 'auth-status-msg t-green';
                        NexusAudio.success();
                        setTimeout(() => {
                            closeAuth();
                            updatePilotUI();
                        }, 1000);
                    } else {
                        authStatus.textContent = 'PILOTO RECLUTADO. INICIANDO SESIÓN...';
                        authStatus.className = 'auth-status-msg t-green';
                        NexusAudio.success();
                        // Auto-login
                        setTimeout(async () => {
                            const loginRes = await fetch(`${API_BASE}/auth/login`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email, password })
                            });
                            const loginData = await loginRes.json();
                            if (loginRes.ok) {
                                localStorage.setItem('nexus_token', loginData.token);
                                localStorage.setItem('nexus_pilot', JSON.stringify(loginData.pilot));
                                closeAuth();
                                updatePilotUI();
                            }
                        }, 1200);
                    }
                } catch (err) {
                    authStatus.textContent = `FALLO: ${err.message}`;
                    authStatus.className = 'auth-status-msg t-red';
                    NexusAudio.error();
                }
            });
        }
    }

    function updatePilotUI() {
        const token = localStorage.getItem('nexus_token');
        const pilotRaw = localStorage.getItem('nexus_pilot');

        if (token && pilotRaw) {
            try {
                const pilot = JSON.parse(pilotRaw);
                if (elPilotAlias) elPilotAlias.textContent = pilot.username.toUpperCase();
                if (elPilotRep) elPilotRep.textContent = pilot.reputation?.title || 'NIVEL 1 - NOVATO';
                if (elBtnAuth) elBtnAuth.textContent = '[ DESCONECTAR ⏻ ]';
            } catch (e) {
                fallbackPilotUI();
            }
        } else {
            fallbackPilotUI();
        }
    }

    function fallbackPilotUI() {
        if (elPilotAlias) elPilotAlias.textContent = 'PILOTO_INVITADO';
        if (elPilotRep) elPilotRep.textContent = 'MODO ARCADE LOCAL';
        if (elBtnAuth) elBtnAuth.textContent = '[ IDENTIFICARSE 👤 ]';
    }

    // ═══ ESTADO DEL SERVIDOR BACKEND EN TIEMPO REAL ═══
    async function checkBackendHealth() {
        if (!elSysStatus) return;
        try {
            const res = await fetch(`${SERVER_ROOT}/`, { signal: AbortSignal.timeout(2500) });
            if (res.ok) {
                elSysStatus.innerHTML = '<span class="status-dot green">●</span> KERNEL MONGODB: ONLINE';
            } else {
                elSysStatus.innerHTML = '<span class="status-dot amber">●</span> KERNEL: DEGRADADO';
            }
        } catch {
            elSysStatus.innerHTML = '<span class="status-dot red">●</span> KERNEL: OFFLINE (MODO LOCAL)';
        }
    }

    // ═══ RELOJ ═══
    function updateClock() {
        const el = document.getElementById('arcadeSysClock');
        if (!el) return;
        const now = new Date();
        el.textContent = now.toLocaleTimeString('es-AR', { hour12: false });
    }

    // ═══ TOGGLE DE SONIDO ═══
    function setupSoundToggle() {
        const btn = document.getElementById('btnSoundMute');
        const icon = document.getElementById('soundMuteIcon');
        if (!btn || !icon) return;

        btn.addEventListener('click', () => {
            const isEnabled = NexusAudio.toggle();
            icon.textContent = isEnabled ? '🔊' : '🔇';
            if (isEnabled) NexusAudio.buttonClick();
        });
    }

    // ═══ AUTO-ARRANQUE ═══
    document.addEventListener('DOMContentLoaded', () => {
        // Desbloqueo de AudioContext al primer click
        const unlock = () => {
            NexusAudio.init();
            document.removeEventListener('click', unlock);
            document.removeEventListener('keydown', unlock);
        };
        document.addEventListener('click', unlock);
        document.addEventListener('keydown', unlock);

        init();
    });

})();
