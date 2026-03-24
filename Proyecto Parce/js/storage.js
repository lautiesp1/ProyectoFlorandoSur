// js/storage.js — Capa de persistencia con localStorage

const Storage = {

  // Guarda un array completo bajo una clave
  set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  // Trae todos los registros de una clave (devuelve [] si no existe)
  get(key) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  },

  // Agrega un nuevo ítem y le asigna un id único
  add(key, item) {
    const items = this.get(key);
    item.id = Date.now().toString();
    item.creadoEn = new Date().toISOString();
    items.push(item);
    this.set(key, items);
    return item;
  },

  // Actualiza un ítem por su id
  update(key, id, cambios) {
    const items = this.get(key);
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...cambios };
      this.set(key, items);
      return items[index];
    }
    return null;
  },

  // Elimina un ítem por su id
  delete(key, id) {
    const items = this.get(key).filter(i => i.id !== id);
    this.set(key, items);
  },

  // Busca un ítem por id
  findById(key, id) {
    return this.get(key).find(i => i.id === id) || null;
  }
};