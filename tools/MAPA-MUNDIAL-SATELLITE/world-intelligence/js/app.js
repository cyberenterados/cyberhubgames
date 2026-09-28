/**
 * app.js - Orquestador principal de la suite OSINT World Intelligence Map
 */

const App = {
  async init() {
    console.log("Inicializando OSINT World Intelligence Suite...");

    try {
      // 1. Inicializar bases de datos y motores de cálculo
      await Promise.all([
        window.TimezoneEngine.init(),
        window.LocationIntelligence.init(),
        window.RadioIntelligence ? window.RadioIntelligence.init() : Promise.resolve()
      ]);

      // 2. Inicializar Interfaz de Usuario y HUD
      window.UIController.init();

      // 3. Inicializar Motores de Cartografía (2D Leaflet + 3D Globe + Satélite)
      await window.MapEngine.init((lat, lon, cityMeta) => {
        this.handleLocationSelect(lat, lon, cityMeta);
      });

      console.log("Sistema cartográfico y cronometría táctica en línea.");

      // Seleccionar por defecto una ciudad insignia (ej. Buenos Aires o Londres)
      setTimeout(() => {
        this.handleLocationSelect(-34.6037, -58.3816, {
          name: "Buenos Aires",
          flag: "🇦🇷",
          countryCode: "AR",
          country: "Argentina",
          timezone: "America/Argentina/Buenos_Aires",
          defaultOffset: "UTC-3"
        });
      }, 800);

    } catch (err) {
      console.error("Error crítico durante la inicialización de la suite:", err);
    }
  },

  /**
   * Manejador central cuando se selecciona un punto en el mapa o globo
   */
  async handleLocationSelect(lat, lon, cityMeta = null) {
    if (window.UIController) {
      await window.UIController.displayIntelligence(lat, lon, cityMeta);
    }
  }
};

window.App = App;

// Arrancar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
