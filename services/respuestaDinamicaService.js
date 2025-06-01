const Respuesta = require('../models/Respuesta');
const Categoria = require('../models/Categoria');
const Boton = require('../models/Boton');
const Usuario = require('../models/Usuario');

async function obtenerRespuestaDinamica(clave, telefonoUsuario = null) {
  const doc = await Respuesta.findOne({ intencion: clave }).populate('botones').lean();

  console.log("🔍 clave buscada:", clave);
  console.log("📄 Documento encontrado:", doc);

  if (doc) {
    let botones = [];


    // 🟢 Tipo lista con secciones válidas
    if (doc.tipo === "lista" && Array.isArray(doc.secciones) && doc.secciones.length > 0) {
      const seccionesLimpias = doc.secciones.map(sec => ({
        title: sec.title?.toString().trim().substring(0, 24),
        rows: sec.rows.map(row => ({
          id: row.id?.toString().trim(),
          title: row.title?.toString().trim().substring(0, 24)
        })).filter(row => row.id && row.title)
      }));

      // ✅ Agregar botones de navegación si hay espacio y no están duplicados
      const rowsExtras = [];

      if (telefonoUsuario) {
        const usuario = await Usuario.findOne({ numero_whatsapp: telefonoUsuario });
        const historial = usuario?.historial_intenciones || [];

        // 🟨 Buscar la intención inmediatamente anterior distinta a esta
        const anterior = historial.length >= 2
          ? historial[historial.length - 2]
          : null;

        if (
          anterior &&
          anterior !== "menu" &&
          !doc.secciones.some(sec =>
            sec.rows?.some(row => row.id === anterior)
          )
        ) {
          rowsExtras.push({
            id: anterior,
            title: "↩ Volver"
          });
        }
      }


      // 🏠 Agregar botón Menú si no está ya
      // 🏠 Agregar botón Menú si no está duplicado
      if (!doc.secciones.some(sec =>
        sec.rows?.some(row => row.id === "menu")
      )) {
        rowsExtras.push({
          id: "menu",
          title: "🏠 Menú"
        });
      }


      // Insertar navegación en la última sección
      if (seccionesLimpias.length > 0) {
        const idsExistentes = new Set(
          seccionesLimpias.flatMap(sec => sec.rows.map(r => r.id))
        );

        // Solo agregar los extras si no están duplicados
        const extrasFiltrados = rowsExtras.filter(r => !idsExistentes.has(r.id));
        seccionesLimpias[seccionesLimpias.length - 1].rows.push(...extrasFiltrados);

      }

      console.log("📤 Respuesta tipo LISTA con secciones + navegación");
      return {
        respuesta: doc.respuesta,
        intencion: doc.intencion,
        categoria: doc.categoria,
        tipo: "lista",
        secciones: seccionesLimpias,
        botones: [],
        enviar_interactivo: false,
        enviar_lista: true
      };
    }


    // 🟨 Si tiene botones poblados, procesarlos
    if (Array.isArray(doc.botones) && doc.botones.length > 0) {
      botones = doc.botones.map(b => ({
        id: b.id?.toString().trim(),
        title: b.titulo?.toString().trim().substring(0, 20),
        description: b.descripcion?.toString().trim().substring(0, 72) || ""
      })).filter(b => b.id && b.title);
    }

    // Botón fijo: 🏠 Menú
    if (!botones.some(b => b.id === "menu")) {
      botones.push({ id: "menu", title: "🏠 Menú", description: "Regresar al inicio" });
    }

    // Botón dinámico: ↩ Volver
    if (telefonoUsuario) {
      const usuario = await Usuario.findOne({ numero_whatsapp: telefonoUsuario });
      const historial = usuario?.historial_intenciones || [];
      const anterior = historial.length > 0 ? historial[historial.length - 1] : null;

      if (anterior && anterior !== "menu" && !botones.some(b => b.id === anterior)) {
        botones.push({
          id: anterior,
          title: "↩ Volver",
          description: "Ir al paso anterior"
        });
      }
    }


    // Si hay más de 3 botones → convertir a lista
    if (botones.length > 3) {
      const secciones = [{
        title: "Opciones disponibles",
        rows: botones.map(b => ({
          id: b.id,
          title: b.title,
          description: b.description
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
      botones: botones.map(b => ({
        id: b.id,
        title: b.title
      })),
      enviar_interactivo: true,
      enviar_lista: false
    };
  }

  // 🔻 Fallback por categoría si no hay documento Respuesta
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
