
const mongoose = require('mongoose');
const ArticuloMunicipal = require('../models/ArticuloMunicipal');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chatbot';

const articulos = [
  {
    intencion: 'calculo_impuesto_patente',
    preguntaEjemplo: '¿Cómo se calcula el impuesto de patentes?',
    respuesta: 'Según el artículo 4 de la Ley 7925, se aplica un 2 por mil (0.2%) sobre los ingresos brutos anuales. Esta suma se divide entre cuatro para determinar el monto trimestral.',
    articulo: 'Artículo 4',
    categoria: 'Patentes Municipales',
    origen: 'Ley 7925'
  },
  {
    intencion: 'requisitos_patente_municipal',
    preguntaEjemplo: '¿Qué necesito para obtener una patente municipal?',
    respuesta: 'Según el artículo 2 de la Ley 7925, es requisito estar al día con los tributos y obligaciones con la Municipalidad para solicitar o trasladar una licencia municipal.',
    articulo: 'Artículo 2',
    categoria: 'Patentes Municipales',
    origen: 'Ley 7925'
  },
  {
    intencion: 'declaracion_jurada_patente',
    preguntaEjemplo: '¿Cuándo debo presentar la declaración jurada?',
    respuesta: 'De acuerdo con el artículo 5 de la Ley 7925, la declaración jurada debe presentarse a más tardar el quinto día hábil de enero de cada año.',
    articulo: 'Artículo 5',
    categoria: 'Declaración Jurada',
    origen: 'Ley 7925'
  }
];

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    await ArticuloMunicipal.deleteMany({});
    await ArticuloMunicipal.insertMany(articulos);
    console.log('✅ Artículos legales cargados exitosamente.');
    mongoose.disconnect();
  })
  .catch(error => {
    console.error('❌ Error al cargar los artículos:', error);
    mongoose.disconnect();
  });
