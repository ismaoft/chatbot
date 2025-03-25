const express = require('express');
const router = express.Router();
const { handleMessage, verifyWebhook } = require('../controllers/whatsappController');

// 📌 Ruta para recibir mensajes desde WhatsApp Cloud API
router.post('/', handleMessage);

// 📌 Ruta para la verificación del webhook de Meta
router.get('/', verifyWebhook);

module.exports = router;
