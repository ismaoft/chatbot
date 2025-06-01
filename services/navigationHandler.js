const { obtenerMenuPrincipal } = require('./menuService');
const { sendListMessage } = require('../whatsappCloud');
const { goBack } = require('../utils/navigationStack');

/**
 * Maneja el botón "home" reiniciando el historial y enviando el menú principal.
 */
async function manejarBotonHome(message, from, usuario) {
  if (message !== 'home') return false;

  console.log("📥 Botón 'Volver al inicio' activado");
  usuario.historial_intenciones = [];
  usuario.ultima_intencion = "menu_principal";
  await usuario.save();

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
    await usuario.save();
  }

  return true;
}

/**
 * Maneja el botón "↩ Volver" regresando al paso anterior o al menú principal.
 */
async function manejarBotonVolver(message, from, usuario) {
  if (!["↩ volver", "volver"].includes(message)) return { procesado: false };

  console.log("🔙 Botón Volver activado");
  const stack = usuario.historial_intenciones || [];
  const destino = goBack(stack);

  if (!destino) {
    console.log("🔙 Volver desde categoría → Regreso al Menú Principal");

    usuario.ultima_intencion = "menu_principal";
    usuario.historial_intenciones = [];
    await usuario.save();

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
      await usuario.save();
    }

    return { procesado: true, destino: null };
  }

  console.log("⏪ Volviendo a:", destino);
  usuario.ultima_intencion = destino;
  await usuario.save();

  return { procesado: true, destino };
}


module.exports = {
  manejarBotonHome,
  manejarBotonVolver
};
