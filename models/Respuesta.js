const mongoose = require('mongoose');

const respuestaSchema = new mongoose.Schema({
  intencion: { type: String, required: true },
  categoria: { type: String },
  respuesta: { type: String, required: true },
  tipo: {
    type: String,
    enum: ["texto", "botones", "lista"],
    default: "texto"
  },
  botones: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boton'
  }]
  ,
  intencion_padre: { type: String } // 👈 NUEVO CAMPO
});


module.exports = mongoose.model('Respuesta', respuestaSchema);
