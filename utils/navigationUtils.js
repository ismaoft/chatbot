function agregarBotonesNavegacion({ rows = [], historial = [], incluirMenu = true }) {
  const ids = new Set(rows.map(r => r.id));
  const clean = rows.filter(r => r.id !== 'volver' && r.id !== 'home' && r.title !== '↩ Volver');

  if (historial.length && !ids.has('volver')) {
    clean.push({ id: 'volver', title: '↩ Volver' });
  }

  if (incluirMenu && !ids.has('home')) {
    clean.push({ id: 'home', title: '🏠 Menú' });
  }

  return clean;
}

module.exports = { agregarBotonesNavegacion };
