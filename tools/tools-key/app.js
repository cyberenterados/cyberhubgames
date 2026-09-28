const keyNameEl = document.getElementById('key-name');
const keyCodeEl = document.getElementById('key-code');

// Interceptar cualquier pulsación global
window.addEventListener('keydown', (e) => {
  // Evitar que teclas como Tab, Alt o Flechas muevan la página o cambien de foco
  e.preventDefault();

  const code = e.code; // Identificador físico único (ej. 'KeyA', 'ArrowLeft')
  
  keyNameEl.textContent = e.key === ' ' ? 'Espacio' : e.key;
  keyCodeEl.textContent = code;

  const keyElement = document.querySelector(`.key[data-key="${code}"]`);
  if (keyElement) {
    keyElement.classList.add('active');
    keyElement.classList.add('tested'); // Queda marcada en verde permanente
  }
});

window.addEventListener('keyup', (e) => {
  const code = e.code;
  const keyElement = document.querySelector(`.key[data-key="${code}"]`);
  if (keyElement) {
    keyElement.classList.remove('active');
  }
});