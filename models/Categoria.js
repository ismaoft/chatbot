const mongoose = require('mongoose');

const CategoriaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },                // Ej: "Patentes"
  descripcion: { type: String },
  emoji: { type: String },                                  // 👈 Nuevo campo para visual UX
  intencion_relacionada: { type: String },
  padre: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', default: null },
  botones: [
    {
      id: { type: String, required: true },
      titulo: { type: String, required: true },
      subcategoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria' }
    }
  ]
});

module.exports = mongoose.model('Categoria', CategoriaSchema);
