const ArticuloMunicipal = require('../models/ArticuloMunicipal');

async function buscarArticuloPorIntencion(intencion) {
  return await ArticuloMunicipal.findOne({ intencion });
}

module.exports = { buscarArticuloPorIntencion };
