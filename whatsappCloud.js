const axios = require("axios");
require("dotenv").config();

// Configurar variables de entorno
const TOKEN = process.env.WHATSAPP_CLOUD_TOKEN;  // Token de acceso de la API
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;  // ID del número de WhatsApp
const RECIPIENT_PHONE = process.env.RECIPIENT_PHONE; // Tu número personal en formato internacional (+506...)

console.log("Token cargado desde .env:", process.env.WHATSAPP_CLOUD_TOKEN);
console.log("Token cargado desde .env:", process.env.RECIPIENT_PHONE);

async function sendMessage(text) {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: RECIPIENT_PHONE,
                type: "text",
                text: { body: text },
            },
            {
                headers: {
                    Authorization: `Bearer ${TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("✅ Mensaje enviado:", response.data);
    } catch (error) {
        console.error("❌ Error al enviar mensaje:", error.response?.data || error.message);
    }
}

// Prueba enviando un mensaje
sendMessage("¡Hola! Probando la integración de WhatsApp Cloud API en Node.js 🚀");
