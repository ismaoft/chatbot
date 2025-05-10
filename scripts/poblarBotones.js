const mongoose = require('mongoose');
const Categoria = require('../models/Categoria');
const Boton = require('../models/Boton');
require("dotenv").config();

mongoose.connect(`mongodb://localhost:27017/chatbotDB`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

(async () => {
  try {
    // Suponemos que ya creaste categoría 'Patentes'
    const categoriaPatentes = await Categoria.findOne({ nombre: 'Patentes' });

    if (!categoriaPatentes) {
      console.error('❌ No se encontró la categoría "Patentes"');
      process.exit(1);
    }

    // Insertar botones ejemplo
    await Boton.insertMany([
      {
        id: 'btn_requisitos',
        titulo: 'Requisitos',
        categoria_origen: categoriaPatentes._id,
      },
      {
        id: 'btn_tramites',
        titulo: 'Trámites',
        categoria_origen: categoriaPatentes._id,
      },
      {
        id: 'btn_contacto',
        titulo: 'Contacto',
        categoria_origen: categoriaPatentes._id,
        url: 'mailto:patentes@muni.go.cr',
      },
      {
        id: 'btn_volver_inicio',
        titulo: 'Volver al Menú Principal',
        categoria_origen: categoriaPatentes._id,
        categoria_destino: null, // o la categoría del menú principal
      }
    ]);

    console.log('✅ Botones insertados correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al poblar botones:', error);
    process.exit(1);
  }
})();
