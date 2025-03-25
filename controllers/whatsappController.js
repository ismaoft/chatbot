const Usuario = require('../models/Usuario');
const { manejarUsuarioNuevo } = require('../services/userService');
const { obtenerRespuesta } = require('../services/respuestaService');
const { guardarMensaje } = require('../services/messageService');
const sendMessage = require('../utils/sendMessage');
const handleError = require('../utils/errorHandler');
const { OPTIONS_RESPONSES } = require('../utils/messages');

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// 📌 Verificación del webhook (Meta Developer)
exports.verifyWebhook = (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token === VERIFY_TOKEN) {
        console.log("✅ Webhook verificado correctamente.");
        return res.status(200).send(challenge);
    } else {
        console.error("❌ Error en la verificación del webhook.");
        return res.sendStatus(403);
    }
};

// 📩 Manejo del mensaje entrante desde WhatsApp Cloud API
exports.handleMessage = async (req, res) => {
    console.log("📩 Mensaje recibido desde WhatsApp Cloud API:", JSON.stringify(req.body, null, 2));

    try {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];

        if (changes.field !== "messages") {
            console.log("🔍 Evento ignorado, no es un mensaje.");
            return res.sendStatus(200);
        }

        const messageData = changes.value.messages?.[0];
        if (!messageData) {
            console.log("⚠️ No hay datos de mensaje en este evento.");
            return res.sendStatus(200);
        }

        const message = messageData.text?.body.trim().toLowerCase();
        const from = messageData.from;

        console.log(`📌 Mensaje recibido: "${message}" de ${from}`);

        const usuario = await Usuario.findOne({ numero_whatsapp: from });
        if (!usuario) {
            await manejarUsuarioNuevo(from);
            return res.sendStatus(200);
        }

        // Si el mensaje coincide con una opción del menú
        if (OPTIONS_RESPONSES[message]) {
            await sendMessage(from, OPTIONS_RESPONSES[message]);
            return res.sendStatus(200);
        }

        // Obtener respuesta con intención y categoría (desde Mongo o Dialogflow)
        const { respuesta, intencion, categoria } = await obtenerRespuesta(message, from);

        // Enviar respuesta al usuario
        await sendMessage(from, respuesta);

        // Guardar el mensaje con todos los detalles
        await guardarMensaje(from, message, respuesta, intencion, categoria);

    } catch (error) {
        handleError(error, "Error en handleMessage");
    }

    res.sendStatus(200);
};