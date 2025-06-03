
/**
 * Registra la intención final del mensaje si es válida.
 * @param {object} usuario - Documento del usuario.
 * @param {string[]} stack - Pila de historial de intenciones.
 * @param {string} intencionFinal - Intención detectada del mensaje.
 * @param {boolean} desdeVolver - Indica si el mensaje proviene de un botón "Volver".
 */
async function registrarIntencion(usuario, intencion) {
  usuario.ultima_intencion = intencion;
  await usuario.save();
}

module.exports = { registrarIntencion };
