const { buscarEnMongoDB, buscarEnMongoDBPorIntencion } = require('./respuestaLocalService');
const { buscarEnDialogflow } = require('./respuestaDialogflowService');
const { buscarArticuloPorIntencion } = require('./articuloMunicipalService');
const { esAmbigua, manejarAmbiguedad } = require('./respuestaFallbackService');

async function obtenerRespuesta(mensajeUsuario, sessionId) {
  console.log(`🔍 Buscando respuesta: "${mensajeUsuario}"`);

  // 👉 1. Buscar por pregunta en MongoDB
  const respuestaDB = await buscarEnMongoDB(mensajeUsuario);
  console.log("🔍 Resultado de buscarEnMongoDB:", respuestaDB);

  if (respuestaDB && respuestaDB.respuesta.toLowerCase() !== "pendiente de edición".toLowerCase()) {
    return {
      respuesta: respuestaDB.respuesta,
      fuente: "mongo-pregunta",
      ambigua: false
    };
  }

  // 👉 2. Buscar intención en Dialogflow
  const resultadoDF = await buscarEnDialogflow(mensajeUsuario, sessionId);
  console.log("🔍 Resultado de buscarEnDialogflow:", resultadoDF);

  if (resultadoDF && resultadoDF.intent) {
    // 👉 3. Buscar por intención en MongoDB
    const respuestaPorIntencion = await buscarEnMongoDBPorIntencion(resultadoDF.intent);
    console.log("🔍 Resultado de buscarEnMongoDBPorIntencion:", respuestaPorIntencion);

    if (respuestaPorIntencion && respuestaPorIntencion.respuesta.toLowerCase() !== "pendiente de edición".toLowerCase()) {
      return {
        respuesta: respuestaPorIntencion.respuesta,
        fuente: "mongo-intencion",
        ambigua: false
      };
    }

    // 👉 4. Buscar artículo legal
    const articuloLegal = await buscarArticuloPorIntencion(resultadoDF.intent);
    console.log("🔍 Resultado de buscarArticuloPorIntencion:", articuloLegal);

    if (articuloLegal) {
      return {
        respuesta: articuloLegal.respuesta,
        fuente: "legal",
        ambigua: false
      };
    }

    // 👉 5. Manejar ambigüedad si aplica
    if (esAmbigua(mensajeUsuario)) {
      return {
        respuesta: await manejarAmbiguedad(mensajeUsuario),
        fuente: "dialogflow-ambigua",
        ambigua: true
      };
    }

    // 👉 6. Si Dialogflow tiene fulfillmentText, devolverlo
    return {
      respuesta: resultadoDF.fulfillmentText || "No encontré una respuesta exacta.",
      fuente: "dialogflow",
      ambigua: false
    };
  }

  // 👉 7. Fallback final si nada encontró
  return {
    respuesta: await manejarAmbiguedad(mensajeUsuario),
    fuente: "fallback",
    ambigua: true
  };
}

module.exports = { obtenerRespuesta };
