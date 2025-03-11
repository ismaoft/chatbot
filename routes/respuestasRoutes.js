const express = require('express');
const router = express.Router();
const { getRespuestas, addRespuesta } = require('../controllers/respuestasController');

router.get('/', getRespuestas);
router.post('/', addRespuesta);

module.exports = router;
