// utils/sendMessage.js
const axios = require("axios");
require("dotenv").config();

const TOKEN = process.env.WHATSAPP_CLOUD_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;

async function sendMessage(to, textoPlano) {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: to,
                type: "text",
                text: { body: textoPlano },
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

module.exports = sendMessage;
