const Usuario = require('../models/Usuario');
const { obtenerMenuPrincipal } = require('./menuService');
const { sendListMessage } = require('../whatsappCloud');

async function get(numero) {
  let usuario = await Usuario.findOne({ numero_whatsapp: numero });
  if (!usuario) {
    usuario = new Usuario({
      numero_whatsapp: numero,
      historial_intenciones: [],
      ultima_intencion: 'menu_principal',
    });
    await usuario.save();
  }
  return usuario;
}




async function resetHome(usuario, to) {
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
}

module.exports = {
  get,
  resetHome
};
