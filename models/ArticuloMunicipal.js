const mongoose = require('mongoose');

const ArticuloMunicipalSchema = new mongoose.Schema({
  intencion: String, 
  preguntaEjemplo: String,
  respuesta: String,
  articulo: String,
  categoria: String,
  origen: String 
});

module.exports = mongoose.model('ArticuloMunicipal', ArticuloMunicipalSchema);
