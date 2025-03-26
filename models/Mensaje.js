// models/Mensaje.js
const mongoose = require('mongoose');

const MensajeSchema = new mongoose.Schema({
    usuario_id: { type: String, required: true },
    mensaje: { type: String, required: true },
    respuesta: { type: String, required: true },
    intencion: { type: String },
    categoria: { type: String },
    ambigua: { type: Boolean, default: false }, 
    opciones_alternativas: { type: [String], default: [] }, 
    motivo_ambiguedad: { type: String }, 
    estado: { type: String, default: 'respondido' },
    tiempo_respuesta: { type: Number },
    origen: { type: String, default: 'WhatsApp' },
    fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mensaje', MensajeSchema);