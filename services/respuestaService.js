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
    console.log("📥 Tipo de mensaje: saludo");
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
    console.log("📥 Tipo de mensaje: menú principal solicitado");
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
  if (botonesCategoria) {
    console.log("📥 Botones de categoría encontrados, intención:", mensajeUsuario);
    botonesCategoria.intencion = mensajeUsuario;
    return botonesCategoria;
  }

  // 🟡 Respuesta directa
  const respuestaDinamica = await obtenerRespuestaDinamica(mensajeUsuario, telefonoUsuario);
  if (respuestaDinamica) {
    console.log("📦 Respuesta directa desde obtenerRespuestaDinamica → intención:", respuestaDinamica.intencion);
    return respuestaDinamica;
  }

  // 🔍 Pregunta exacta en MongoDB
  const respuestaDB = await buscarEnMongoDB(mensajeUsuario);
  if (respuestaDB && respuestaDB.respuesta.toLowerCase() !== "pendiente de edición") {
    console.log("📦 Respuesta exacta en MongoDB sin intención registrada");
    return {
      respuesta: respuestaDB.respuesta,
      intencion: null,
      categoria: respuestaDB.categoria || null
    };
  }

  // 🤖 Dialogflow
  const resultadoDF = await buscarEnDialogflow(mensajeUsuario, sessionId);
  console.log("🧠 Resultado de Dialogflow:", resultadoDF.intent);

  if (resultadoDF.intent) {
    const dinamica = await obtenerRespuestaDinamica(resultadoDF.intent, telefonoUsuario);
    if (dinamica) {
      console.log("📦 Respuesta dinámica por intención detectada en Dialogflow → intención:", dinamica.intencion);
      return dinamica;
    }

    const botonesCategoriaDF = await obtenerBotonesDeCategoria(resultadoDF.intent);
    if (botonesCategoriaDF) {
      console.log("📥 Botones desde categoría detectada en Dialogflow → intención:", resultadoDF.intent);
      return botonesCategoriaDF;
    }
  }

  const respuestaIntencion = await buscarEnMongoDBPorIntencion(resultadoDF.intent);
  if (respuestaIntencion && respuestaIntencion.respuesta.toLowerCase() !== "pendiente de edición") {
    console.log("📦 Respuesta por intención exacta en MongoDB → intención:", resultadoDF.intent);
    return {
      respuesta: respuestaIntencion.respuesta,
      intencion: resultadoDF.intent,
      categoria: respuestaIntencion.categoria || null
    };
  }

  const articuloLegal = await buscarArticuloPorIntencion(resultadoDF.intent);
  if (articuloLegal) {
    console.log("📜 Artículo legal encontrado → intención:", resultadoDF.intent);
    return {
      respuesta: articuloLegal.respuesta,
      intencion: resultadoDF.intent,
      categoria: articuloLegal.categoria || null
    };
  }

  if (esAmbigua(mensajeUsuario)) {
    const ambigua = await manejarAmbiguedad(mensajeUsuario);
    console.log("⚠️ Ambigüedad detectada → intención:", resultadoDF.intent);
    return {
      respuesta: ambigua,
      intencion: resultadoDF.intent,
      ambigua: true,
      motivo_ambiguedad: "Ambigüedad detectada por esAmbigua()"
    };
  }

  console.warn("❌ Intención no encontrada, se devuelve respuesta por defecto → intención:", resultadoDF.intent);
  return {
    respuesta: DEFAULT_RESPONSE,
    intencion: resultadoDF.intent
  };
}


module.exports = { obtenerRespuesta };
