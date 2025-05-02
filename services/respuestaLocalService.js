const Respuesta = require('../models/Respuesta');

async function buscarEnMongoDB(mensaje) {
  return await Respuesta.findOne({
    pregunta: { $regex: mensaje, $options: 'i' }
  });
}

async function buscarEnMongoDBPorIntencion(intencion) {
  return await Respuesta.findOne({
    intencion: intencion
  });
}

module.exports = { buscarEnMongoDB, buscarEnMongoDBPorIntencion };
