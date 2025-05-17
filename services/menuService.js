const Categoria = require('../models/Categoria');
const Boton = require('../models/Boton');

/**
 * Devuelve el menú principal como lista interactiva.
 */
async function obtenerMenuPrincipal() {
  const categorias = await Categoria.find({ padre: null });

  const secciones = [{
    title: "Categorías disponibles",
    rows: categorias.map(cat => ({
      id: cat.intencion_relacionada,
      title: `${cat.emoji || ""} ${cat.nombre}`.substring(0, 24),
      description: cat.descripcion?.substring(0, 72) || ""
    }))
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
