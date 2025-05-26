const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  numero_whatsapp: { type: String, unique: true, required: true },
  nombre: { type: String },
  fecha_registro: { type: Date, default: Date.now },
  mensajes_enviados: { type: Number, default: 0 },
  ultima_interaccion: { type: Date },
  historial_intenciones: { type: [String], default: [] },
  ultima_intencion: { type: String, default: 'menu' } // 👈 Agregalo aquí
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
