// 1. Inicializar el mapa centrado en un punto y con un nivel de zoom
const map = L.map('map').setView([20, 0], 2);

// 2. Cargar los "Tiles" (El aspecto visual del mapa). Usamos OpenStreetMap por defecto.
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Clave de Mapbox (Idealmente debería venir de tu backend)
const MAPBOX_TOKEN = 'TU_MAPBOX_PUBLIC_TOKEN';

// 3. Evento al hacer clic en cualquier parte del mapa
map.on('click', async function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    // Mostrar un popup de "Cargando..."
    const popup = L.popup()
        .setLatLng(e.latlng)
        .setContent('<p>Recopilando inteligencia...</p>')
        .openOn(map);

    try {
        // A. Obtener nombre del lugar (Reverse Geocoding)
        const nomResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const nomData = await nomResponse.json();
        const placeName = nomData.address.city || nomData.address.country || "Ubicación desconocida";

        // B. Obtener información de Wikipedia
        let infoTexto = "No hay información disponible.";
        if (placeName !== "Ubicación desconocida") {
            const wikiResponse = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${placeName}`);
            if (wikiResponse.ok) {
                const wikiData = await wikiResponse.json();
                infoTexto = wikiData.extract ? wikiData.extract.substring(0, 150) + "..." : infoTexto;
            }
        }

        // C. Obtener Hora Local (Usando World Time API)
        // Nota: En producción, es mejor usar una librería local para evitar rate limits de esta API
        const timeResponse = await fetch(`https://worldtimeapi.org/api/timezone/Etc/GMT${lat > 0 ? '+' : '-'}${Math.abs(Math.round(lng/15))}`); 
        let localTime = "Hora no disponible";
        if (timeResponse.ok) {
            const timeData = await timeResponse.json();
            const dateObj = new Date(timeData.datetime);
            localTime = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }

        // D. Generar URL de la Imagen Satelital (Mapbox Static API)
        const satImageUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lng},${lat},12,0/300x200?access_token=${MAPBOX_TOKEN}`;

        // 4. Inyectar todo en el Popup de Leaflet con HTML y CSS
        const htmlContent = `
            <div class="osint-popup">
                <h3 style="margin:0 0 5px 0;">${placeName}</h3>
                <p style="font-weight:bold; color: #d35400; margin: 0 0 10px 0;">Hora Local: ${localTime}</p>
                <img src="${satImageUrl}" alt="Vista Satelital" style="width:100%; border-radius:5px; border: 1px solid #ccc; margin-bottom: 10px;">
                <p style="font-size: 12px; margin:0; line-height: 1.4;">${infoTexto}</p>
            </div>
        `;

        popup.setContent(htmlContent);

    } catch (error) {
        console.error("Error obteniendo datos OSINT:", error);
        popup.setContent('<p>Error al obtener datos de la ubicación.</p>');
    }
});