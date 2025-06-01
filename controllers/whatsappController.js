const Usuario = require('../models/Usuario');
const { manejarUsuarioNuevo } = require('../services/userService');
const { obtenerRespuesta } = require('../services/respuestaService');
const { guardarMensaje } = require('../services/messageService');

const { enviarRespuestaAlUsuario } = require('../services/mensajeHandler');
const { manejarBotonHome, manejarBotonVolver } = require('../services/navigationHandler');
const { registrarIntencionSiAplica } = require('../services/registroHandler');
const { validarReply } = require('../utils/replyValidator');
const { parseMessage } = require('../utils/messageParser');

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
    const changes = entry?.changes?.[0];
    if (changes?.field !== "messages") return res.sendStatus(200);

    const value = changes?.value;
    const messageData = value?.messages?.[0];
    if (!messageData) return res.sendStatus(200);

    // ⛔ Ignorar mensajes del propio número del bot
    if (messageData?.from === value?.metadata?.phone_number_id) {
      console.log("⛔ Mensaje propio ignorado");
      return res.sendStatus(200);
    }

    const from = messageData.from;
    const message = parseMessage(messageData);

    let usuario = await Usuario.findOne({ numero_whatsapp: from });
    if (!usuario) {
      console.log("👤 Usuario nuevo detectado:", from);
      await manejarUsuarioNuevo(from);
      usuario = await Usuario.findOne({ numero_whatsapp: from });
    }

    // 🧪 Validar si el mensaje es de un menú viejo
    const esValido = await validarReply(messageData, usuario, from);
    if (!esValido) return res.sendStatus(200);

    // 🏠 Botón "home"
    const regresoInicio = await manejarBotonHome(message, from, usuario);
    if (regresoInicio) return res.sendStatus(200);

    // 🔙 Botón "volver"
    const resultadoVolver = await manejarBotonVolver(message, from, usuario);
    if (resultadoVolver?.procesado && resultadoVolver.destino === null) {
      console.log("✅ Menú principal enviado desde botón volver. Flujo detenido.");
      return res.sendStatus(200);
    }

    const desdeVolver = Boolean(resultadoVolver?.procesado);
    const mensajeProcesar = resultadoVolver?.destino || message;


    // 🧠 Obtener respuesta dinámica
    const respuestaObj = await obtenerRespuesta(mensajeProcesar, from, usuario.numero_whatsapp);
    const intencionFinal = respuestaObj?.intencion || mensajeProcesar;

    const stack = usuario.historial_intenciones || [];

    console.log("🧠 Intención detectada:", intencionFinal);
    console.log("📜 Historial previo:", stack);

    await registrarIntencionSiAplica(usuario, stack, intencionFinal, desdeVolver);

    // 📤 Enviar respuesta
    await enviarRespuestaAlUsuario(usuario, from, respuestaObj);

    // 💾 Guardar mensaje
    await guardarMensaje(
      from,
      mensajeProcesar,
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


