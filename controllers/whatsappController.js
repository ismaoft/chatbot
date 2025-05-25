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

    let message = messageData.text?.body?.trim()?.toLowerCase();
    if (messageData.interactive?.button_reply) {
      message = messageData.interactive.button_reply.id;
      console.log(`🔘 Botón presionado: "${message}" por ${from}`);
    } else if (messageData.interactive?.list_reply) {
      message = messageData.interactive.list_reply.id;
      console.log(`📋 Opción de lista seleccionada: "${message}" por ${from}`);
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

    // 🧭 Manejar botón volver
    if (message === "inicio" || message === "↩ volver") {
      if (usuario?.historial_intenciones?.length > 1) {
        const actual = usuario.historial_intenciones.pop();
        let anterior = usuario.historial_intenciones[usuario.historial_intenciones.length - 1];

        // Si el anterior es igual al actual, sigue retrocediendo
        while (anterior === actual && usuario.historial_intenciones.length > 1) {
          usuario.historial_intenciones.pop();
          anterior = usuario.historial_intenciones[usuario.historial_intenciones.length - 1];
        }

        message = anterior || "menu";
        await usuario.save();
      } else {
        message = "menu"; // fallback si no hay historial
      }
    }


    const respuestaObj = await obtenerRespuesta(message, from, usuario.numero_whatsapp);

    // 📝 Guardar historial solo si la intención es válida
    const NO_REGISTRAR = ["saludo", "menu", "inicio", "↩ volver", "Default Welcome Intent", "Default Fallback Intent"];
    if (
      respuestaObj?.intencion &&
      !NO_REGISTRAR.includes(respuestaObj.intencion) &&
      usuario.historial_intenciones?.[usuario.historial_intenciones.length - 1] !== respuestaObj.intencion
    ) {
      usuario.historial_intenciones = usuario.historial_intenciones || [];
      usuario.historial_intenciones.push(respuestaObj.intencion);
      await usuario.save();
    }


    console.log("🎯 Tipo de mensaje:", respuestaObj.tipo);
    console.log("🎯 Botones:", respuestaObj.botones);
    console.log("🎯 Secciones:", respuestaObj.secciones);

    if (respuestaObj.enviar_lista) {
      await sendListMessage(from, "Menú Principal", respuestaObj.respuesta, "Municipalidad de San Pablo", respuestaObj.secciones);
    } else if (respuestaObj.enviar_interactivo) {
      const botonesValidos = (respuestaObj.botones || []).filter(b => b && b.id && b.title);
      if (botonesValidos.length > 0) {
        await sendInteractiveMessage(from, respuestaObj.respuesta, botonesValidos);
      } else {
        console.warn("⚠️ No se encontraron botones válidos.");
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
