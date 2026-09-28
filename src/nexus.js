/* ════════════════════════════════════════
   CYBERENTERADOS NEXUS — KERNEL LOGIC (MEJORADO)
   ════════════════════════════════════════ */

(() => {
  'use strict';

  // Configuración de coordenadas del Backend
  const API_URL = "http://localhost:5000/api/auth";
  const PROFILE_AVATAR_PATH = 'assets/avatars/';

  // Elementos de la Interfaz Base
  const elClock = document.getElementById('sys-clock');
  const elLog = document.getElementById('nexus-log-msg');
  const elAlias = document.getElementById('global-alias');
  const elReputation = document.getElementById('global-reputation');

  // Elementos del Modal de Autenticación
  const elModal = document.getElementById('auth-modal');
  const elAuthForm = document.getElementById('auth-form');
  const elModalTitle = document.getElementById('modal-title');
  const elUsernameGroup = document.getElementById('username-group');
  const elBtnTrigger = document.getElementById('auth-trigger-btn');
  const elBtnToggle = document.getElementById('auth-toggle-btn');
  const elBtnClose = document.getElementById('auth-close-btn');
  const elBtnSubmit = document.getElementById('auth-submit-btn');

  // Estado del Formulario: 'LOGIN' o 'REGISTER'
  let authMode = 'LOGIN';

  // Reloj de Telemetría Nv.1
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
      elLog.innerHTML = `<span class="danger">ERROR: ACCESO DENEGADO A ${executableName}. En fase de compilación en el búnker.</span>`;
      if (navigator.vibrate) try { navigator.vibrate([100, 50, 100]); } catch(e){}
      setTimeout(() => {
        elLog.innerHTML = `SISTEMA ESTABLE. ESPERANDO NUEVOS COMANDOS...`;
      }, 3000);
    }
  };

  // --- CONTROL DEL MODAL DE AUTENTICACIÓN ---
  if(elBtnTrigger) {
    elBtnTrigger.addEventListener('click', () => {
      // Si ya está logueado, el botón servirá para Cerrar Sesión
      if(localStorage.getItem('nexus_token')) {
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('pilot_alias');
        localStorage.removeItem('pilot_reputation');
        location.reload();
      } else {
        elModal.classList.remove('hidden');
      }
    });
  }

  if(elBtnClose) elBtnClose.addEventListener('click', () => elModal.classList.add('hidden'));

  if(elBtnToggle) {
    elBtnToggle.addEventListener('click', () => {
      if(authMode === 'LOGIN') {
        authMode = 'REGISTER';
        elModalTitle.textContent = "[ REGISTRO_DE_NUEVO_PILOTO ]";
        elUsernameGroup.classList.remove('hidden');
        document.getElementById('auth-username').required = true;
        elBtnSubmit.textContent = "[ RECLUTAR ]";
        elBtnToggle.textContent = "[ YA TENGO CUENTA ]";
      } else {
        authMode = 'LOGIN';
        elModalTitle.textContent = "[ ACCESO_AL_NEXUS ]";
        elUsernameGroup.classList.add('hidden');
        document.getElementById('auth-username').required = false;
        elBtnSubmit.textContent = "[ LOG_IN ]";
        elBtnToggle.textContent = "[ CREAR_CUENTA ]";
      }
    });
  }

  // --- ENVÍO DE PAYLOADS AL BACKEND ---
  if(elAuthForm) {
    elAuthForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;
      const username = document.getElementById('auth-username').value;

      const endpoint = authMode === 'LOGIN' ? `${API_URL}/login` : `${API_URL}/register`;
      const bodyData = authMode === 'LOGIN' ? { email, password } : { username, email, password };

      if(elLog) elLog.textContent = "TRANSMITIENDO CREDENCIALES AL BÚNKER...";

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Fallo en la verificación de red.");
        }

        if(authMode === 'LOGIN') {
          // Guardar credenciales autorizadas en LocalStorage
          localStorage.setItem('nexus_token', data.token);
          localStorage.setItem('pilot_alias', data.pilot.username);
          localStorage.setItem('pilot_reputation', data.pilot.reputation.title);
          if (data.pilot.avatar_url) localStorage.setItem('pilot_avatar', data.pilot.avatar_url);

          elModal.classList.add('hidden');
          syncProfile();
        } else {
          // Si se registró con éxito, pasar a modo login automáticamente
          elLog.innerHTML = `<span class="hi">REGISTRO EXITOSO. PROCEDA A INICIAR SESIÓN.</span>`;
          elBtnToggle.click();
          elAuthForm.reset();
        }

      } catch (error) {
        if(elLog) elLog.innerHTML = `<span class="danger">ERROR: ${error.message}</span>`;
      }
    });
  }

  // Sincronización del Perfil con Datos Reales
  const syncProfile = () => {
    const alias = localStorage.getItem('pilot_alias');
    const reputation = localStorage.getItem('pilot_reputation');
    const avatarPath = localStorage.getItem('pilot_avatar');
    const sessionState = document.getElementById('pilot-session-state');
    const isAuthenticated = Boolean(localStorage.getItem('nexus_token'));

    if (sessionState) {
      sessionState.textContent = isAuthenticated ? 'AUTENTICADO' : 'INVITADO';
      sessionState.classList.toggle('is-authenticated', isAuthenticated);
    }
    
    if(alias && elAlias) {
      elAlias.textContent = alias;
      if(elReputation && reputation) elReputation.textContent = reputation;
      if(elBtnTrigger) elBtnTrigger.textContent = "[ CERRAR_SESIÓN ]";
      if (localStorage.getItem('nexus_token')) {
        const avatarEl = document.getElementById('global-avatar');
        if (avatarEl) {
          const resolved = avatarPath || `${PROFILE_AVATAR_PATH}gamer.png`;
          avatarEl.textContent = '🧑‍💻';
          avatarEl.title = alias;
          avatarEl.style.backgroundImage = `url('${resolved}')`;
          avatarEl.style.backgroundSize = 'cover';
          avatarEl.style.backgroundPosition = 'center';
          avatarEl.style.display = 'inline-block';
          avatarEl.style.width = '64px';
          avatarEl.style.height = '64px';
          avatarEl.style.borderRadius = '12px';
        }
      }
      if(elLog) elLog.innerHTML = `<span class="hi">BIENVENIDO DE VUELTA, PILOTO MAESTRO: ${alias}. Enlace seguro activo.</span>`;
    }
  };

  const hydrateProfileFromAPI = async () => {
    if (!localStorage.getItem('nexus_token')) return;

    try {
      const result = await window.cyberHubApi.getProfile();
      const pilot = result?.pilot;
      if (!pilot) return;

      localStorage.setItem('pilot_alias', pilot.username);
      localStorage.setItem('pilot_reputation', pilot.reputation?.title || 'NIVEL 1 - NOVATO');
      if (pilot.avatar_url) {
        localStorage.setItem('pilot_avatar', pilot.avatar_url);
      }
      syncProfile();
    } catch (error) {
      if (elLog) elLog.innerHTML = `<span class="danger">ERROR: ${error.message}</span>`;
    }
  };

  syncProfile();
  hydrateProfileFromAPI();

})();
