const Respuesta = require('../models/Respuesta');
const { detectIntent } = require('../config/dialogflow');
const { registrarPreguntaSinRespuesta } = require('./preguntaNoRespondidaService');

async function obtenerRespuesta(mensajeUsuario, sessionId) {
    console.log(`🔍 Buscando respuesta en MongoDB para: ${mensajeUsuario}`);

    const respuestaDB = await Respuesta.findOne({
        pregunta: { $regex: mensajeUsuario, $options: "i" }
    });

    if (respuestaDB) {
        return {
            respuesta: respuestaDB.respuesta,
            intencion: respuestaDB.intencion || "Intención no registrada",
            categoria: respuestaDB.categoria || "General",
            fuente: "mongo"
        };
    }

    const resultadoDF = await detectIntent(mensajeUsuario, sessionId);

    if (
        !resultadoDF.intent ||
        resultadoDF.intent === "Default Fallback Intent" ||
        resultadoDF.response === ""
    ) {
        const respuestaRegistro = await registrarPreguntaSinRespuesta(mensajeUsuario);
        return {
            respuesta: respuestaRegistro,
            intencion: "Sin clasificar",
            categoria: "General",
            fuente: "registrada"
        };
    }

    return {
        respuesta: resultadoDF.response,
        intencion: resultadoDF.intent,
        categoria: "General", // 🔄 Por ahora asumimos "General" si viene de Dialogflow
        fuente: "dialogflow"
    };
}


module.exports = { obtenerRespuesta };
