const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/chatbotDB'; // 🔁 Cambiá esto según tu entorno

const respuestaSchema = new mongoose.Schema({
  intencion: String,
  categoria: String,
  respuesta: String,
  tipo: String,
  botones: Array,
  intencion_padre: String
}, { collection: 'respuestas' });

const Respuesta = mongoose.model('Respuesta', respuestaSchema);

async function limpiarBotones() {
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('🔌 Conectado a MongoDB');

  const respuestas = await Respuesta.find({ tipo: 'botones' });

  for (const doc of respuestas) {
    const original = doc.botones || [];
    const corregidos = original.filter(b => b && b.id && b.title && typeof b.title === 'string' && b.title.trim().length > 0);

    if (corregidos.length !== original.length) {
      console.log(`🧹 Corrigiendo ${doc.intencion} → ${original.length} → ${corregidos.length}`);
      doc.botones = corregidos;
      await doc.save();
    } else {
      console.log(`✅ ${doc.intencion} ya está limpio (${corregidos.length} botones)`);
    }
  }

  await mongoose.disconnect();
  console.log('🔌 Desconectado de MongoDB');
}

limpiarBotones().catch(console.error);
