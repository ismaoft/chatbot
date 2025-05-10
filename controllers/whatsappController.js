const Usuario = require('../models/Usuario');
const { manejarUsuarioNuevo } = require('../services/userService');
const { obtenerRespuesta } = require('../services/respuestaService');
const { guardarMensaje } = require('../services/messageService');
const { sendMessage, sendInteractiveMessage, sendListMessage } = require('../whatsappCloud');
const handleError = require('../utils/errorHandler');
const { OPTIONS_RESPONSES } = require('../utils/messages');

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

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

exports.handleMessage = async (req, res) => {
    console.log("📩 Mensaje recibido desde WhatsApp Cloud API:", JSON.stringify(req.body, null, 2));

    try {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];

        if (changes.field !== "messages") return res.sendStatus(200);

        const messageData = changes.value.messages?.[0];
        if (!messageData) return res.sendStatus(200);

        const from = messageData.from;

        // ✅ manejar texto o botón
        let message = messageData.text?.body.trim().toLowerCase();

        if (messageData.interactive?.button_reply) {
            const buttonId = messageData.interactive.button_reply.id;
            console.log(`🔘 Botón presionado: "${buttonId}" por ${from}`);
            message = buttonId; // usamos el id del botón como input
        }

        console.log(`📌 Mensaje recibido: "${message}" de ${from}`);

        const usuario = await Usuario.findOne({ numero_whatsapp: from });
        if (!usuario) {
            await manejarUsuarioNuevo(from);
            return res.sendStatus(200);
        }

        if (OPTIONS_RESPONSES[message]) {
            await sendMessage(from, OPTIONS_RESPONSES[message]);
            return res.sendStatus(200);
        }

        const {
            respuesta,
            intencion,
            categoria,
            ambigua,
            opciones_alternativas,
            motivo_ambiguedad,
            enviar_interactivo,
            enviar_lista,
            secciones
        } = await obtenerRespuesta(message, from, from);

        if (enviar_lista && secciones) {
            await sendListMessage(from, "Menú Principal", respuesta, "Municipalidad de San Pablo", secciones);
        } else if (enviar_interactivo && opciones_alternativas) {
            await sendInteractiveMessage(from, respuesta, opciones_alternativas);
        } else {
            await sendMessage(from, respuesta);
        }

        await guardarMensaje(
            from,
            message,
            respuesta,
            intencion,
            categoria,
            ambigua,
            opciones_alternativas ? opciones_alternativas.map(b => b.title || b) : null,
            motivo_ambiguedad
        );

    } catch (error) {
        handleError(error, "Error en handleMessage");
    }

    res.sendStatus(200);
};
