const axios = require("axios");
require("dotenv").config();

const TOKEN = process.env.WHATSAPP_CLOUD_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;

// ✅ Enviar mensaje interactivo con validación de botones
async function sendInteractiveMessage(to, bodyText, buttonsArray) {
  try {
    // 🛑 Validar botones
    if (!Array.isArray(buttonsArray) || buttonsArray.length === 0) {
      console.warn("⚠️ No se enviaron botones válidos, omitiendo mensaje interactivo.");
      return await sendMessage(to, bodyText + "\n\n(⚠️ Botones no disponibles)");
    }

    const botones = buttonsArray
      .filter(b => b && b.id && b.title)
      .slice(0, 3) // Máximo 3 botones
      .map(btn => ({
        type: "reply",
        reply: {
          id: btn.id,
          title: btn.title.substring(0, 20) // WhatsApp recomienda ≤20 caracteres
        }
      }));

    if (botones.length === 0) {
      console.warn("⚠️ Todos los botones eran inválidos.");
      return await sendMessage(to, bodyText + "\n\n(⚠️ No se pudieron cargar opciones)");
    }

    // Limitar body text por seguridad
    if (bodyText.length > 1024) {
      bodyText = bodyText.slice(0, 1000) + "…";
    }

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

// ✅ También mantenemos las otras funciones por si las necesitás
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
