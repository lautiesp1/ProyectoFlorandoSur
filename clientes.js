// js/clientes.js

// Devuelve todas las ventas de un cliente
function ventasDeCliente(clienteId) {
  return Storage.get('ventas').filter(v => v.clienteId === clienteId);
}

// Suma el total de todas las compras de un cliente
function totalComprasCliente(clienteId) {
  return ventasDeCliente(clienteId).reduce((s, v) => s + v.total, 0);
}

// Devuelve la fecha de la última compra o null si no tiene
function ultimaCompra(clienteId) {
  const vts = ventasDeCliente(clienteId);
  if (vts.length === 0) return null;
  const sorted = [...vts].sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));
  return new Date(sorted[0].creadoEn);
}

// Genera las iniciales del nombre para el avatar
function iniciales(nombre) {
  return nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// Dibuja la tabla de clientes aplicando el buscador
function renderTabla() {
  let clientes = Storage.get('clientes');
  const q = document.getElementById('buscador').value.toLowerCase();

  if (q) {
    clientes = clientes.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      (c.telefono  && c.telefono.includes(q)) ||
      (c.email     && c.email.toLowerCase().includes(q))
    );
  }

  const tbody = document.getElementById('tabla-clientes');

  if (clientes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6"
          style="text-align:center; padding:24px; color:#FFFFFF">
          No se encontraron clientes
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = clientes.map(c => {
    const total      = totalComprasCliente(c.id);
    const ultima     = ultimaCompra(c.id);
    const fechaStr   = ultima ? ultima.toLocaleDateString('es-AR') : '—';
    const cantVentas = ventasDeCliente(c.id).length;

    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:10px">
            <div class="avatar">${iniciales(c.nombre)}</div>
            <div>
              <span style="font-weight:500">${c.nombre}</span>
              ${c.instagram
                ? `<br><span style="font-size:12px; color:#FFFFFF">
                    ${c.instagram}</span>`
                : ''}
            </div>
          </div>
        </td>
        <td>
          ${c.telefono
            ? `<a href="https://wa.me/${c.telefono.replace(/\D/g,'')}"
                 target="_blank"
                 style="color:var(--green); text-decoration:none; font-weight:500">
                 📱 ${c.telefono}
               </a>`
            : '<span style="color:#FFFFFF">—</span>'}
        </td>
        <td style="color:#FFFFFF">${c.email || '—'}</td>
        <td>
          <span style="font-weight:600">
            $${total.toLocaleString('es-AR')}
          </span>
          <br>
          <span style="font-size:12px; color:#FFFFFF">
            ${cantVentas} compra${cantVentas !== 1 ? 's' : ''}
          </span>
        </td>
        <td style="color:#FFFFFF">${fechaStr}</td>
        <td>
          <div class="td-actions">
            <button class="btn btn-outline btn-sm"
              onclick="verHistorial('${c.id}')">📋 Ver</button>
            <button class="btn btn-outline btn-sm"
              onclick="editarCliente('${c.id}')">✏️</button>
            <button class="btn btn-danger btn-sm"
              onclick="eliminarCliente('${c.id}')">🗑️</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// Abre el modal en modo "agregar" (campos vacíos)
function abrirModalAgregar() {
  document.getElementById('modal-titulo').textContent = 'Nuevo cliente';
  document.getElementById('cli-id').value        = '';
  document.getElementById('cli-nombre').value    = '';
  document.getElementById('cli-telefono').value  = '';
  document.getElementById('cli-email').value     = '';
  document.getElementById('cli-instagram').value = '';
  document.getElementById('cli-notas').value     = '';
  abrirModal('modal-cliente');
}

// Abre el modal en modo "editar" (precarga los datos del cliente)
function editarCliente(id) {
  const c = Storage.findById('clientes', id);
  if (!c) return;
  document.getElementById('modal-titulo').textContent = 'Editar cliente';
  document.getElementById('cli-id').value        = c.id;
  document.getElementById('cli-nombre').value    = c.nombre;
  document.getElementById('cli-telefono').value  = c.telefono  || '';
  document.getElementById('cli-email').value     = c.email     || '';
  document.getElementById('cli-instagram').value = c.instagram || '';
  document.getElementById('cli-notas').value     = c.notas     || '';
  abrirModal('modal-cliente');
}

function guardarCliente() {
  const nombre = document.getElementById('cli-nombre').value.trim();
  if (!nombre) {
    toast('El nombre del cliente es obligatorio.', 'error');
    return;
  }

  const datos = {
    nombre,
    telefono:  document.getElementById('cli-telefono').value.trim(),
    email:     document.getElementById('cli-email').value.trim(),
    instagram: document.getElementById('cli-instagram').value.trim(),
    notas:     document.getElementById('cli-notas').value.trim()
  };

  const id = document.getElementById('cli-id').value;
  if (id) {
    Storage.update('clientes', id, datos);
    toast('Cliente actualizado correctamente', 'success');
  } else {
    Storage.add('clientes', datos);
    toast('Cliente registrado con éxito', 'success');
  }

  cerrarModal('modal-cliente');
  renderTabla();
}

async function eliminarCliente(id) {
  const ok = await confirmar(
    '¿Eliminar cliente?',
    'El cliente se eliminará pero sus ventas quedarán registradas.',
    'Eliminar',
    'btn-danger'
  );
  if (!ok) return;
  Storage.delete('clientes', id);
  toast('Cliente eliminado', 'warn');
  renderTabla();
}

// Abre el modal de historial con todas las compras del cliente
function verHistorial(clienteId) {
  const c      = Storage.findById('clientes', clienteId);
  const ventas = ventasDeCliente(clienteId).reverse();

  document.getElementById('hist-titulo').textContent = `Historial — ${c.nombre}`;

  const cont = document.getElementById('hist-contenido');

  if (ventas.length === 0) {
    cont.innerHTML = `
      <p class="empty-state" style="text-align:center; padding:1rem">
        Este cliente no tiene compras registradas.
      </p>`;
  } else {
    const total = ventas.reduce((s, v) => s + v.total, 0);
    cont.innerHTML = `
      <p style="margin-bottom:12px; font-size:13px; color:var(--muted)">
        ${ventas.length} compra${ventas.length !== 1 ? 's' : ''} •
        Total acumulado:
        <strong style="color:var(--text)">
          $${total.toLocaleString('es-AR')}
        </strong>
      </p>
      ${ventas.map(v => {
        const prods = v.items.map(it => {
          const p = Storage.findById('productos', it.productoId);
          return `${p ? p.nombre : 'Producto eliminado'} ×${it.cantidad}`;
        }).join(', ');
        return `
          <div class="hist-item">
            <div>
              <span style="font-weight:500">
                ${new Date(v.creadoEn).toLocaleDateString('es-AR', {
                  day: '2-digit', month: 'short', year: 'numeric'
                })}
              </span>
              <p class="hist-productos">${prods}</p>
            </div>
            <span style="font-weight:700; font-family:'Syne',sans-serif">
              $${v.total.toLocaleString('es-AR')}
            </span>
          </div>`;
      }).join('')}`;
  }

  abrirModal('modal-historial');
}

// Helpers para abrir y cerrar modales por id
function abrirModal(id)  { document.getElementById(id).classList.add('open'); }
function cerrarModal(id) { document.getElementById(id).classList.remove('open'); }

// Cerrar cada modal al hacer clic fuera del cuadro
['modal-cliente', 'modal-historial'].forEach(id => {
  document.getElementById(id).addEventListener('click', function(e) {
    if (e.target === this) cerrarModal(id);
  });
});

document.addEventListener('DOMContentLoaded', renderTabla);