const botonesPatentes = require('../data/categorias/patentes');
const menuPrincipal = require('../data/categorias/menuPrincipal.json');
const { buscarEnMongoDB, buscarEnMongoDBPorIntencion } = require('./respuestaLocalService');
const { buscarEnDialogflow } = require('./respuestaDialogflowService');
const { buscarArticuloPorIntencion } = require('./articuloMunicipalService');
const { esAmbigua, manejarAmbiguedad } = require('./respuestaFallbackService');

async function obtenerRespuesta(mensajeUsuario, sessionId, telefonoUsuario) {
    console.log(`🔍 Buscando respuesta: "${mensajeUsuario}"`);

    // ✅ 1. Si escribe "menu" o "inicio", devolver lista interactiva principal
    if (mensajeUsuario === "menu" || mensajeUsuario === "inicio" || mensajeUsuario === "principal") {
        const secciones = [{
            title: "Categorías disponibles",
            rows: menuPrincipal.map(cat => ({
                id: `menu_${cat.categoria.toLowerCase().replace(/ /g, "_")}`,
                title: `${cat.emoji} ${cat.categoria}`.substring(0, 24),
                description: cat.descripcion.substring(0, 72)
            }))
        }];

        return {
            respuesta: "Por favor selecciona una categoría:",
            intencion: "menu_principal",
            categoria: null,
            ambigua: false,
            opciones_alternativas: null,
            motivo_ambiguedad: null,
            enviar_lista: true,
            secciones: secciones
        };
    }

    // ✅ 2. Verificar si el mensaje es un ID válido en botonesPatentes
    if (botonesPatentes[mensajeUsuario]) {
        const botones = botonesPatentes[mensajeUsuario];
        const texto = "Selecciona una opción:";

        return {
            respuesta: texto,
            intencion: mensajeUsuario,
            categoria: 'patentes',
            ambigua: false,
            opciones_alternativas: botones,
            motivo_ambiguedad: null,
            enviar_interactivo: true
        };
    }

    // 👉 3. Buscar por pregunta exacta en MongoDB
    const respuestaDB = await buscarEnMongoDB(mensajeUsuario);
    console.log("🔍 Resultado de buscarEnMongoDB:", respuestaDB);

    if (respuestaDB && respuestaDB.respuesta.toLowerCase() !== "pendiente de edición") {
        return {
            respuesta: respuestaDB.respuesta,
            intencion: null,
            categoria: respuestaDB.categoria || null,
            ambigua: false,
            opciones_alternativas: null,
            motivo_ambiguedad: null
        };
    }

    // 👉 4. Buscar intención en Dialogflow
    const resultadoDF = await buscarEnDialogflow(mensajeUsuario, sessionId);
    console.log("🔍 Resultado de buscarEnDialogflow:", resultadoDF);

    if (resultadoDF.intent && resultadoDF.intent.includes('patente')) {
        const botones = botonesPatentes['root'];
        const mensajeBoton = "¿Sobre qué parte de patentes necesitas información?";

        return {
            respuesta: mensajeBoton,
            intencion: resultadoDF.intent,
            categoria: 'patentes',
            ambigua: false,
            opciones_alternativas: botones,
            motivo_ambiguedad: null,
            enviar_interactivo: true
        };
    }

    // 👉 5. Buscar respuesta por intención en MongoDB
    const respuestaPorIntencion = await buscarEnMongoDBPorIntencion(resultadoDF.intent);
    console.log("🔍 Resultado de buscarEnMongoDBPorIntencion:", respuestaPorIntencion);

    if (respuestaPorIntencion && respuestaPorIntencion.respuesta.toLowerCase() !== "pendiente de edición") {
        return {
            respuesta: respuestaPorIntencion.respuesta,
            intencion: resultadoDF.intent,
            categoria: respuestaPorIntencion.categoria || null,
            ambigua: false,
            opciones_alternativas: null,
            motivo_ambiguedad: null
        };
    }

    // 👉 6. Buscar artículo legal
    const articuloLegal = await buscarArticuloPorIntencion(resultadoDF.intent);
    console.log("🔍 Resultado de buscarArticuloPorIntencion:", articuloLegal);

    if (articuloLegal) {
        return {
            respuesta: articuloLegal.respuesta,
            intencion: resultadoDF.intent,
            categoria: articuloLegal.categoria || null,
            ambigua: false,
            opciones_alternativas: null,
            motivo_ambiguedad: null
        };
    }

    // 👉 7. Ambigüedad
    if (esAmbigua(mensajeUsuario)) {
        const respuestaAmbigua = await manejarAmbiguedad(mensajeUsuario);
        return {
            respuesta: respuestaAmbigua,
            intencion: resultadoDF.intent,
            categoria: null,
            ambigua: true,
            opciones_alternativas: null,
            motivo_ambiguedad: "Ambigüedad detectada por esAmbigua()"
        };
    }

    // 👉 8. Fulfillment de Dialogflow
    const fulfillment = resultadoDF.fulfillmentText || "No encontré una respuesta exacta.";
    return {
        respuesta: fulfillment,
        intencion: resultadoDF.intent,
        categoria: null,
        ambigua: false,
        opciones_alternativas: null,
        motivo_ambiguedad: null
    };
}

module.exports = { obtenerRespuesta };
