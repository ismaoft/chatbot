const Respuesta = require('../models/Respuesta');
const { detectIntent } = require('../config/dialogflow');
const { registrarPreguntaSinRespuesta } = require('./preguntaNoRespondidaService');

// Frases claves que denotan ambigüedad (se puede expandir)
const frasesAmbiguas = [
    "no entiendo", "explícame", "dime más", "no está claro", "¿cuál?", "¿cómo así?", "¿qué significa?"
];

function esAmbigua(pregunta) {
    return frasesAmbiguas.some(f => pregunta.includes(f));
}

async function obtenerRespuesta(mensajeUsuario, sessionId) {
    console.log(`🔍 Buscando respuesta en MongoDB para: ${mensajeUsuario}`);

    const respuestaDB = await Respuesta.findOne({
        pregunta: { $regex: mensajeUsuario, $options: "i" }
    });

    // 🟢 Si se encuentra y NO es "Pendiente de edición", la devolvemos
    if (respuestaDB && respuestaDB.respuesta !== "Pendiente de edición") {
        return {
            respuesta: respuestaDB.respuesta,
            intencion: respuestaDB.intencion || "Intención no registrada",
            categoria: respuestaDB.categoria || "General",
            fuente: "mongo",
            ambigua: false,
            opciones_alternativas: null,
            motivo_ambiguedad: null
        };
    }

    // 🔄 Si es "Pendiente de edición" o no hay coincidencia, consultamos Dialogflow
    console.log("🔄 Consultando Dialogflow para encontrar mejor respuesta...");
    const resultadoDF = await detectIntent(mensajeUsuario, sessionId);

    if (
        !resultadoDF.intent ||
        resultadoDF.intent === "Default Fallback Intent" ||
        resultadoDF.response === ""
    ) {
        // 🔍 Analizamos si el mensaje es ambiguo
        const ambigua = esAmbigua(mensajeUsuario);
        const motivo = ambigua ? "Redacción vaga o con términos generales" : null;

        const respuestaFinal = await registrarPreguntaSinRespuesta(mensajeUsuario);

        return {
            respuesta: respuestaFinal,
            intencion: "Sin clasificar",
            categoria: "General",
            fuente: "registrada",
            ambigua,
            opciones_alternativas: null,
            motivo_ambiguedad: motivo
        };
    }

    // ✅ Dialogflow tiene una respuesta útil
    return {
        respuesta: resultadoDF.response,
        intencion: resultadoDF.intent,
        categoria: "General", // Se puede mejorar con categorías si se usan entidades
        fuente: "dialogflow",
        ambigua: false,
        opciones_alternativas: null,
        motivo_ambiguedad: null
    };
}

module.exports = { obtenerRespuesta };