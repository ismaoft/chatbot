const { registrarPreguntaSinRespuesta } = require('./preguntaNoRespondidaService');

const frasesAmbiguas = [
  "no entiendo", "explícame", "dime más", "no está claro",
  "¿cuál?", "¿cómo así?", "¿qué significa?"
];

function esAmbigua(pregunta) {
  return frasesAmbiguas.some(f => pregunta.includes(f));
}

async function manejarAmbiguedad(pregunta) {
  return await registrarPreguntaSinRespuesta(pregunta);
}

module.exports = { esAmbigua, manejarAmbiguedad };
