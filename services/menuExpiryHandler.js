const { sendMessage, sendListMessage } = require('../whatsappCloud');
const { obtenerMenuPrincipal } = require('./menuService');

/**
 * Verifica si el mensaje responde a un menú anterior caducado y reacciona en consecuencia.
 * @param {string} from - Número de WhatsApp.
 * @param {object} messageData - Objeto del mensaje recibido.
 * @param {object} usuario - Documento del usuario en MongoDB.
 * @returns {boolean} - true si el mensaje fue una respuesta a un menú viejo y se manejó aquí.
 */
async function manejarMenuCaducado(from, messageData, usuario) {
  const replyTo = messageData.context?.id;
  const mensajeActual = usuario.ultimo_mensaje_id;

  if (!replyTo || !mensajeActual || replyTo === mensajeActual) return false;

  console.log("⚠️ Respuesta a un menú viejo. Ignorada.");
  await sendMessage(from, "Ese menú ya caducó. Por favor seleccioná una opción del menú actual.");

  const secciones = await obtenerMenuPrincipal();
  const sent = await sendListMessage(
    from,
    "Menú Principal",
    "Por favor seleccioná una categoría del menú actual:",
    "Municipalidad de San Pablo",
    secciones
  );

  if (sent?.messages?.[0]?.id) {
    usuario.ultimo_mensaje_id = sent.messages[0].id;
    await usuario.save();
  }

  return true;
}

module.exports = {
  manejarMenuCaducado
};
