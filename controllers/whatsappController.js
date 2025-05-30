const Usuario = require('../models/Usuario');
const { manejarUsuarioNuevo } = require('../services/userService');
const { obtenerRespuesta } = require('../services/respuestaService');
const { guardarMensaje } = require('../services/messageService');
const { sendMessage, sendInteractiveMessage, sendListMessage } = require('../whatsappCloud');
const handleError = require('../utils/errorHandler');
const { obtenerMenuPrincipal } = require('../services/menuService');
const { pushIntent, goBack } = require('../utils/navigationStack');

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

const sendHome = async (to, usuario) => {
  usuario.historial_intenciones = [];
  usuario.ultima_intencion = "menu_principal";
  await usuario.save();

  const secciones = await obtenerMenuPrincipal();
  const sent = await sendListMessage(
    to,
    "Menú Principal",
    "Por favor selecciona una categoría:",
    "Municipalidad de San Pablo",
    secciones
  );
  if (sent?.messages?.[0]?.id) {
    usuario.ultimo_mensaje_id = sent.messages[0].id;
    await usuario.save();
  }
};

exports.verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode && token === VERIFY_TOKEN) return res.status(200).send(challenge);
  return res.sendStatus(403);
};

exports.handleMessage = async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    if (changes?.field !== "messages") return res.sendStatus(200);

    const messageData = changes.value?.messages?.[0];
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
      console.log("👤 Usuario nuevo detectado:", from);
      await manejarUsuarioNuevo(from);
      usuario = await Usuario.findOne({ numero_whatsapp: from });
      return await sendHome(from, usuario);
    }

    const replyTo = messageData.context?.id;
    if (replyTo && usuario.ultimo_mensaje_id && replyTo !== usuario.ultimo_mensaje_id) {
      console.log("⚠️ Respuesta a un menú viejo. Ignorada.");
      await sendMessage(from, "Ese menú ya caducó. Por favor seleccioná una opción del menú actual.");
      const secciones = await obtenerMenuPrincipal();
      const sent = await sendListMessage(
        from,
        "Menú Principal",
        "Por favor seleccioná una opción del menú actual:",
        "Municipalidad de San Pablo",
        secciones
      );
      usuario.ultimo_mensaje_id = sent?.messages?.[0]?.id || usuario.ultimo_mensaje_id;
      await usuario.save();
      return res.sendStatus(200);
    }

    const stack = usuario.historial_intenciones || [];
    let desdeVolver = false;

    if (["home"].includes(message)) {
      console.log("📥 Botón 'Volver al inicio' activado");
      stack.length = 0;
      usuario.ultima_intencion = "menu_principal";
      usuario.historial_intenciones = stack;
      const secciones = await obtenerMenuPrincipal();
      const sent = await sendListMessage(
        from,
        "Menú Principal",
        "Por favor seleccioná una categoría:",
        "Municipalidad de San Pablo",
        secciones
      );
      usuario.ultimo_mensaje_id = sent?.messages?.[0]?.id || usuario.ultimo_mensaje_id;
      await usuario.save();
      return res.sendStatus(200);
    }

    if (["↩ volver", "volver"].includes(message)) {
      console.log("🔙 Botón Volver activado");
      const destino = goBack(stack);
      if (!destino) {
        console.log("🔙 Volver desde categoría → Regreso al Menú Principal");
        stack.length = 0;
        usuario.ultima_intencion = "menu_principal";
        usuario.historial_intenciones = stack;
        const secciones = await obtenerMenuPrincipal();
        const sent = await sendListMessage(
          from,
          "Menú Principal",
          "Por favor seleccioná una categoría:",
          "Municipalidad de San Pablo",
          secciones
        );
        usuario.ultimo_mensaje_id = sent?.messages?.[0]?.id || usuario.ultimo_mensaje_id;
        await usuario.save();
        return res.sendStatus(200);
      }

      console.log("⏪ Volviendo a:", destino);
      usuario.ultima_intencion = destino;
      message = destino;
      desdeVolver = true;
    }

    const respuestaObj = await obtenerRespuesta(message, from, usuario.numero_whatsapp);
    const esRoot = stack.length === 0;

    if (respuestaObj.enviar_lista && esRoot && respuestaObj.secciones?.[0]?.rows) {
      respuestaObj.secciones[0].rows = respuestaObj.secciones[0].rows.filter(r => r.id !== "volver");
    }

    const intencionFinal = respuestaObj?.intencion || message;
    console.log("🧠 Intención detectada:", intencionFinal);
    console.log("📜 Historial previo:", stack);

    const NO_REGISTRAR = [
      "saludo", "↩ volver", "volver", "menu", "inicio", "menu_principal", "home",
      "Default Welcome Intent", "Default Fallback Intent"
    ];
    const esAccion = ["home", "volver"].includes(intencionFinal);

    if (
      !NO_REGISTRAR.includes(intencionFinal) &&
      !desdeVolver &&
      !esAccion &&
      usuario.ultima_intencion !== intencionFinal
    ) {
      pushIntent(stack, intencionFinal);
      usuario.ultima_intencion = intencionFinal;
    }

    usuario.historial_intenciones = stack;
    await usuario.save();
    console.log("💾 Usuario actualizado: historial =", stack, "| última =", usuario.ultima_intencion);

    let sent;
    if (respuestaObj.enviar_lista) {
      sent = await sendListMessage(
        from,
        "Menú Principal",
        respuestaObj.respuesta,
        "Municipalidad de San Pablo",
        respuestaObj.secciones
      );
    } else if (respuestaObj.enviar_interactivo) {
      const botonesValidos = (respuestaObj.botones || []).filter(b => b && b.id && b.title);
      sent = botonesValidos.length > 0
        ? await sendInteractiveMessage(from, respuestaObj.respuesta, botonesValidos)
        : await sendMessage(from, respuestaObj.respuesta);
    } else {
      sent = await sendMessage(from, respuestaObj.respuesta);
    }

    if (sent?.messages?.[0]?.id) {
      usuario.ultimo_mensaje_id = sent.messages[0].id;
      await usuario.save();
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
