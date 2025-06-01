const { sendListMessage, sendMessage } = require('../whatsappCloud');
const { obtenerMenuPrincipal } = require('./menuService');

/**
 * Verifica si el mensaje recibido es respuesta a un menú viejo.
 * En caso afirmativo, envía un aviso y el menú principal actualizado.
 * @param {string} from - Número de WhatsApp del remitente.
 * @param {object} usuario - Documento del usuario.
 * @param {string} replyTo - ID del mensaje al que se respondió.
 * @returns {boolean} - true si el mensaje fue inválido y se interrumpió el flujo.
 */
async function manejarMenuViejo(from, usuario, replyTo) {
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
    return true;
  }
  return false;
}

module.exports = {
  manejarMenuViejo
};
