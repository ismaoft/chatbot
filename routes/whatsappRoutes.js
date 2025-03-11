const express = require('express');
const router = express.Router();
const { handleMessage } = require('../controllers/whatsappController');

router.post('/', handleMessage);

module.exports = router;
