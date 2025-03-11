const mongoose = require('mongoose');

const RespuestaSchema = new mongoose.Schema({
    intencion: { type: String, unique: true, required: true },
    respuesta: { type: String, required: true }
});

module.exports = mongoose.model('Respuesta', RespuestaSchema);
