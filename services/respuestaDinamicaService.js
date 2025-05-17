const Respuesta = require('../models/Respuesta');
const Categoria = require('../models/Categoria');
const Boton = require('../models/Boton');

async function obtenerRespuestaDinamica(clave) {
  const doc = await Respuesta.findOne({ intencion: clave }).lean();

  console.log("🔍 clave buscada:", JSON.stringify(clave));
  console.log("🧾 Resultado encontrado:", doc);


  if (doc) {
    let botones = [];

    // 🚨 Si tipo ya es lista y secciones existen, usar directamente
    if (doc.tipo === "lista" && Array.isArray(doc.secciones)) {
      return {
        respuesta: doc.respuesta,
        intencion: doc.intencion,
        categoria: doc.categoria,
        tipo: "lista",
        secciones: doc.secciones,
        botones: [],
        enviar_interactivo: false,
        enviar_lista: true
      };
    }

    // 🔄 Si hay botones referenciados, poblamos
    if (Array.isArray(doc.botones) && doc.botones.length > 0) {
      const poblados = await Boton.find({ _id: { $in: doc.botones } }).lean();
      botones = poblados.map(b => ({
        id: b.id,
        title: b.titulo,
        description: b.descripcion || ""
      })).filter(b => b.id && b.title);
    }

    // 🧠 Asegurar botones de navegación si es hoja o no los tiene
    const tieneVolver = botones.some(b => b.id === 'menu' || b.title.toLowerCase().includes('volver'));
    if (botones.length === 0 || !tieneVolver) {
      if (!botones.find(b => b.id === 'menu')) {
        botones.push({ id: "menu", title: "🏠 Menú", description: "Regresar al inicio" });
      }
      if (!botones.find(b => b.id === doc.intencion_padre)) {
        botones.push({
          id: doc.intencion_padre || "inicio",
          title: "↩ Volver",
          description: "Ir al paso anterior"
        });
      }
    }

    // 📋 Si hay más de 3 → usar lista (generada dinámicamente)
    if (botones.length > 3) {
      const secciones = [{
        title: "Opciones disponibles",
        rows: botones.map(b => ({
          id: b.id,
          title: b.title?.substring(0, 24),
          description: b.description?.substring(0, 72)
        }))
      }];

      return {
        respuesta: doc.respuesta,
        intencion: doc.intencion,
        categoria: doc.categoria,
        tipo: "lista",
        secciones,
        botones: [],
        enviar_interactivo: false,
        enviar_lista: true
      };
    }

    // ✅ Enviar como botones
    return {
      respuesta: doc.respuesta,
      intencion: doc.intencion,
      categoria: doc.categoria,
      tipo: "botones",
      botones: botones.slice(0, 3).map(b => ({
        id: b.id,
        title: b.title.includes("Volver") ? `↩ ${b.title}` : b.title
      })),
      enviar_interactivo: true,
      enviar_lista: false
    };
  }

  // 🟡 Fallback por categoría si no es una respuesta directa
  const cat = await Categoria.findOne({ intencion_relacionada: clave }).populate('botones');
  if (cat && Array.isArray(cat.botones) && cat.botones.length > 0) {
    const botones = cat.botones.map(b => ({
      id: b.id?.toString().trim(),
      title: b.titulo?.toString().trim().substring(0, 20)
    })).filter(b => b.id && b.title);

    return {
      respuesta: `🔍 Opciones disponibles sobre *${cat.nombre}*`,
      intencion: clave,
      categoria: cat.nombre.toLowerCase(),
      tipo: "botones",
      botones: botones.slice(0, 3),
      enviar_interactivo: true,
      enviar_lista: false
    };
  }

  return null;
}

module.exports = { obtenerRespuestaDinamica };
