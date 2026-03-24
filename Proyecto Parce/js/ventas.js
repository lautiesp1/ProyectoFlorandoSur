// js/ventas.js

let filaCount = 0; // contador para generar ids únicos a cada fila

// ─────────────────────────────────────────────
// TABLA DE VENTAS
// ─────────────────────────────────────────────

function renderTabla() {
  let ventas = [...Storage.get('ventas')].reverse(); // más recientes primero
  const q     = document.getElementById('buscador').value.toLowerCase();
  const fecha = document.getElementById('filtro-fecha').value;

  // Filtro por nombre de cliente
  if (q) {
    ventas = ventas.filter(v => {
      const c = Storage.findById('clientes', v.clienteId);
      return c && c.nombre.toLowerCase().includes(q);
    });
  }

  // Filtro por fecha exacta
  if (fecha) {
    ventas = ventas.filter(v =>
      new Date(v.creadoEn).toISOString().slice(0, 10) === fecha
    );
  }

  const tbody  = document.getElementById('tabla-ventas');
  const resumen = document.getElementById('resumen-total');

  if (ventas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7"
          style="text-align:center; padding:24px; color:#FFFFFF">
          No se encontraron ventas
        </td>
      </tr>`;
    resumen.textContent = '';
    return;
  }

  tbody.innerHTML = ventas.map(v => {
    const cliente   = Storage.findById('clientes', v.clienteId);
    const nombre    = cliente ? cliente.nombre : 'Cliente eliminado';
    const inic      = nombre.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
    const totalUnid = v.items.reduce((s, i) => s + i.cantidad, 0);

    // Lista de productos resumida para mostrar en la tabla
    // Solo nombres, la cantidad ya aparece en la columna Unidades
const prods = v.items.map(i => {
  const p = Storage.findById('productos', i.productoId);
  return p ? p.nombre : 'Eliminado';
}).join(', ');

    return `
      <tr>
        <td style="white-space:nowrap; color:#FFFFFF">
          ${new Date(v.creadoEn).toLocaleDateString('es-AR', {
            day: '2-digit', month: 'short', year: 'numeric'
          })}
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:8px">
            <div class="avatar" style="width:30px; height:30px; font-size:11px">
              ${inic}
            </div>
            <span style="font-weight:500">${nombre}</span>
          </div>
        </td>
        <td style="color:#FFFFFF; font-size:13px;
                   max-width:200px; overflow:hidden;
                   text-overflow:ellipsis; white-space:nowrap"
            title="${prods}">
          ${prods}
        </td>
        <td style="text-align:center">${totalUnid}</td>
        <td>
          <span class="badge badge-info">${v.metodoPago || '—'}</span>
        </td>
        <td style="font-weight:700; font-family:'Syne',sans-serif">
          $${v.total.toLocaleString('es-AR')}
        </td>
        <td>
          <div class="td-actions">
            <button class="btn btn-outline btn-sm"
              onclick="verDetalle('${v.id}')">📋 Ver</button>
            <button class="btn btn-danger btn-sm"
              onclick="eliminarVenta('${v.id}')">🗑️</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  // Resumen del total visible con los filtros aplicados
  const totalFiltrado = ventas.reduce((s, v) => s + v.total, 0);
  resumen.innerHTML = `
    <strong>${ventas.length}</strong>
    venta${ventas.length !== 1 ? 's' : ''} —
    Total: <strong style="color:var(--accent)">
      $${totalFiltrado.toLocaleString('es-AR')}
    </strong>`;
}

// ─────────────────────────────────────────────
// MODAL NUEVA VENTA
// ─────────────────────────────────────────────

function abrirModalVenta() {
  // Cargar clientes en el select
  const clientes = Storage.get('clientes');
  const sel = document.getElementById('venta-cliente');
  sel.innerHTML = '<option value="">Seleccioná un cliente...</option>' +
    clientes.map(c =>
      `<option value="${c.id}">${c.nombre}</option>`
    ).join('');

  // Limpiar todo y agregar una fila vacía
  filaCount = 0;
  document.getElementById('productos-filas').innerHTML = '';
  agregarFila();

  document.getElementById('venta-notas').value = '';
  document.getElementById('venta-pago').selectedIndex = 0;
  actualizarTotal();
  document.getElementById('modal-venta').classList.add('open');
}

function cerrarModalVenta() {
  document.getElementById('modal-venta').classList.remove('open');
}

// Agrega una fila con selector de producto y campo de cantidad
function agregarFila() {
  const productos = Storage.get('productos');

  if (productos.length === 0) {
    alert('Primero agregá productos en el módulo de Inventario.');
    return;
  }

  filaCount++;
  const filaId = 'fila-' + filaCount;
  const div = document.createElement('div');
  div.className = 'prod-row';
  div.id = filaId;

  // Opciones del select con precio y stock como data attributes
  const opciones = productos.map(p =>
    `<option value="${p.id}"
             data-precio="${p.precio}"
             data-stock="${p.stock}">
      ${p.nombre} (stock: ${p.stock})
    </option>`
  ).join('');

  div.innerHTML = `
    <select onchange="actualizarTotal()">
      <option value="">Seleccioná un producto...</option>
      ${opciones}
    </select>
    <input
      type="number"
      value="1"
      min="1"
      placeholder="Cant."
      oninput="actualizarTotal()"
    />
    <button class="btn-remove" onclick="eliminarFila('${filaId}')">✕</button>`;

  document.getElementById('productos-filas').appendChild(div);
  actualizarTotal();
}

// Elimina una fila de producto
function eliminarFila(filaId) {
  document.getElementById(filaId).remove();
  actualizarTotal();
}

// Recalcula el total en tiempo real cada vez que cambia algo
function actualizarTotal() {
  let total = 0;

  document.querySelectorAll('.prod-row').forEach(fila => {
    const sel  = fila.querySelector('select');
    const cant = Number(fila.querySelector('input')?.value) || 0;

    if (sel && sel.value) {
      const precio = Number(sel.selectedOptions[0].dataset.precio) || 0;
      total += precio * cant;
    }
  });

  document.getElementById('venta-total-display').textContent =
    'Total: $' + total.toLocaleString('es-AR');
}

function guardarVenta() {
  const clienteId = document.getElementById('venta-cliente').value;
  if (!clienteId) {
    toast('Seleccioná un cliente para continuar.', 'error');
    return;
  }

  const items = [];
  let total  = 0;
  let valido = true;

  document.querySelectorAll('.prod-row').forEach(fila => {
    const sel  = fila.querySelector('select');
    const cant = Number(fila.querySelector('input')?.value) || 0;
    if (!sel || !sel.value) return;

    const prod = Storage.findById('productos', sel.value);
    if (!prod) return;

    if (cant <= 0) {
      toast('La cantidad debe ser mayor a 0.', 'error');
      valido = false; return;
    }

    // ── Alerta de sin stock ──
    if (prod.stock === 0) {
      toast(`"${prod.nombre}" no tiene stock disponible.`, 'error');
      valido = false; return;
    }

    // ── Alerta de stock insuficiente ──
    if (cant > prod.stock) {
      toast(`Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock} unid.`, 'error');
      valido = false; return;
    }

    // ── Alerta de stock bajo después de la venta ──
    if ((prod.stock - cant) <= 5 && (prod.stock - cant) > 0) {
      toast(`⚠️ "${prod.nombre}" quedará con stock bajo (${prod.stock - cant} unid.)`, 'warn');
    }

    items.push({
      productoId:     prod.id,
      cantidad:       cant,
      precioUnitario: prod.precio
    });
    total += prod.precio * cant;
  });

  if (!valido) return;

  if (items.length === 0) {
    toast('Agregá al menos un producto a la venta.', 'error');
    return;
  }

  Storage.add('ventas', {
    clienteId,
    items,
    total,
    metodoPago: document.getElementById('venta-pago').value,
    notas:      document.getElementById('venta-notas').value.trim()
  });

  items.forEach(it => {
    const prod = Storage.findById('productos', it.productoId);
    if (prod) Storage.update('productos', prod.id, { stock: prod.stock - it.cantidad });
  });

  cerrarModalVenta();
  renderTabla();
  toast(`Venta registrada por $${total.toLocaleString('es-AR')} 🎉`, 'success');
}

// ─────────────────────────────────────────────
// DETALLE DE VENTA
// ─────────────────────────────────────────────

function verDetalle(id) {
  const v = Storage.findById('ventas', id);
  if (!v) return;

  const cliente = Storage.findById('clientes', v.clienteId);
  const nombreC = cliente ? cliente.nombre : 'Cliente eliminado';

  // Filas de productos del detalle
  const filas = v.items.map(it => {
    const p        = Storage.findById('productos', it.productoId);
    const nombre   = p ? p.nombre : 'Producto eliminado';
    const subtotal = it.precioUnitario * it.cantidad;
    return `
      <tr>
        <td>${nombre}</td>
        <td style="text-align:center">${it.cantidad}</td>
        <td style="text-align:right">
          $${Number(it.precioUnitario).toLocaleString('es-AR')}
        </td>
        <td style="text-align:right; font-weight:600">
          $${subtotal.toLocaleString('es-AR')}
        </td>
      </tr>`;
  }).join('');

  document.getElementById('detalle-contenido').innerHTML = `
    <div style="margin-bottom:14px">
      <p style="font-size:12px; color:var(--muted)">Cliente</p>
      <p style="font-weight:600">${nombreC}</p>
    </div>
    <div style="margin-bottom:14px">
      <p style="font-size:12px; color:var(--muted)">Fecha</p>
      <p>${new Date(v.creadoEn).toLocaleDateString('es-AR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
      })}</p>
    </div>
    <table style="margin-bottom:14px">
      <thead>
        <tr>
          <th>Producto</th>
          <th style="text-align:center">Cant.</th>
          <th style="text-align:right">Precio unit.</th>
          <th style="text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
    <div style="display:flex; justify-content:space-between;
                align-items:center; padding-top:12px;
                border-top:1.5px solid var(--border)">
      <div>
        <span style="font-size:13px; color:var(--muted)">Método de pago: </span>
        <span class="badge badge-info">${v.metodoPago || 'No especificado'}</span>
      </div>
      <span style="font-family:'Syne',sans-serif; font-size:22px;
                   font-weight:700; color:var(--accent)">
        $${v.total.toLocaleString('es-AR')}
      </span>
    </div>
    ${v.notas
      ? `<p style="margin-top:12px; font-size:13px; color:var(--muted)">
           📝 ${v.notas}
         </p>`
      : ''}`;

  abrirModal('modal-detalle');
}

// ─────────────────────────────────────────────
// ELIMINAR Y FILTROS
// ─────────────────────────────────────────────

async function eliminarVenta(id) {
  const ok = await confirmar(
    '¿Eliminar esta venta?',
    'La venta se eliminará pero el stock no se repondrá automáticamente.',
    'Eliminar',
    'btn-danger'
  );
  if (!ok) return;
  Storage.delete('ventas', id);
  toast('Venta eliminada', 'warn');
  renderTabla();
}

function limpiarFiltros() {
  document.getElementById('buscador').value     = '';
  document.getElementById('filtro-fecha').value = '';
  renderTabla();
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function abrirModal(id)  { document.getElementById(id).classList.add('open'); }
function cerrarModal(id) { document.getElementById(id).classList.remove('open'); }

// Cerrar modales al hacer clic fuera del cuadro
['modal-venta', 'modal-detalle'].forEach(id => {
  document.getElementById(id).addEventListener('click', function(e) {
    if (e.target === this) cerrarModal(id);
  });
});

document.addEventListener('DOMContentLoaded', renderTabla);