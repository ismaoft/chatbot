const mongoose = require('mongoose');
const Boton = require('../models/Boton');
const dbURI = 'mongodb://127.0.0.1:27017/chatbotDB'; // Cambia si tu URI es diferente

async function limpiarTitulos() {
  try {
    await mongoose.connect(dbURI);
    console.log("✅ Conectado a MongoDB");

    const botones = await Boton.find({ id: { $in: [
      "btn_req_formulario",
      "btn_req_documentos",
      "btn_tram_pagar",
      "btn_tram_suspendida",
      "btn_llamar",
      "btn_correo",
      "btn_contacto",
      "btn_requisitos",
      "btn_tramites",
      "menu_patentes_y_licencias",
      "inicio"
    ]}});

    for (const boton of botones) {
      const tituloOriginal = boton.titulo;
      const tituloLimpio = tituloOriginal.replace(/[↩←⟵⇦↫↶↩️]+/g, '').trim();
      if (tituloOriginal !== tituloLimpio) {
        boton.titulo = tituloLimpio;
        await boton.save();
        console.log(`✅ Botón actualizado: ${boton.id} -> "${tituloLimpio}"`);
      } else {
        console.log(`ℹ️ Ya limpio: ${boton.id}`);
      }
    }

    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB");
  } catch (err) {
    console.error("❌ Error:", err);
    mongoose.disconnect();
  }
}

limpiarTitulos();
