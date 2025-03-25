const Usuario = require('../models/Usuario');
const sendMessage = require('../utils/sendMessage');
const { WELCOME_MESSAGE } = require('../utils/messages');

async function manejarUsuarioNuevo(from) {
    console.log("👤 Usuario nuevo detectado. Registrando...");

    let usuarioExistente = await Usuario.findOne({ numero_whatsapp: from });

    if (!usuarioExistente) {
        await Usuario.create({
            numero_whatsapp: from,
            mensajes_enviados: 1,
            ultima_interaccion: new Date()
        });

        await sendMessage(from, WELCOME_MESSAGE);
    }
}

module.exports = { manejarUsuarioNuevo };
