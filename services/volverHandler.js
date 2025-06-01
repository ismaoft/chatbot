const { obtenerMenuPrincipal } = require('./menuService');
const { sendListMessage } = require('../whatsappCloud');
const { goBack } = require('../utils/navigationStack');

/**
 * Maneja la intención "↩ Volver" según el historial del usuario.
 * @param {object} usuario - Documento del usuario desde MongoDB.
 * @param {string} from - Número de WhatsApp.
 * @returns {string|null} - Devuelve la intención a reenviar o null si no hay más atrás.
 */
async function manejarVolver(usuario, from) {
  const stack = usuario.historial_intenciones || [];
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

    if (sent?.messages?.[0]?.id) {
      usuario.ultimo_mensaje_id = sent.messages[0].id;
    }

    await usuario.save();
    return null;
  }

  console.log("⏪ Volviendo a:", destino);
  usuario.ultima_intencion = destino;
  usuario.historial_intenciones = stack;
  await usuario.save();
  return destino;
}

module.exports = {
  manejarVolver
};
