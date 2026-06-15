/* ════════════════════════════════════════
   CYBERENTERADOS NEXUS — KERNEL LOGIC
   ════════════════════════════════════════ */

(() => {
  'use strict';

  const elClock = document.getElementById('sys-clock');
  const elLog = document.getElementById('nexus-log-msg');

  // Reloj de Telemetría
  const updateClock = () => {
    const n = new Date();
    if(elClock) {
      elClock.textContent = 
        String(n.getHours()).padStart(2,'0') + ':' + 
        String(n.getMinutes()).padStart(2,'0') + ':' + 
        String(n.getSeconds()).padStart(2,'0');
    }
  };
  setInterval(updateClock, 1000);
  updateClock();

  // Función de Acceso Denegado para los juegos en desarrollo
  window.accessDenied = (executableName) => {
    if(elLog) {
      elLog.innerHTML = `<span class="danger">ERROR: ACCESO DENEGADO A ${executableName}. El archivo aún está en fase de compilación en el búnker.</span>`;
      
      // Feedback visual y háptico de error
      if (navigator.vibrate) try { navigator.vibrate([100, 50, 100]); } catch(e){}
      
      setTimeout(() => {
        elLog.innerHTML = `SISTEMA ESTABLE. ESPERANDO NUEVOS COMANDOS...`;
      }, 3000);
    }
  };

  // Chequeo de credenciales locales (Mock de Sesión)
  const syncProfile = () => {
    const alias = localStorage.getItem('pilot_alias');
    if(alias) {
      document.getElementById('global-alias').textContent = alias;
      elLog.textContent = `BIENVENIDO DE VUELTA, ${alias}.`;
    }
  };

  syncProfile();

})();