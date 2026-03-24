// js/ui.js — Sistema de notificaciones y confirmaciones

// ── Contenedor de toasts ──────────────────────
const toastWrap = document.createElement('div');
toastWrap.className = 'toast-wrap';
document.body.appendChild(toastWrap);

// Muestra una notificación flotante
// tipo: 'success' | 'error' | 'warn'
function toast(mensaje, tipo = 'success', duracion = 3500) {
  const iconos = { success: '✅', error: '❌', warn: '⚠️' };
  const t = document.createElement('div');
  t.className = `toast toast-${tipo}`;
  t.innerHTML = `
    <span class="toast-icon">${iconos[tipo]}</span>
    <span class="toast-msg">${mensaje}</span>`;
  toastWrap.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity 0.3s';
    t.style.opacity    = '0';
    setTimeout(() => t.remove(), 300);
  }, duracion);
}

// Modal de confirmación con promesa
// Devuelve true si confirma, false si cancela
function confirmar(titulo, mensaje, btnTexto = 'Eliminar', btnClase = 'btn-danger') {
  return new Promise(resolve => {
    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';

    overlay.innerHTML = `
      <div class="confirm-modal">
        <div class="confirm-icon">🗑️</div>
        <p class="confirm-title">${titulo}</p>
        <p class="confirm-msg">${mensaje}</p>
        <div class="confirm-btns">
          <button class="btn btn-outline" id="btn-cancelar">Cancelar</button>
          <button class="btn ${btnClase}" id="btn-confirmar">${btnTexto}</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    overlay.querySelector('#btn-cancelar').onclick = () => {
      overlay.remove();
      resolve(false);
    };
    overlay.querySelector('#btn-confirmar').onclick = () => {
      overlay.remove();
      resolve(true);
    };
    overlay.onclick = e => {
      if (e.target === overlay) { overlay.remove(); resolve(false); }
    };
  });
}
