const Mensaje = require('../models/Mensaje');

async function guardarMensaje(from, mensaje, respuesta, intencion, categoria = "General") {
    await Mensaje.create({
        usuario_id: from,
        mensaje,
        respuesta,
        intencion,
        categoria,
        tiempo_respuesta: Date.now(),
        origen: "WhatsApp"
    });
}


module.exports = { guardarMensaje };
