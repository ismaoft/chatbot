const axios = require("axios");
require("dotenv").config();

const TOKEN = process.env.WHATSAPP_CLOUD_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
const RECIPIENT_PHONE = process.env.RECIPIENT_PHONE;


// ✅ Función original de texto
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
            { headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" } }
        );
        console.log("✅ Mensaje enviado:", response.data);
    } catch (error) {
        console.error("❌ Error al enviar mensaje:", error.response?.data || error.message);
    }
}

// ✅ Función para enviar botones interactivos (con validaciones)
async function sendInteractiveMessage(to, bodyText, buttonsArray) {
    try {
        // Limitar body text a 1024 caracteres (WhatsApp máximo permitido)
        if (bodyText.length > 1024) {
            bodyText = bodyText.slice(0, 1000) + "…";
        }

        // Limitar a máximo 3 botones
        const botones = buttonsArray.slice(0, 3).map(btn => ({
            type: "reply",
            reply: {
                id: btn.id,
                title: btn.title.substring(0, 20) // WhatsApp recomienda ≤20 caracteres
            }
        }));

        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: to,
                type: "interactive",
                interactive: {
                    type: "button",
                    body: { text: bodyText },
                    action: { buttons: botones }
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ Mensaje interactivo enviado:", response.data);
    } catch (error) {
        console.error("❌ Error al enviar mensaje interactivo:", error.response?.data || error.message);
    }
}


// ✅ NUEVA: Función para enviar lista interactiva
async function sendListMessage(to, headerText, bodyText, footerText, sections) {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: to,
                type: "interactive",
                interactive: {
                    type: "list",
                    header: { type: "text", text: headerText },
                    body: { text: bodyText },
                    footer: { text: footerText },
                    action: {
                        button: "Ver opciones",
                        sections: sections
                    }
                }
            },
            { headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" } }
        );
        console.log("✅ Lista interactiva enviada:", response.data);
    } catch (error) {
        console.error("❌ Error al enviar lista interactiva:", error.response?.data || error.message);
    }
}

module.exports = { sendMessage, sendInteractiveMessage, sendListMessage };
