// fixBotonsVolverMalos.js
const mongoose = require("mongoose");

const MONGO_URI = "mongodb://localhost:27017/chatbotDB";
const Boton = mongoose.model("Boton", new mongoose.Schema({
  id: String,
  titulo: String,
  es_accion: Boolean
}), "botons");

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    const erroneos = await Boton.find({
      titulo: "↩ Volver",
      id: { $ne: "volver" }
    });

    if (erroneos.length === 0) {
      console.log("👌 No hay botones con títulos incorrectos");
      return;
    }

    for (const boton of erroneos) {
      console.log(`❌ Corrigiendo botón: ${boton.id} -> titulo original: ${boton.titulo}`);

      // Aquí podés actualizar el título manualmente si sabés cuál es
      // Por ejemplo, podríamos usar una tabla de corrección o eliminar directamente el título erróneo:
      await Boton.updateOne(
        { _id: boton._id },
        {
          $set: {
            titulo: "🔧 Título corregido",
            es_accion: false
          }
        }
      );
    }

    console.log(`🎯 Botones corregidos: ${erroneos.length}`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB");
  }
})();
