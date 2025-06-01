const { pushIntent } = require('../utils/navigationStack');

/**
 * Registra la intención final del mensaje si es válida.
 * @param {object} usuario - Documento del usuario.
 * @param {string[]} stack - Pila de historial de intenciones.
 * @param {string} intencionFinal - Intención detectada del mensaje.
 * @param {boolean} desdeVolver - Indica si el mensaje proviene de un botón "Volver".
 */
async function registrarIntencionSiAplica(usuario, stack, intencionFinal, desdeVolver = false) {
  const NO_REGISTRAR = [
    "saludo", "↩ volver", "volver", "menu", "inicio", "menu_principal", "home",
    "Default Welcome Intent", "Default Fallback Intent"
  ];

  const esAccion = ["home", "volver"].includes(intencionFinal);
  const intencionRepetida = usuario.ultima_intencion === intencionFinal;

  if (
    !NO_REGISTRAR.includes(intencionFinal) &&
    !desdeVolver &&
    !esAccion &&
    !intencionRepetida
  ) {
    pushIntent(stack, intencionFinal);
    usuario.ultima_intencion = intencionFinal;
  }

  usuario.historial_intenciones = stack;
  await usuario.save();
}

module.exports = {
  registrarIntencionSiAplica
};
