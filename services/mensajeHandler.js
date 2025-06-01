const { sendListMessage, sendInteractiveMessage, sendMessage } = require('../whatsappCloud');

/**
 * Envía la respuesta adecuada según el tipo (lista, botones o texto).
 * @param {object} usuario - Documento de usuario (MongoDB).
 * @param {string} from - Número de WhatsApp del usuario.
 * @param {object} respuestaObj - Objeto con la respuesta dinámica.
 * @returns {Promise<void>}
 */
async function enviarRespuestaAlUsuario(usuario, from, respuestaObj) {
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
}

module.exports = {
  enviarRespuestaAlUsuario
};
