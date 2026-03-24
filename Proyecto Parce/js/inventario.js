// js/inventario.js

const UMBRAL_STOCK_BAJO = 5; // productos con 5 o menos se marcan en amarillo

// Devuelve el badge de estado según el stock
function estadoBadge(stock) {
  stock = Number(stock);
  if (stock === 0)          return '<span class="badge badge-danger">Sin stock</span>';
  if (stock <= UMBRAL_STOCK_BAJO) return '<span class="badge badge-warn">Stock bajo</span>';
  return '<span class="badge badge-ok">En stock</span>';
}

// Dibuja la tabla aplicando búsqueda y filtro de categoría
function renderTabla() {
  let productos = Storage.get('productos');

  const q   = document.getElementById('buscador').value.toLowerCase();
  const cat = document.getElementById('filtro-categoria').value;

  if (q)   productos = productos.filter(p => p.nombre.toLowerCase().includes(q));
  if (cat) productos = productos.filter(p => p.categoria === cat);

  const tbody = document.getElementById('tabla-inventario');

  if (productos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:24px; color:#FFFFFF">
          No se encontraron productos
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = productos.map(p => `
    <tr>
      <td>
        <span style="font-weight:500">${p.nombre}</span>
        ${p.descripcion
          ? `<br><span style="font-size:12px; color:#FFFFFF">${p.descripcion}</span>`
          : ''}
      </td>
      <td><span class="badge badge-info">${p.categoria}</span></td>
      <td style="font-weight:600">$${Number(p.precio).toLocaleString('es-AR')}</td>
      <td style="color:#FFFFFF">
        ${p.costo ? '$' + Number(p.costo).toLocaleString('es-AR') : '—'}
      </td>
      <td style="font-weight:600">${p.stock}</td>
      <td>${estadoBadge(p.stock)}</td>
      <td>
        <div class="td-actions">
          <button class="btn btn-outline btn-sm"
            onclick="editarProducto('${p.id}')">✏️ Editar</button>
          <button class="btn btn-danger btn-sm"
            onclick="eliminarProducto('${p.id}')">🗑️</button>
        </div>
      </td>
    </tr>`).join('');
}

// Abre el modal en modo "agregar" (campos vacíos)
function abrirModalAgregar() {
  document.getElementById('modal-titulo').textContent   = 'Nuevo producto';
  document.getElementById('prod-id').value              = '';
  document.getElementById('prod-nombre').value          = '';
  document.getElementById('prod-categoria').value       = '';
  document.getElementById('prod-stock').value           = '';
  document.getElementById('prod-precio').value          = '';
  document.getElementById('prod-costo').value           = '';
  document.getElementById('prod-descripcion').value     = '';
  document.getElementById('modal-producto').classList.add('open');
}

// Abre el modal en modo "editar" (precarga los datos del producto)
function editarProducto(id) {
  const p = Storage.findById('productos', id);
  if (!p) return;
  document.getElementById('modal-titulo').textContent   = 'Editar producto';
  document.getElementById('prod-id').value              = p.id;
  document.getElementById('prod-nombre').value          = p.nombre;
  document.getElementById('prod-categoria').value       = p.categoria;
  document.getElementById('prod-stock').value           = p.stock;
  document.getElementById('prod-precio').value          = p.precio;
  document.getElementById('prod-costo').value           = p.costo || '';
  document.getElementById('prod-descripcion').value     = p.descripcion || '';
  document.getElementById('modal-producto').classList.add('open');
}

// Cierra el modal
function cerrarModal() {
  document.getElementById('modal-producto').classList.remove('open');
}

function guardarProducto() {
  const nombre    = document.getElementById('prod-nombre').value.trim();
  const categoria = document.getElementById('prod-categoria').value;
  const stock     = document.getElementById('prod-stock').value;
  const precio    = document.getElementById('prod-precio').value;

  if (!nombre || !categoria || stock === '' || precio === '') {
    toast('Completá los campos obligatorios (*)', 'error');
    return;
  }

  const datos = {
    nombre,
    categoria,
    stock:       Number(stock),
    precio:      Number(precio),
    costo:       Number(document.getElementById('prod-costo').value) || 0,
    descripcion: document.getElementById('prod-descripcion').value.trim()
  };

  const id = document.getElementById('prod-id').value;
  if (id) {
    Storage.update('productos', id, datos);
    toast('Producto actualizado correctamente', 'success');
  } else {
    Storage.add('productos', datos);
    toast('Producto agregado al inventario', 'success');
  }

  cerrarModal();
  renderTabla();
}

async function eliminarProducto(id) {
  const ok = await confirmar(
    '¿Eliminar producto?',
    'Esta acción no se puede deshacer.',
    'Eliminar',
    'btn-danger'
  );
  if (!ok) return;
  Storage.delete('productos', id);
  toast('Producto eliminado', 'warn');
  renderTabla();
}

// Cerrar modal al hacer clic fuera del cuadro
document.getElementById('modal-producto').addEventListener('click', function(e) {
  if (e.target === this) cerrarModal();
});

// Cargar la tabla cuando la página termina de cargar
document.addEventListener('DOMContentLoaded', renderTabla);