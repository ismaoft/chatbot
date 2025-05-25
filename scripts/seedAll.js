const mongoose = require("mongoose");
const MONGO_URI = "mongodb://localhost:27017/chatbotDB";
const Respuesta = require("../models/Respuesta");

async function crearIntermediosPatentes() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    const intermedios = [
      {
        intencion: "btn_requisitos",
        categoria: "patentes",
        respuesta: "📋 ¿Qué deseas consultar sobre requisitos?",
        tipo: "lista",
        secciones: [
          {
            title: "Opciones disponibles",
            rows: [
              { id: "btn_req_formulario", title: "📄 Formulario requerido" },
              { id: "btn_req_documentos", title: "🗂 Documentos requeridos" },
              { id: "menu", title: "🏠 Menú" },
              { id: "inicio", title: "↩ Volver" }
            ]
          }
        ]
      },
      {
        intencion: "btn_tramites",
        categoria: "patentes",
        respuesta: "📋 ¿Qué trámite deseas consultar?",
        tipo: "lista",
        secciones: [
          {
            title: "Opciones disponibles",
            rows: [
              { id: "btn_tram_pagar", title: "💰 Pagar patente" },
              { id: "btn_tram_suspendida", title: "⛔ Patente suspendida" },
              { id: "menu", title: "🏠 Menú" },
              { id: "inicio", title: "↩ Volver" }
            ]
          }
        ]
      },
      {
        intencion: "btn_contacto",
        categoria: "patentes",
        respuesta: "📞 ¿Cómo deseas contactar al departamento?",
        tipo: "lista",
        secciones: [
          {
            title: "Opciones disponibles",
            rows: [
              { id: "btn_llamar", title: "📞 Llamar" },
              { id: "btn_correo", title: "📧 Correo electrónico" },
              { id: "menu", title: "🏠 Menú" },
              { id: "inicio", title: "↩ Volver" }
            ]
          }
        ]
      }
    ];

    let creados = 0;

    for (const doc of intermedios) {
      const existente = await Respuesta.findOne({ intencion: doc.intencion });
      if (!existente) {
        await Respuesta.create(doc);
        console.log(`✅ Intermedio creado: ${doc.intencion}`);
        creados++;
      } else {
        console.log(`⚠️ Ya existe: ${doc.intencion}`);
      }
    }

    console.log(`🎯 Total creados: ${creados}`);
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB");
  }
}

crearIntermediosPatentes();
