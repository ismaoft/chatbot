// seedFromYaml.js
const fs = require('fs');
const yaml = require('js-yaml');
const mongoose = require('mongoose');

const Categoria = require('../models/Categoria');
const Boton = require('../models/Boton');
const Respuesta = require('../models/Respuesta');

const MONGO_URI = 'mongodb://localhost:27017/chatbotDB';

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Leer y parsear el archivo YAML
    const yamlData = yaml.load(fs.readFileSync('../scripts/flows/flowControlDePlagasYSaludAmbiental.yaml', 'utf8')); 

    // 1. Insertar Categoría
    const nuevaCategoria = new Categoria({
      nombre: yamlData.categoria.nombre,
      descripcion: yamlData.categoria.descripcion,
      emoji: yamlData.categoria.emoji,
      intencion_relacionada: yamlData.categoria.intencion_relacionada
    });

    await Categoria.deleteMany({ intencion_relacionada: nuevaCategoria.intencion_relacionada });
    const categoriaGuardada = await nuevaCategoria.save();
    console.log(`📁 Categoría insertada: ${categoriaGuardada.nombre}`);

    // 2. Insertar Botones
    await Boton.deleteMany({ id: { $in: yamlData.botons.map(b => b.id) } });

    const botonesDocs = await Boton.insertMany(
      yamlData.botons.map(b => ({
        ...b,
        categoria_origen: categoriaGuardada._id
      }))
    );
    console.log(`🎛️ Botones insertados: ${botonesDocs.length}`);

    // Crear un mapa rápido para buscar por id
    const botonesMap = {};
    botonesDocs.forEach(btn => {
      botonesMap[btn.id] = btn._id;
    });

    // Agregar también los botones globales "volver" y "home"
    const botonesGlobales = await Boton.find({ id: { $in: ['volver', 'menu', 'home'] } });
    botonesGlobales.forEach(btn => {
      botonesMap[btn.id] = btn._id;
    });

    // 3. Insertar Respuestas
    await Respuesta.deleteMany({ intencion: { $in: yamlData.respuestas.map(r => r.intencion) } });

    const respuestasConvertidas = yamlData.respuestas.map(resp => {
      const convertidos = {
        intencion: resp.intencion,
        tipo: resp.tipo,
        categoria: resp.categoria,
        respuesta: resp.respuesta,
        intencion_padre: resp.intencion_padre,
        secciones: resp.secciones || [],
        botones: Array.isArray(resp.botones)
          ? resp.botones.map(id => botonesMap[id]).filter(b => b)
          : []
      };
      return convertidos;
    });

    await Respuesta.insertMany(respuestasConvertidas);
    console.log(`📨 Respuestas insertadas: ${respuestasConvertidas.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
})();
