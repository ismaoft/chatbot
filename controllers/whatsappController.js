const Usuario = require('../models/Usuario');
const Mensaje = require('../models/Mensaje');
const Respuesta = require('../models/Respuesta');
const { detectIntent } = require('../config/dialogflow');
const { twilioClient, twilioNumber } = require('../config/twilio');

async function obtenerRespuesta(mensajeUsuario) {
    console.log(`🔍 Buscando respuesta en MongoDB para la pregunta: ${mensajeUsuario}`);

    let respuestaDB = await Respuesta.findOne({
        pregunta: { $regex: mensajeUsuario, $options: "i" }
    });

    if (!respuestaDB) {
        console.log("⚠️ No se encontró coincidencia exacta. Registrando nueva pregunta con fecha...");

        // Generar la intención con la fecha actual (YYYY-MM-DD)
        let fechaHoy = new Date().toISOString().split("T")[0]; // Formato: "2025-03-11"
        let nuevaIntencion = `Sin clasificar ${fechaHoy}`;

        respuestaDB = await Respuesta.create({
            intencion: nuevaIntencion,
            pregunta: mensajeUsuario,
            respuesta: "Pendiente de edición"
        });

        return "No tengo una respuesta para eso aún, pero lo estoy registrando.";
    }

    console.log(`✅ Respuesta encontrada en MongoDB: ${respuestaDB.respuesta}`);
    return respuestaDB.respuesta;
}



exports.handleMessage = async (req, res) => {
    console.log("📩 Mensaje recibido desde Twilio:", req.body);

    const message = req.body.Body;
    const from = req.body.From;
    const startTime = Date.now();

    try {
        console.log(`📌 Mensaje detectado: "${message}" de ${from}`);

        let usuario = await Usuario.findOneAndUpdate(
            { numero_whatsapp: from },
            { $inc: { mensajes_enviados: 1 }, ultima_interaccion: new Date() },
            { new: true, upsert: true }
        );

        // 🔍 Buscar respuesta en MongoDB primero
        let responseMessage = await obtenerRespuesta(message);
        let intentName = "Sin clasificar";

        if (!responseMessage) {
            console.log("⚠️ No se encontró respuesta en MongoDB, consultando Dialogflow...");

            // Consultar Dialogflow
            const intentData = await detectIntent(message, from);
            intentName = intentData.intent;
            responseMessage = intentData.response;

            if (intentName === "Default Fallback Intent") {
                console.log("⚠️ No se encontró respuesta en Dialogflow. Registrando en MongoDB para futura edición.");

                // Guardar la pregunta en MongoDB para que pueda ser editada manualmente
                await Respuesta.create({
                    intencion: "Sin clasificar",
                    pregunta_original: message,
                    respuesta: "Pendiente de edición"
                });

                responseMessage = "No tengo una respuesta para eso aún, pero lo estoy registrando.";
            }
        }

        console.log(`📌 Intención detectada: ${intentName}, Respuesta enviada: ${responseMessage}`);

        const tiempoRespuesta = (Date.now() - startTime) / 1000;

        // 📌 Guardar interacción en MongoDB
        await Mensaje.create({
            usuario_id: from,
            mensaje: message,
            respuesta: responseMessage,
            intencion: intentName,
            tiempo_respuesta: tiempoRespuesta,
            categoria: "General",
            origen: "WhatsApp"
        });

        // 📌 Enviar respuesta al usuario por WhatsApp
        await twilioClient.messages.create({
            from: twilioNumber,
            to: from,
            body: responseMessage
        });

    } catch (error) {
        console.error("❌ Error al procesar la solicitud:", error);
    }

    res.sendStatus(200);
};
