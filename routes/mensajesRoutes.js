const express = require('express');
const router = express.Router();
const { getAmbiguousMensajes } = require('../controllers/mensajesController');

// Ruta para obtener mensajes ambiguos
router.get('/ambiguos', getAmbiguousMensajes);

module.exports = router;
