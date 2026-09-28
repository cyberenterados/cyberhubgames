# 🌍 OSINT World Intelligence & Timezone Explorer 🛰️

Una suite web táctica y multiplataforma de exploración geoespacial e inteligencia de fuentes abiertas (OSINT), inspirada en los centros de mando globales y mapas de husos horarios de alta precisión.

![Visual Inspiration](img/ChatGPT%20Image%2012%20sept%202026,%2009_58_46.png)

---

## ⚡ Características Principales

### 1. 🕐 Cronometría Táctica Global y Husos Horarios
- **Reloj Maestro UTC**: Cronómetro digital de alta precisión en vivo (`HH:mm:ss UTC`) con fecha completa en español y detector de barrido de radar.
- **Franja Superior de Husos (UTC-12 a UTC+14)**: Selector interactivo por bandas longitudinales de 15°.
- **Reloj Local Instantáneo**: Al hacer clic en cualquier punto de la Tierra, calcula la hora local exacta, compensación UTC (`UTC-03:00`, etc.) y diferencia horaria relativa respecto a tu navegador.
- **Barra de Metrópolis Mundiales**: Acceso directo con relojes en vivo a las ciudades insignia (UTC, Nueva York, Londres, Madrid, Tokio, Sídney, Los Ángeles, Buenos Aires).

### 2. 🗺️ Modos de Cartografía Multiplataforma
- **🗺️ Modo Atlas 2D (Leaflet Táctico)**:
  - Bandas de husos horarios cromáticas continuas (turquesa -> verde esmeralda -> amarillo ámbar -> naranja -> escarlata -> magenta -> violeta) fieles al diseño de referencia.
  - Terminador solar día/noche en tiempo real generado mediante cálculos astronómicos de NOAA (`SunCalc`).
  - Etiquetas oceánicas estilizadas y rosa de los vientos militar superior derecha.
  - Badges tácticos flotantes de metrópolis con bandera, hora en vivo y etiqueta UTC.
- **🌍 Modo Globo 3D (Three.js WebGL)**:
  - Esfera terrestre 3D interactiva con iluminación solar dinámica orientada hacia el punto subsolar actual.
  - Rotación libre táctil/mouse, zoom y botón para activar/pausar la rotación orbital automática.
  - Raycaster esférico que permite hacer clic sobre cualquier latitud/longitud del planeta en 3D.
- **🛰️ Modo Satélite HD (Esri World Imagery)**:
  - Vista aérea continua de alta resolución global para inspección a nivel de edificios, pistas de aterrizaje y puertos.

### 3. 🎯 Dossier de Inteligencia OSINT al hacer Clic
Al hacer clic en cualquier lugar (tierra firme u océanos):
- **Coordenadas**: Formato Decimal (`34.0522° N, 118.2437° W`) y Militar DMS (`34° 03' 08" N // 118° 14' 37" W`).
- **Reconocimiento Satelital Orbital**: Visor con retícula militar, animación de barrido de escáner y controles de zoom óptico (`Z:10` a `Z:17`) alimentado por Esri Earth Observation.
- **Telemetría Solar**: Indicador de Día / Noche / Crepúsculo, ángulo de elevación del Sol, horas de Amanecer, Mediodía Solar y Atardecer en hora local.
- **Meteorología en Tiempo Real (Open-Meteo)**: Temperatura (°C y °F), estado del cielo con iconografía, velocidad y dirección cardinal del viento, humedad relativa, presión barométrica (hPa) y evaluación táctica operativa.
- **Geocodificación & Jurisdicción**: Nombre de ciudad, provincia, país, capital, moneda oficial y continente. Si se hace clic en altamar, activa el radar de cuencas oceánicas (Atlántico, Pacífico, Índico, etc.).
- **Dossier Enciclopédico (Wikipedia REST API)**: Resumen histórico, geográfico y fotografía representativa del área.
- **Exportación Táctica**: Botón `COPIAR REPORTE OSINT` para transferir un informe estructurado al portapapeles.

---

## 📁 Estructura del Proyecto

```text
reloj-web6/
│
├── index.html                  # Interfaz principal HUD táctica
│
├── css/
│   ├── style.css               # Variables, estética cyber-OSINT, layout y tipografías
│   ├── map.css                 # Estilos de mapa 2D, Three.js 3D, badges de ciudades y rosa náutica
│   └── panel.css               # Dossier OSINT lateral, visor satelital y telemetría
│
├── js/
│   ├── app.js                  # Orquestador principal de la suite
│   ├── map.js                  # Motores de mapas (Leaflet + Three.js 3D Globe + Satélite)
│   ├── timezone.js             # Motor IANA de husos horarios, offsets UTC y reloj maestro
│   ├── location.js             # Geocodificación inversa (Nominatim OSM) y base oceánica
│   ├── weather.js              # Cliente de la API Open-Meteo libre de costo y claves
│   ├── satellite.js            # Módulo de reconocimiento satelital orbital (Esri World Imagery)
│   ├── sun.js                  # Algoritmos astronómicos solares (NOAA) y terminador día/noche
│   └── ui.js                   # Controladores de interfaz, barras interactivas y modales
│
├── data/
│   ├── countries.json          # Metadatos territoriales, banderas emoji y capitales
│   └── timezone-data.json      # Catálogo de husos horarios mundiales y metrópolis tácticas
│
└── assets/
    └── icons/
        └── compass.svg         # Rosa de los vientos vectorial táctica
```

---

## 🚀 Cómo Ejecutar la Aplicación

No requiere instalaciones complejas ni compilación de paquetes. Puedes ejecutarlo con cualquier servidor local estático:

### Opción 1: Con Python (Recomendado)
```bash
python -m http.server 8000
```
Luego abre tu navegador en: [http://localhost:8000](http://localhost:8000)

### Opción 2: Con Node.js
```bash
npx serve .
```

### Opción 3: Abrir directamente
Puedes abrir `index.html` directamente en tu navegador (se recomienda usar un servidor local para que las peticiones `fetch()` a los archivos JSON locales funcionen con todas las políticas CORS).

---

## 🐍 Expansión Futura con Backend Python (Fase 2)

Cuando desees llevar esta herramienta a un nivel de inteligencia de grado operativo, el backend en Python (FastAPI) permitirá:
1. **Radar de Tráfico Aéreo (ADS-B / OpenSky Network)**: Cruzar coordenadas con vuelos comerciales y militares en tiempo real.
2. **Monitoreo Sísmico Global (USGS API)**: Detección y alertas de terremotos recientes en un radio de acción.
3. **Scraping de Noticias Locales (BeautifulSoup / Scrapy)**: Extracción en vivo de noticias locales del país seleccionado.
4. **Caché Distribuido (Redis / SQLite)**: Almacenamiento eficiente de imágenes y reportes frecuentes para ultra-alta velocidad.
