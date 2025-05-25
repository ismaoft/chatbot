const mongoose = require("mongoose");

const MONGO_URI = "mongodb://localhost:27017/chatbotDB";
const Respuesta = require("../models/Respuesta");

async function agregarBotonesEmbebidos() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    const menusLista = await Respuesta.find({ tipo: "lista" });

    let actualizados = 0;

    for (const menu of menusLista) {
      if (!menu.secciones || !menu.secciones[0]) continue;

      const rows = menu.secciones[0].rows || [];

      // Verificamos si ya existen
      const yaTieneMenu = rows.some(row => row.id === "menu");
      const yaTieneInicio = rows.some(row => row.id === "inicio");

      if (yaTieneMenu && yaTieneInicio) continue;

      if (!yaTieneMenu) {
        rows.push({ id: "menu", title: "🏠 Menú" });
      }

      if (!yaTieneInicio) {
        rows.push({ id: "inicio", title: "↩ Volver" });
      }

      // Guardar actualización
      await Respuesta.updateOne(
        { _id: menu._id },
        { $set: { "secciones.0.rows": rows } }
      );

      console.log(`✅ Botones embebidos agregados a: ${menu.intencion}`);
      actualizados++;
    }

    console.log(`🎯 Total de menús actualizados: ${actualizados}`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB");
  }
}

agregarBotonesEmbebidos();
