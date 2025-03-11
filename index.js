require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./config/database'); 
const whatsappRoutes = require('./routes/whatsappRoutes');
const respuestasRoutes = require('./routes/respuestasRoutes');
const estadisticasRoutes = require('./routes/estadisticasRoutes');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// Rutas
app.use('/whatsapp', whatsappRoutes);
app.use('/respuestas', respuestasRoutes);
app.use('/estadisticas', estadisticasRoutes);

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`));
