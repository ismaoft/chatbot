const Categoria = require('../models/Categoria');
const Boton = require('../models/Boton');

const LIMITE_FILAS = 10;

/**
 * Devuelve el menú principal paginado según el número de página.
 * @param {number} pagina - Número de página actual (empezando desde 1).
 */
async function obtenerMenuPrincipal(pagina = 1) {
  const categorias = await Categoria.find({ padre: null });

  // Paginación
  const total = categorias.length;
  const inicio = (pagina - 1) * (LIMITE_FILAS - 1); // -1 para dejar espacio al botón siguiente
  const fin = inicio + (LIMITE_FILAS - 1);
  const paginaCategorias = categorias.slice(inicio, fin);

  const rows = paginaCategorias.map(cat => ({
    id: cat.intencion_relacionada,
    title: `${cat.emoji || ""} ${cat.nombre}`.substring(0, 24),
    description: cat.descripcion?.substring(0, 72) || ""
  }));

  // Botón para pasar de página
  if (fin < total) {
    rows.push({
      id: `menu_pagina_${pagina + 1}`,
      title: '➡ Página siguiente'
    });
  } else if (pagina > 1) {
    rows.push({
      id: `menu_pagina_${pagina - 1}`,
      title: '⬅ Página anterior'
    });
  }

  const secciones = [
    {
      title: `Categorías (página ${pagina})`,
      rows
    }
  ];

  return secciones;
}

/**
 * Dado una intención relacionada, devuelve los botones de subcategorías.
 */
async function obtenerBotonesDeCategoria(intencion_relacionada) {
  const categoria = await Categoria.findOne({ intencion_relacionada }).populate('botones');

  if (!categoria || !categoria.botones || categoria.botones.length === 0) return null;

  const botones = categoria.botones.map(btn => ({
    id: btn.id,
    title: btn.titulo
  }));

  return {
    respuesta: `📂 *${categoria.nombre}*\n\n${categoria.descripcion || "Selecciona una opción:"}`,
    intencion: categoria.intencion_relacionada,
    categoria: categoria.nombre.toLowerCase(),
    tipo: "botones",
    botones,
    enviar_interactivo: true,
    enviar_lista: false
  };
}

module.exports = {
  obtenerMenuPrincipal,
  obtenerBotonesDeCategoria
};
