const Mensaje = require('../models/Mensaje');

async function guardarMensaje(
    from,
    mensaje,
    respuesta,
    intencion,
    categoria = "General",
    ambigua = false,
    opciones_alternativas = [],
    motivo_ambiguedad = null
) {
    await Mensaje.create({
        usuario_id: from,
        mensaje,
        respuesta,
        intencion,
        categoria,
        ambigua,
        opciones_alternativas,
        motivo_ambiguedad,
        tiempo_respuesta: Date.now(),
        origen: "WhatsApp"
    });
}

module.exports = { guardarMensaje };
