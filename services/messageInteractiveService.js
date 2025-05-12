const { sendInteractiveMessage } = require('../whatsappCloud');

/**
 * Envía un mensaje interactivo (botones) a un número dado.
 * @param {string} to - Número de teléfono del usuario.
 * @param {string} mensaje - Texto principal del mensaje.
 * @param {Array} botones - Array de botones [{id, title}, ...].
 */

console.log("📤 Enviando botones interactivos:", botones);

async function enviarBotonesInteractivos(to, mensaje, botones) {
  try {
    await sendInteractiveMessage(to, mensaje, botones);
  } catch (error) {
    console.error('Error enviando botones interactivos:', error.message);
  }
}

module.exports = { enviarBotonesInteractivos };
