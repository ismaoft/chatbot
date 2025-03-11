const express = require('express');
const router = express.Router();
const { getEstadisticas } = require('../controllers/estadisticasController');

router.get('/', getEstadisticas);

module.exports = router;
