// js/app.js — Lógica del Dashboard

const UMBRAL_STOCK_BAJO = 5;

function cargarDashboard() {
  const productos = Storage.get('productos');
  const ventas    = Storage.get('ventas');
  const clientes  = Storage.get('clientes');

  // ── Ventas de hoy ──
  const hoy         = new Date().toDateString();
  const ventasHoy   = ventas.filter(v =>
    new Date(v.creadoEn).toDateString() === hoy
  );
  const totalHoy    = ventasHoy.reduce((s, v) => s + v.total, 0);
  const unidadesHoy = ventasHoy.reduce((s, v) =>
    s + v.items.reduce((a, i) => a + i.cantidad, 0), 0
  );

  document.getElementById('ventas-hoy').textContent =
    '$' + totalHoy.toLocaleString('es-AR');
  document.getElementById('unidades-hoy').textContent = unidadesHoy;
  document.getElementById('total-clientes').textContent = clientes.length;
  document.getElementById('sub-ventas-hoy').textContent =
    ventasHoy.length + ' venta' + (ventasHoy.length !== 1 ? 's' : '') + ' hoy';

  // ── Stock bajo ──
  const criticos = productos.filter(p => Number(p.stock) <= UMBRAL_STOCK_BAJO);
  document.getElementById('stock-bajo').textContent = criticos.length;

  const listaStock = document.getElementById('lista-stock-bajo');
  if (criticos.length === 0) {
    listaStock.innerHTML =
      '<li class="empty-state">✅ Todo el stock está en orden</li>';
  } else {
    listaStock.innerHTML = criticos.map(p => `
      <li class="item-row">
        <div>
          <span class="item-name">${p.nombre}</span>
          <span class="item-sub">${p.categoria || 'Sin categoría'}</span>
        </div>
        <span class="badge ${Number(p.stock) === 0 ? 'badge-danger' : 'badge-warn'}">
          ${p.stock} unid.
        </span>
      </li>`).join('');
  }

  // ── Últimas ventas ──
  const ultimas     = [...ventas].reverse().slice(0, 5);
  const listaVentas = document.getElementById('lista-ultimas-ventas');
  if (ultimas.length === 0) {
    listaVentas.innerHTML =
      '<li class="empty-state">No hay ventas registradas aún.</li>';
  } else {
    listaVentas.innerHTML = ultimas.map(v => {
      const cliente  = Storage.findById('clientes', v.clienteId);
      const nombre   = cliente ? cliente.nombre : 'Cliente eliminado';
      const iniciales = nombre.split(' ').slice(0,2)
        .map(w => w[0]).join('').toUpperCase();
      return `
        <li class="item-row">
          <div style="display:flex; align-items:center; gap:10px">
            <div class="avatar">${iniciales}</div>
            <div>
              <span class="item-name">${nombre}</span>
              <span class="item-sub">
                ${new Date(v.creadoEn).toLocaleDateString('es-AR')}
              </span>
            </div>
          </div>
          <span class="amount">$${v.total.toLocaleString('es-AR')}</span>
        </li>`;
    }).join('');
  }

  // ── Más vendidos del mes ──
  const mesActual = new Date().getMonth();
  const ventasMes = ventas.filter(v =>
    new Date(v.creadoEn).getMonth() === mesActual
  );

  const conteo = {};
  ventasMes.forEach(v => {
    v.items.forEach(it => {
      conteo[it.productoId] = (conteo[it.productoId] || 0) + it.cantidad;
    });
  });

  const barWrap = document.getElementById('bar-mas-vendidos');
  const sorted  = Object.entries(conteo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (sorted.length === 0) {
    barWrap.innerHTML =
      '<p class="empty-state">No hay ventas este mes aún.</p>';
  } else {
    const max = sorted[0][1];
    barWrap.innerHTML = sorted.map(([id, qty]) => {
      const prod  = Storage.findById('productos', id);
      const label = prod ? prod.nombre : 'Producto eliminado';
      const pct   = Math.round((qty / max) * 100);
      return `
        <div class="bar-item">
          <span class="bar-label" title="${label}">${label}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%"></div>
          </div>
          <span class="bar-val">${qty} u.</span>
        </div>`;
    }).join('');
  }
}

document.addEventListener('DOMContentLoaded', cargarDashboard);