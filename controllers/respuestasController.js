const Respuesta = require('../models/Respuesta');

exports.getRespuestas = async (req, res) => {
    try {
        const respuestas = await Respuesta.find();
        res.json(respuestas);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener respuestas" });
    }
};

exports.addRespuesta = async (req, res) => {
    const { intencion, respuesta } = req.body;

    if (!intencion || !respuesta) {
        return res.status(400).json({ error: "Faltan datos: intencion y respuesta son obligatorios" });
    }

    try {
        const respuestaActualizada = await Respuesta.findOneAndUpdate(
            { intencion },
            { respuesta },
            { upsert: true, new: true }
        );
        res.json({ mensaje: "Respuesta guardada exitosamente", data: respuestaActualizada });
    } catch (error) {
        res.status(500).json({ error: "Error al guardar respuesta" });
    }
};
