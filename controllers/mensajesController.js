const Mensaje = require('../models/Mensaje');

exports.getAmbiguousMensajes = async (req, res) => {
    try {
        const mensajesAmbiguos = await Mensaje.find({ ambigua: true });
        res.json(mensajesAmbiguos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener mensajes ambiguos' });
    }
};
