const mongoose = require('mongoose');

const MensajeSchema = new mongoose.Schema({
    usuario_id: { type: String, required: true },
    mensaje: { type: String, required: true },
    respuesta: { type: String, required: true },
    intencion: { type: String },
    fecha: { type: Date, default: Date.now },
    estado: { type: String, default: 'respondido' },
    tiempo_respuesta: { type: Number },
    categoria: { type: String },
    origen: { type: String, default: 'WhatsApp' }
});

module.exports = mongoose.model('Mensaje', MensajeSchema);
