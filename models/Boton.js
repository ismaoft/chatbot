const mongoose = require('mongoose');

const BotonSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // ID único del botón (se usa en WhatsApp)
  titulo: { type: String, required: true }, // El texto visible en el botón
  categoria_origen: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true }, // Desde qué categoría sale este botón
  categoria_destino: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria' }, // Hacia qué categoría navega (opcional)
  url: { type: String }, // Si el botón abre un link externo
  es_accion: { type: Boolean, default: false }, // Si es un botón que ejecuta acción especial (ejemplo: "Hablar con agente", "Finalizar interacción")
});

module.exports = mongoose.model('Boton', BotonSchema);
