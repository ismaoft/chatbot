const { detectIntent } = require('../config/dialogflow');

async function buscarEnDialogflow(mensaje, sessionId) {
  const resultado = await detectIntent(mensaje, sessionId);

  if (!resultado.intent || resultado.confidence < 0.7) {
    return null; // respuesta poco confiable
  }

  return resultado;
}

module.exports = { buscarEnDialogflow };
