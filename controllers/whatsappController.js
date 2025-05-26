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
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
};

exports.handleMessage = async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    if (changes.field !== "messages") return res.sendStatus(200);

    const messageData = changes.value.messages?.[0];
    if (!messageData) return res.sendStatus(200);

    const from = messageData.from;

    let message = messageData.text?.body?.trim()?.toLowerCase();
    if (messageData.interactive?.button_reply) {
      message = messageData.interactive.button_reply.id;
    } else if (messageData.interactive?.list_reply) {
      message = messageData.interactive.list_reply.id;
    }

    let usuario = await Usuario.findOne({ numero_whatsapp: from });
    if (!usuario) {
      await manejarUsuarioNuevo(from);
      const secciones = await obtenerMenuPrincipal();
      await sendMessage(from, WELCOME_MESSAGE);
      await sendListMessage(from, "Menú Principal", "Por favor selecciona una categoría:", "Municipalidad de San Pablo", secciones);
      return res.sendStatus(200);
    }

    // 🟢 Reiniciar flujo si se recibe 'inicio', 'menu' o 'principal'
    if (["menu", "inicio", "principal"].includes(message)) {
      usuario.historial_intenciones = [];
      usuario.ultima_intencion = "menu_principal";
      await usuario.save();

      const secciones = await obtenerMenuPrincipal();
      await sendListMessage(from, "Menú Principal", "Por favor selecciona una categoría:", "Municipalidad de San Pablo", secciones);
      return res.sendStatus(200);
    }

    // 🧭 Manejar botón volver
    if (message === usuario?.ultima_intencion || message === "↩ volver") {
      if (usuario?.historial_intenciones?.length > 1) {
        usuario.historial_intenciones.pop();
        const anterior = usuario.historial_intenciones.at(-1);
        message = anterior || "menu";
        usuario.ultima_intencion = anterior || "menu";
        await usuario.save();
      } else {
        message = "menu";
        usuario.ultima_intencion = "menu";
        await usuario.save();
      }
    }

    const respuestaObj = await obtenerRespuesta(message, from, usuario.numero_whatsapp);

    const NO_REGISTRAR = [
      "saludo",
      "↩ volver",
      "menu",
      "inicio",
      "menu_principal",
      "Default Welcome Intent",
      "Default Fallback Intent"
    ];

    if (respuestaObj?.intencion && !NO_REGISTRAR.includes(respuestaObj.intencion)) {
      usuario.historial_intenciones = usuario.historial_intenciones || [];

      if (usuario.historial_intenciones.at(-1) !== respuestaObj.intencion) {
        usuario.historial_intenciones.push(respuestaObj.intencion);
      }
    }

    // ✅ Actualizar última intención solo si es relevante
    if (respuestaObj?.intencion && !NO_REGISTRAR.includes(respuestaObj.intencion)) {
      usuario.ultima_intencion = respuestaObj.intencion_padre || respuestaObj.intencion;
    }

    await usuario.save();

    if (respuestaObj.enviar_lista) {
      await sendListMessage(from, "Menú Principal", respuestaObj.respuesta, "Municipalidad de San Pablo", respuestaObj.secciones);
    } else if (respuestaObj.enviar_interactivo) {
      const botonesValidos = (respuestaObj.botones || []).filter(b => b && b.id && b.title);
      if (botonesValidos.length > 0) {
        await sendInteractiveMessage(from, respuestaObj.respuesta, botonesValidos);
      } else {
        await sendMessage(from, respuestaObj.respuesta);
      }
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
