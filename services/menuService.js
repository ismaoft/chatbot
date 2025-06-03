const Categoria = require('../models/Categoria');
const Boton = require('../models/Boton');
const { agregarBotonesNavegacion } = require('../utils/navigationUtils');

const LIMITE_FILAS = 10;
const ESPACIO_RESERVADO = 2; // espacio para "Volver" y "Menú"

async function obtenerMenuPrincipal(pagina = 1, historial = []) {
  const categorias = await Categoria.find({ padre: null });
  const totalCategorias = categorias.length;
  const categoriasPorPagina = LIMITE_FILAS - ESPACIO_RESERVADO;
  const totalPaginas = Math.ceil(totalCategorias / categoriasPorPagina);

  // Obtener el bloque actual de categorías
  const inicio = (pagina - 1) * categoriasPorPagina;
  const fin = inicio + categoriasPorPagina;
  const paginaCategorias = categorias.slice(inicio, fin);

  let rows = paginaCategorias.map(cat => ({
    id: cat.intencion_relacionada,
    title: `${cat.emoji || ""} ${cat.nombre}`.substring(0, 24),
    description: cat.descripcion?.substring(0, 72) || ""
  }));

  // Botones de navegación entre páginas
  if (pagina < totalPaginas) {
    rows.push({ id: `menu_pagina_${pagina + 1}`, title: '➡ Página siguiente' });
  }
  if (pagina > 1) {
    rows.push({ id: `menu_pagina_${pagina - 1}`, title: '⬅ Página anterior' });
  }

  // Agregar botones "↩ Volver" y "🏠 Menú" si aplican
  rows = agregarBotonesNavegacion({ rows, historial, incluirMenu: true });

  // Asegurar que no excede 10 filas
  rows = rows.slice(0, LIMITE_FILAS);

  const secciones = [{
    title: `Categoría pág. ${pagina}`, // máximo 24 caracteres
    rows
  }];


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
