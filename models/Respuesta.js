const mongoose = require('mongoose');

const RespuestaSchema = new mongoose.Schema({
    intencion: { type: String, required: true },
    pregunta: { type: String },
    respuesta: { type: String, required: true },
    categoria: { type: String, default: 'General' } 
});

module.exports = mongoose.model('Respuesta', RespuestaSchema);
