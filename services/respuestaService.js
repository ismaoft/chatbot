const { buscarEnMongoDB, buscarEnMongoDBPorIntencion } = require('./respuestaLocalService');
const { buscarEnDialogflow } = require('./respuestaDialogflowService');
const { buscarArticuloPorIntencion } = require('./articuloMunicipalService');
const { esAmbigua, manejarAmbiguedad } = require('./respuestaFallbackService');
const { obtenerRespuestaDinamica } = require('./respuestaDinamicaService');
const { obtenerMenuPrincipal, obtenerBotonesDeCategoria } = require('./menuService');
const { WELCOME_MESSAGE, DEFAULT_RESPONSE } = require('../utils/messages');

const SALUDOS = ["hola", "buenas", "buenos días", "buenas tardes", "saludos"];

async function obtenerRespuesta(mensajeUsuario, sessionId, telefonoUsuario) {
  console.log(`🔍 Buscando respuesta: "${mensajeUsuario}"`);

  // 🟢 0. Saludo → bienvenida + menú principal
  if (SALUDOS.includes(mensajeUsuario)) {
    const secciones = await obtenerMenuPrincipal();
    return {
      respuesta: WELCOME_MESSAGE,
      intencion: "saludo",
      enviar_lista: true,
      secciones
    };
  }

  // 🟢 1. Mostrar menú principal
  if (["menu", "inicio", "principal"].includes(mensajeUsuario)) {
    const secciones = await obtenerMenuPrincipal();
    return {
      respuesta: "Por favor selecciona una categoría:",
      intencion: "menu_principal",
      enviar_lista: true,
      secciones
    };
  }

  // 🟡 2. Categoría con subcategorías
  const botonesCategoria = await obtenerBotonesDeCategoria(mensajeUsuario);
  if (botonesCategoria) return botonesCategoria;

  // 🟡 3. Respuesta dinámica por intención o botón
const respuestaDinamica = await obtenerRespuestaDinamica(mensajeUsuario);
if (respuestaDinamica) {
  return {
    ...respuestaDinamica,
    enviar_interactivo: respuestaDinamica.tipo === "botones",
    enviar_lista: respuestaDinamica.tipo === "lista",
    botones: respuestaDinamica.botones || [],
    secciones: respuestaDinamica.secciones || []
  };
}



  // 🔍 4. Pregunta exacta en Mongo
  const respuestaDB = await buscarEnMongoDB(mensajeUsuario);
  if (respuestaDB && respuestaDB.respuesta.toLowerCase() !== "pendiente de edición") {
    return {
      respuesta: respuestaDB.respuesta,
      intencion: null,
      categoria: respuestaDB.categoria || null
    };
  }

  // 🤖 5. Dialogflow
  const resultadoDF = await buscarEnDialogflow(mensajeUsuario, sessionId);

  // 🟡 6. Buscar por intención en dinámicas
  if (resultadoDF.intent) {
    const dinamica = await obtenerRespuestaDinamica(resultadoDF.intent);
    if (dinamica) return dinamica;

    const botonesCategoriaPorDF = await obtenerBotonesDeCategoria(resultadoDF.intent);
    if (botonesCategoriaPorDF) return botonesCategoriaPorDF;
  }

  // 🧠 7. Intento → respuesta por intención exacta
  const respuestaPorIntencion = await buscarEnMongoDBPorIntencion(resultadoDF.intent);
  if (respuestaPorIntencion && respuestaPorIntencion.respuesta.toLowerCase() !== "pendiente de edición") {
    return {
      respuesta: respuestaPorIntencion.respuesta,
      intencion: resultadoDF.intent,
      categoria: respuestaPorIntencion.categoria || null
    };
  }

  // 📚 8. Artículos legales
  const articuloLegal = await buscarArticuloPorIntencion(resultadoDF.intent);
  if (articuloLegal) {
    return {
      respuesta: articuloLegal.respuesta,
      intencion: resultadoDF.intent,
      categoria: articuloLegal.categoria || null
    };
  }

  // 🌀 9. Ambigüedad
  if (esAmbigua(mensajeUsuario)) {
    const ambigua = await manejarAmbiguedad(mensajeUsuario);
    return {
      respuesta: ambigua,
      intencion: resultadoDF.intent,
      ambigua: true,
      motivo_ambiguedad: "Ambigüedad detectada por esAmbigua()"
    };
  }

  // 🚨 10. Fallback
  return {
    respuesta: DEFAULT_RESPONSE,
    intencion: resultadoDF.intent
  };
}

module.exports = { obtenerRespuesta };
