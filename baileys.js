const { makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");

async function startWhatsApp() {
    // Configuración de autenticación para mantener la sesión activa
    const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
    const sock = makeWASocket({
        auth: state,
        browser: ["Windows", "Chrome", "10"]
    });
    

    // Guardar credenciales para evitar reconexiones manuales
    sock.ev.on("creds.update", saveCreds);

    // Generar el código QR en la terminal
    sock.ev.on("connection.update", ({ qr }) => {
        if (qr) {
            console.log("Escanea este código QR en WhatsApp:");
            qrcode.generate(qr, { small: true });
        }
    });

    // Manejar los mensajes recibidos
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        console.log("Mensaje recibido:", text);

        // Enviar respuesta automática
        await sock.sendMessage(msg.key.remoteJid, { text: "¡Hola! Soy tu chatbot sin Twilio." });
    });
}

startWhatsApp();