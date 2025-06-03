const { sendMessage, sendListMessage } = require('../whatsappCloud');
const { obtenerMenuPrincipal } = require('../services/menuService');

async function validarReply(messageData, usuario, from) {
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

    if (sent?.messages?.[0]?.id) {
      usuario.ultimo_mensaje_id = sent.messages[0].id;
      await usuario.save();
    }

    return false;
  }

  return true;
}

module.exports = { validarReply };
