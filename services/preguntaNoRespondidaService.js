const Respuesta = require('../models/Respuesta');

async function registrarPreguntaSinRespuesta(preguntaUsuario) {
    const fecha = new Date();
    const fechaYHora = fecha.toISOString().replace(/T/, ' ').replace(/\..+/, '');

    const intencionUnica = `Sin clasificar ${fechaYHora}`;

    const existe = await Respuesta.findOne({ intencion: intencionUnica });

    if (!existe) {
        await Respuesta.create({
            intencion: intencionUnica,
            pregunta: preguntaUsuario,
            respuesta: "Pendiente de edición"
        });

        console.log("✅ Pregunta sin respuesta registrada correctamente.");
    } else {
        console.log("🔄 Esta intención ya fue registrada.");
    }

    return `🤔 No tengo una respuesta exacta en este momento.  
Pero he registrado tu pregunta para mejorar el servicio.  

🔹 Puedes intentar reformular tu pregunta.  
🔹 Si necesitas ayuda urgente, escribe *"Hablar con un agente"*.  
🔹 También puedes visitar nuestro sitio web: https://www.sanpablo.go.cr/`;
}

module.exports = { registrarPreguntaSinRespuesta };
