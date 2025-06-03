const Usuario = require('../models/Usuario');
const { manejarUsuarioNuevo } = require('../services/userService');
const { obtenerRespuesta } = require('../services/respuestaService');
const { guardarMensaje } = require('../services/messageService');
const { enviarRespuestaAlUsuario } = require('../services/mensajeHandler');
const { registrarIntencion } = require('../services/registroHandler');
const { validarReply } = require('../utils/replyValidator');
const { parseMessage } = require('../utils/messageParser');
const { nextState } = require('../services/navigationStack');
const { obtenerMenuPrincipal } = require('../services/menuService');
const { WELCOME_MESSAGE } = require('../utils/messages');
const { resetHome } = require('../services/sessionService');
const { buscarEnDialogflow } = require('../services/respuestaDialogflowService');



const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

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
    const messageData = entry?.changes?.[0]?.value?.messages?.[0];
    if (!messageData) return res.sendStatus(200);

    if (messageData?.from === entry?.changes?.[0]?.value?.metadata?.phone_number_id) {
      console.log("⛔ Mensaje propio ignorado");
      return res.sendStatus(200);
    }

    const from = messageData.from;
    const message = parseMessage(messageData);

    // Detectar si es texto libre o un ID de botón (ej: 'home', 'menu_pagina_1', etc.)
    const esTextoLibre = !messageData.type || messageData.type === 'text';

    let mensajeIntencion = message;

    if (esTextoLibre) {
      const intentDialogflow = await buscarEnDialogflow(message, from);
      mensajeIntencion = intentDialogflow?.intent || message;
    }



    let usuario = await Usuario.findOne({ numero_whatsapp: from });
    if (!usuario) {
      await manejarUsuarioNuevo(from);
      usuario = await Usuario.findOne({ numero_whatsapp: from });
    }

    // 🟢 Manejo de saludos antes de nextState
    const SALUDOS = ["hola", "buenas", "buenos días", "buenas tardes", "buenas noches", "saludos"];
    if (SALUDOS.includes(message.toLowerCase())) {
      console.log("📥 Tipo de mensaje: saludo");

      const historial = usuario?.historial_intenciones || [];
      const secciones = await obtenerMenuPrincipal(1, historial);

      await enviarRespuestaAlUsuario(usuario, from, {
        respuesta: WELCOME_MESSAGE,
        intencion: "saludo",
        tipo: "lista",
        secciones,
        botones: [],
        enviar_interactivo: false,
        enviar_lista: true
      });

      await guardarMensaje(
        from,
        message,
        WELCOME_MESSAGE,
        "saludo",
        null,
        false,
        null,
        null
      );

      return res.sendStatus(200);
    }

    const esValido = await validarReply(messageData, usuario, from);
    if (!esValido) return res.sendStatus(200);

    const stack = usuario.historial_intenciones || [];
    const nav = nextState({ stack, incoming: mensajeIntencion });


    switch (nav.action) {
      case 'HOME':
        await resetHome(usuario, from);
        return res.sendStatus(200);

      case 'BACK':
        await usuario.save();
        if (!nav.dest) {
          const secciones = await obtenerMenuPrincipal(1, []);
          await enviarRespuestaAlUsuario(usuario, from, {
            respuesta: "Por favor selecciona una categoría:",
            intencion: "menu_pagina_1",
            tipo: "lista",
            secciones,
            botones: [],
            enviar_interactivo: false,
            enviar_lista: true
          });
          return res.sendStatus(200);
        }
        break;

      case 'PUSH':
        await usuario.save();
        break;

      case 'IGNORE':
        console.log(`⛔ Intención ignorada: "${message}"`);
        return res.sendStatus(200);
    }

    const respuestaObj = await obtenerRespuesta(nav.dest || mensajeIntencion, from, usuario.numero_whatsapp);
    await registrarIntencion(usuario, respuestaObj.intencion);

    await enviarRespuestaAlUsuario(usuario, from, respuestaObj);
    await guardarMensaje(
      from,
      nav.dest || mensajeIntencion,
      respuestaObj.respuesta,
      respuestaObj.intencion,
      respuestaObj.categoria,
      respuestaObj.ambigua,
      respuestaObj.botones?.map(b => b.title || b) || null,
      respuestaObj.motivo_ambiguedad
    );

    return res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error en handleMessage:", error);
    return res.sendStatus(500);
  }
};
