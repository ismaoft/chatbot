const Usuario = require('../models/Usuario');
const { manejarUsuarioNuevo } = require('../services/userService');
const { obtenerRespuesta } = require('../services/respuestaService');
const { guardarMensaje } = require('../services/messageService');
const { sendMessage, sendInteractiveMessage, sendListMessage } = require('../whatsappCloud');
const handleError = require('../utils/errorHandler');
const { obtenerMenuPrincipal } = require('../services/menuService');
const { WELCOME_MESSAGE } = require('../utils/messages');

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

    // 🔥 Interpretar tipo de mensaje
    let message = messageData.text?.body?.trim()?.toLowerCase();
    if (messageData.interactive?.button_reply) {
      const buttonId = messageData.interactive.button_reply.id;
      console.log(`🔘 Botón presionado: "${buttonId}" por ${from}`);
      message = buttonId;
    } else if (messageData.interactive?.list_reply) {
      const listId = messageData.interactive.list_reply.id;
      console.log(`📋 Opción de lista seleccionada: "${listId}" por ${from}`);
      message = listId;
    }

    console.log(`📌 Mensaje procesado: "${message}" de ${from}`);

    let usuario = await Usuario.findOne({ numero_whatsapp: from });
    if (!usuario) {
      await manejarUsuarioNuevo(from);

      const secciones = await obtenerMenuPrincipal();
      await sendMessage(from, WELCOME_MESSAGE);
      await sendListMessage(from, "Menú Principal", "Por favor selecciona una categoría:", "Municipalidad de San Pablo", secciones);
      return res.sendStatus(200);
    }

    const respuestaObj = await obtenerRespuesta(message, from, from);

    console.log("🎯 Tipo de mensaje:", respuestaObj.enviar_interactivo ? "botones" : respuestaObj.enviar_lista ? "lista" : "texto");
    console.log("🎯 Botones recibidos:", respuestaObj.botones);
    console.log("🎯 Secciones:", respuestaObj.secciones);

    if (respuestaObj.enviar_lista && Array.isArray(respuestaObj.secciones) && respuestaObj.secciones.length > 0) {
      await sendListMessage(from, "Menú Principal", respuestaObj.respuesta, "Municipalidad de San Pablo", respuestaObj.secciones);
    } else if (respuestaObj.enviar_interactivo && Array.isArray(respuestaObj.botones) && respuestaObj.botones.length > 0) {
      console.log("✅ Enviando botones con:", respuestaObj.botones);
      await sendInteractiveMessage(from, respuestaObj.respuesta, respuestaObj.botones);
    } else {
      await sendMessage(from, respuestaObj.respuesta);
    }

    await guardarMensaje(
      from,
      message,
      respuestaObj.respuesta,
      respuestaObj.intencion,
      respuestaObj.categoria,
      respuestaObj.ambigua,
      respuestaObj.botones?.map(b => b.title || b) || null,
      respuestaObj.motivo_ambiguedad
    );

  } catch (error) {
    handleError(error, "Error en handleMessage");
  }

  res.sendStatus(200);
};
