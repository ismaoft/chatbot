const mongoose = require("mongoose");

const MONGO_URI = "mongodb://localhost:27017/chatbotDB";
const Respuesta = require("../models/Respuesta");

async function limpiarSeccionesDeMenus() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    const menus = await Respuesta.find({ tipo: "lista" });

    for (const menu of menus) {
      if (!menu.secciones || !menu.secciones[0]) continue;

      // Eliminamos _id de cada row explícitamente
      const rowsLimpios = menu.secciones[0].rows.map(({ id, title }) => ({
        id,
        title
      }));

      const nuevaSeccion = [{
        title: menu.secciones[0].title || "Opciones disponibles",
        rows: rowsLimpios
      }];

      await Respuesta.collection.updateOne(
        { _id: menu._id },
        { $set: { secciones: nuevaSeccion } }
      );

      console.log(`✅ Limpiado _id en secciones de: ${menu.intencion}`);
    }

  } catch (error) {
    console.error("❌ Error limpiando secciones:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB");
  }
}

limpiarSeccionesDeMenus();
