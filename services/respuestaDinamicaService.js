const Respuesta = require('../models/Respuesta');
const Categoria = require('../models/Categoria');
const Boton = require('../models/Boton');
const Usuario = require('../models/Usuario');

async function obtenerRespuestaDinamica(clave, telefonoUsuario = null) {
  const doc = await Respuesta.findOne({ intencion: clave }).lean();

  console.log("🔍 clave buscada:", clave);
  console.log("📄 Documento encontrado:", doc);

  if (doc) {
    let botones = [];

    // Si ya tiene secciones, enviarlas
    if (doc.tipo === "lista" && Array.isArray(doc.secciones) && doc.secciones.length > 0) {
      console.log("📤 Respuesta tipo LISTA con secciones");
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

    // Poblar botones si existen
    if (Array.isArray(doc.botones) && doc.botones.length > 0) {
      const poblados = await Boton.find({ _id: { $in: doc.botones } }).lean();
      botones = poblados.map(b => ({
        id: b.id,
        title: b.titulo,
        description: b.descripcion || ""
      })).filter(b => b.id && b.title);
    }

    // Botón menú (evitar duplicados por título)
    if (!botones.some(b => b.title === "🏠 Menú")) {
      botones.push({ id: "menu", title: "🏠 Menú", description: "Regresar al inicio" });
    }

    // Botón volver dinámico
    if (telefonoUsuario) {
      const usuario = await Usuario.findOne({ numero_whatsapp: telefonoUsuario });
      const historial = usuario?.historial_intenciones || [];
      const anterior = historial.length >= 2 ? historial[historial.length - 2] : "menu";
      const yaTieneVolver = botones.some(b => b.title === "↩ Volver");

      if (!yaTieneVolver && anterior && anterior !== "menu") {
        botones.push({
          id: anterior,
          title: "↩ Volver",
          description: "Ir al paso anterior"
        });
      }
    }

    if (botones.length > 3) {
      const secciones = [{
        title: "Opciones disponibles",
        rows: botones.map(b => ({
          id: b.id,
          title: b.title?.substring(0, 24),
          description: b.description?.substring(0, 72)
        }))
      }];

      console.log("📤 Respuesta tipo LISTA por cantidad de botones");
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

    console.log("📤 Respuesta tipo BOTONES");
    return {
      respuesta: doc.respuesta,
      intencion: doc.intencion,
      categoria: doc.categoria,
      tipo: "botones",
      botones: botones.slice(0, 3).map(b => ({
        id: b.id,
        title: b.title
      })),
      enviar_interactivo: true,
      enviar_lista: false
    };
  }

  // Fallback por categoría
  const cat = await Categoria.findOne({ intencion_relacionada: clave }).populate('botones');
  if (cat && Array.isArray(cat.botones) && cat.botones.length > 0) {
    const botones = cat.botones.map(b => ({
      id: b.id?.toString().trim(),
      title: b.titulo?.toString().trim().substring(0, 20)
    })).filter(b => b.id && b.title);

    console.log("📤 Fallback por categoría encontrada:", cat.nombre);
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

  console.log("❌ No se encontró respuesta dinámica ni categoría");
  return null;
}

module.exports = { obtenerRespuestaDinamica };
