// limpiarColecciones.js
const mongoose = require("mongoose");

const MONGO_URI = "mongodb://localhost:27017/chatbotDB";

// Esquemas genéricos para poder acceder a las colecciones
const botonSchema = new mongoose.Schema({}, { strict: false });
const respuestaSchema = new mongoose.Schema({}, { strict: false });
const categoriaSchema = new mongoose.Schema({}, { strict: false });

const Boton = mongoose.model("Boton", botonSchema, "botons");
const Respuesta = mongoose.model("Respuesta", respuestaSchema, "respuestas");
const Categoria = mongoose.model("Categoria", categoriaSchema, "categorias");

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    const resultado = await Promise.all([
      Boton.deleteMany({}),
      Respuesta.deleteMany({}),
      Categoria.deleteMany({})
    ]);

    console.log(`🗑️ Botones eliminados: ${resultado[0].deletedCount}`);
    console.log(`🗑️ Respuestas eliminadas: ${resultado[1].deletedCount}`);
    console.log(`🗑️ Categorías eliminadas: ${resultado[2].deletedCount}`);
  } catch (error) {
    console.error("❌ Error al limpiar colecciones:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB");
  }
})();
