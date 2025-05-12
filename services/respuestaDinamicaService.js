const Respuesta = require('../models/Respuesta');
const Categoria = require('../models/Categoria');

async function obtenerRespuestaDinamica(clave) {
  const doc = await Respuesta.findOne({ intencion: clave });

  if (doc) {
    const tipo = doc.tipo || "texto";

    if (tipo === "botones") {
      console.log("🔎 Botones antes del filtro:", doc.botones);
      const botonesValidos = (doc.botones || []).filter(b => b.id && b.title);
      console.log("✅ Botones válidos:", botonesValidos);
      return {
        respuesta: doc.respuesta,
        intencion: doc.intencion,
        categoria: doc.categoria,
        tipo,
        botones: botonesValidos,
        enviar_interactivo: true,
        enviar_lista: false
      };
    }

    if (tipo === "lista") {
      const secciones = [{
        title: "Opciones disponibles",
        rows: (doc.botones || []).map(b => ({
          id: b.id,
          title: b.title.substring(0, 24),
          description: b.descripcion?.substring(0, 72) || ""
        }))
      }];
      return {
        respuesta: doc.respuesta,
        intencion: doc.intencion,
        categoria: doc.categoria,
        tipo,
        secciones,
        botones: [],
        enviar_interactivo: false,
        enviar_lista: true
      };
    }

    return {
      respuesta: doc.respuesta + "\n\n¿Deseas continuar?",
      intencion: doc.intencion,
      categoria: doc.categoria,
      tipo: "botones",
      botones: [
        { id: "menu", title: "🏠 Menú" },
        { id: doc.intencion_padre || "inicio", title: "↩ Volver" }
      ],
      enviar_interactivo: true,
      enviar_lista: false
    };
  }

  const cat = await Categoria.findOne({ intencion_relacionada: clave });
  if (cat && cat.botones.length > 0) {
    const botones = cat.botones.map(b => ({
      id: b.id,
      title: b.titulo.substring(0, 20)
    }));

    return {
      respuesta: `🔍 Opciones disponibles sobre *${cat.nombre}*`,
      intencion: clave,
      categoria: cat.nombre.toLowerCase(),
      tipo: "botones",
      botones,
      enviar_interactivo: true,
      enviar_lista: false
    };
  }

  return null;
}

module.exports = { obtenerRespuestaDinamica };
