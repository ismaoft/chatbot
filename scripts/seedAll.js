// scriptCorregirBotonesVolverPermisosConstruccion.js
const mongoose = require('mongoose');
const Respuesta = require('../models/Respuesta');
const Boton = require('../models/Boton');

const MONGO_URI = 'mongodb://localhost:27017/chatbotDB'; // Ajusta si usás Atlas

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Conectado a MongoDB');

  const intenciones = [
    'btn_obras_menores',
    'btn_fraccionamientos',
    'btn_demoliciones'
  ];

  const idBotonVolver = (await Boton.findOne({ id: 'inicio' }))?._id;
  if (!idBotonVolver) {
    console.error('❌ No se encontró el botón "inicio".');
    return mongoose.disconnect();
  }

  for (const intencion of intenciones) {
    const doc = await Respuesta.findOne({ intencion });
    if (!doc) {
      console.warn(`⚠️ No se encontró la intención: ${intencion}`);
      continue;
    }

    const yaTieneVolver = doc.botones?.some(
      b => b.toString() === idBotonVolver.toString()
    );

    if (!yaTieneVolver) {
      doc.botones.push(idBotonVolver);
      await doc.save();
      console.log(`✅ Botón '↩ Volver' agregado a ${intencion}`);
    } else {
      console.log(`ℹ️ ${intencion} ya tiene botón '↩ Volver'`);
    }
  }

  await mongoose.disconnect();
  console.log('🔌 Desconectado de MongoDB');
}

run();
