const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Conectado a MongoDB"))
    .catch(err => console.error("❌ Error en conexión MongoDB:", err));

module.exports = mongoose;
