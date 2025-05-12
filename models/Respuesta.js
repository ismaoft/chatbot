const mongoose = require('mongoose');

const respuestaSchema = new mongoose.Schema({
  intencion: { type: String, required: true },
  categoria: { type: String, required: true },
  respuesta: { type: String, required: true },
  tipo: {
    type: String,
    enum: ["texto", "botones", "lista"],
    default: "texto"
  },
  botones: [
    {
      id: { type: String, required: true },
      title: { type: String, required: true }
    }
  ],
  intencion_padre: { type: String } // 👈 NUEVO CAMPO
});


module.exports = mongoose.model('Respuesta', respuestaSchema);
