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

  // 🟢 Saludo → bienvenida + menú principal
  if (SALUDOS.includes(mensajeUsuario)) {
    const secciones = await obtenerMenuPrincipal();
    return {
      respuesta: WELCOME_MESSAGE,
      intencion: "saludo",
      enviar_lista: true,
      secciones
    };
  }

  // 🟢 Mostrar menú
  if (["menu", "inicio", "principal"].includes(mensajeUsuario)) {
    const secciones = await obtenerMenuPrincipal();
    return {
      respuesta: "Por favor selecciona una categoría:",
      intencion: "menu_principal",
      enviar_lista: true,
      secciones
    };
  }

  // 🟡 Subcategorías desde categoría
  const botonesCategoria = await obtenerBotonesDeCategoria(mensajeUsuario);
  if (botonesCategoria) return botonesCategoria;

  // 🟡 Respuesta directa
  const respuestaDinamica = await obtenerRespuestaDinamica(mensajeUsuario);
  if (respuestaDinamica) return respuestaDinamica;

  // 🔍 Pregunta exacta en MongoDB
  const respuestaDB = await buscarEnMongoDB(mensajeUsuario);
  if (respuestaDB && respuestaDB.respuesta.toLowerCase() !== "pendiente de edición") {
    return {
      respuesta: respuestaDB.respuesta,
      intencion: null,
      categoria: respuestaDB.categoria || null
    };
  }

  // 🤖 Dialogflow
  const resultadoDF = await buscarEnDialogflow(mensajeUsuario, sessionId);

  if (resultadoDF.intent) {
    const dinamica = await obtenerRespuestaDinamica(resultadoDF.intent);
    if (dinamica) return dinamica;

    const botonesCategoriaDF = await obtenerBotonesDeCategoria(resultadoDF.intent);
    if (botonesCategoriaDF) return botonesCategoriaDF;
  }

  const respuestaIntencion = await buscarEnMongoDBPorIntencion(resultadoDF.intent);
  if (respuestaIntencion && respuestaIntencion.respuesta.toLowerCase() !== "pendiente de edición") {
    return {
      respuesta: respuestaIntencion.respuesta,
      intencion: resultadoDF.intent,
      categoria: respuestaIntencion.categoria || null
    };
  }

  const articuloLegal = await buscarArticuloPorIntencion(resultadoDF.intent);
  if (articuloLegal) {
    return {
      respuesta: articuloLegal.respuesta,
      intencion: resultadoDF.intent,
      categoria: articuloLegal.categoria || null
    };
  }

  if (esAmbigua(mensajeUsuario)) {
    const ambigua = await manejarAmbiguedad(mensajeUsuario);
    return {
      respuesta: ambigua,
      intencion: resultadoDF.intent,
      ambigua: true,
      motivo_ambiguedad: "Ambigüedad detectada por esAmbigua()"
    };
  }

  return {
    respuesta: DEFAULT_RESPONSE,
    intencion: resultadoDF.intent
  };
}

module.exports = { obtenerRespuesta };
