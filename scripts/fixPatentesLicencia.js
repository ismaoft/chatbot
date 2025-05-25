const mongoose = require("mongoose");
const MONGO_URI = "mongodb://localhost:27017/chatbotDB";

const Respuesta = require("../models/Respuesta");
const Boton = require("../models/Boton");

async function restaurarPatentesYLicencias() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    const menuBtn = await Boton.findOne({ id: "menu" });
    const volverBtn = await Boton.findOne({ id: "inicio" });

    const buscarBotonId = async (id) => {
      const b = await Boton.findOne({ id });
      if (!b) throw new Error(`❌ Botón no encontrado: ${id}`);
      return b._id;
    };

    // 1. Hojas finales
    const hojas = [
      {
        intencion: "btn_llamar",
        respuesta: "📞 Podés llamar al +506 2277-0700 ext. 102 o 103 en horario laboral.",
        intencion_padre: "menu_contacto_patentes",
      },
      {
        intencion: "btn_correo",
        respuesta: "📧 Podés escribir a patentes@sanpablo.go.cr para consultas o trámites.",
        intencion_padre: "menu_contacto_patentes",
      },
      {
        intencion: "btn_req_formulario",
        respuesta: "📄 *Formulario de solicitud*\n\nDebés presentar el formulario oficial disponible en la municipalidad o en línea.",
        intencion_padre: "menu_requisitos_patentes",
      },
      {
        intencion: "btn_req_documentos",
        respuesta: "🗂️ *Documentación requerida*\n\n- Copia de cédula\n- Contrato de alquiler o permiso\n- Permiso sanitario\n- Plano de ubicación",
        intencion_padre: "menu_requisitos_patentes",
      },
      {
        intencion: "btn_tram_pagar",
        respuesta: "💰 *Pago de la patente*\n\nPuede realizarse en línea o presencialmente. Recordá presentar el número de patente.",
        intencion_padre: "menu_tramites_patentes",
      },
      {
        intencion: "btn_tram_suspendida",
        respuesta: "🚫 *Patente suspendida*\n\nDebés regularizar la situación con la oficina de patentes. Contactá para más detalles.",
        intencion_padre: "menu_tramites_patentes",
      }
    ];

for (const hoja of hojas) {
  await Respuesta.findOneAndUpdate(
    { intencion: hoja.intencion },
    {
      $set: {
        tipo: "botones",
        categoria: "patentes",
        intencion_padre: hoja.intencion_padre,
        respuesta: hoja.respuesta,
        botones: [volverBtn._id, menuBtn._id]
      }
    },
    { upsert: true }
  );
  console.log(`✅ Hoja actualizada/creada: ${hoja.intencion}`);
}


    // 2. Submenús intermedios
    const submenus = [
      {
        intencion: "menu_contacto_patentes",
        respuesta: "📇 ¿Cómo deseás contactarnos?",
        hijos: ["btn_llamar", "btn_correo"],
      },
      {
        intencion: "menu_requisitos_patentes",
        respuesta: "📑 ¿Qué parte de los requisitos deseás consultar?",
        hijos: ["btn_req_formulario", "btn_req_documentos"],
      },
      {
        intencion: "menu_tramites_patentes",
        respuesta: "📝 ¿Qué aspecto del trámite necesitás consultar?",
        hijos: ["btn_tram_pagar", "btn_tram_suspendida"],
      }
    ];

    for (const sub of submenus) {
      const botonesIds = await Promise.all([
        ...sub.hijos.map(id => buscarBotonId(id)),
        buscarBotonId("inicio"),
        buscarBotonId("menu")
      ]);

      const rows = [
        ...sub.hijos.map(id => {
          return { id, title: id.replace("btn_", "").replaceAll("_", " ").toUpperCase() };
        }),
        { id: "inicio", title: "↩ Volver" },
        { id: "menu", title: "🏠 Menú" }
      ];

      await Respuesta.create({
        intencion: sub.intencion,
        tipo: "lista",
        categoria: "patentes",
        respuesta: sub.respuesta,
        botones: botonesIds,
        secciones: [{ title: "Opciones disponibles", rows }]
      });

      console.log(`✅ Submenú creado: ${sub.intencion}`);
    }

    // 3. Menú principal de la categoría
// (Usar dentro del mismo archivo, después de crear los submenús)

const menuPrincipal = {
  intencion: "menu_patentes_y_licencias",
  respuesta: "🧾 ¿Qué deseas consultar sobre Patentes y Licencias?",
  hijos: ["btn_contacto", "btn_requisitos", "btn_tramites"]
};

const botonesMenu = await Promise.all([
  ...menuPrincipal.hijos.map(id => buscarBotonId(id)),
  buscarBotonId("inicio"),
  buscarBotonId("menu")
]);

const rowsMenu = [
  { id: "btn_contacto", title: "Contacto" },
  { id: "btn_requisitos", title: "Requisitos" },
  { id: "btn_tramites", title: "Trámites" },
  { id: "inicio", title: "↩ Volver" },
  { id: "menu", title: "🏠 Menú" }
];

await Respuesta.findOneAndUpdate(
  { intencion: menuPrincipal.intencion },
  {
    $set: {
      tipo: "lista",
      categoria: "patentes",
      respuesta: menuPrincipal.respuesta,
      botones: botonesMenu,
      secciones: [{ title: "Opciones disponibles", rows: rowsMenu }]
    }
  },
  { upsert: true }
);

console.log("✅ Menú principal actualizado: Patentes y Licencias");


  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB");
  }
}

restaurarPatentesYLicencias();
