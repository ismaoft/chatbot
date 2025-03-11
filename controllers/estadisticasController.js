const Mensaje = require('../models/Mensaje');
const Usuario = require('../models/Usuario');

exports.getEstadisticas = async (req, res) => {
    try {
        const totalMensajes = await Mensaje.countDocuments();
        const totalUsuarios = await Usuario.countDocuments();
        
        // Obtener las intenciones más consultadas
        const intencionesFrecuentes = await Mensaje.aggregate([
            { $group: { _id: "$intencion", total: { $sum: 1 } } },
            { $sort: { total: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            totalMensajes,
            totalUsuarios,
            intencionesFrecuentes
        });
    } catch (error) {
        console.error("❌ Error al obtener estadísticas:", error);
        res.status(500).json({ error: "Error al obtener estadísticas" });
    }
};
