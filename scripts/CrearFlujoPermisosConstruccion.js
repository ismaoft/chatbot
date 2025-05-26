const mongoose = require("mongoose");
const Boton = require("../models/Boton");
const Respuesta = require("../models/Respuesta");

const MONGO_URI = "mongodb://localhost:27017/chatbotDB";

const botones = [
  { id: "btn_obras_menores_info", titulo: "Requisitos para obras menores", descripcion: "Información básica para solicitar el permiso", es_accion: false },
  { id: "btn_obras_menores_costos", titulo: "Costos de obra menor", descripcion: "Monto estimado según tipo y tamaño de la obra", es_accion: false },
  { id: "btn_fraccionamientos_info", titulo: "Requisitos para fraccionar", descripcion: "Condiciones técnicas y legales necesarias", es_accion: false },
  { id: "btn_fraccionamientos_documentos", titulo: "Documentos para fraccionamiento", descripcion: "Documentación que debés presentar", es_accion: false },
  { id: "btn_demoliciones_info", titulo: "Requisitos para demolición", descripcion: "Condiciones necesarias para solicitar la demolición", es_accion: false },
  { id: "btn_demoliciones_documentos", titulo: "Documentos para demolición", descripcion: "Documentos necesarios para el trámite", es_accion: false },

  // Botones de volver
  { id: "btn_obras_menores", titulo: "↩ Volver", descripcion: "Volver al menú de obras menores", es_accion: false },
  { id: "btn_fraccionamientos", titulo: "↩ Volver", descripcion: "Volver al menú de fraccionamientos", es_accion: false },
  { id: "btn_demoliciones", titulo: "↩ Volver", descripcion: "Volver al menú de demoliciones", es_accion: false }
];

const respuestas = [
  {
    intencion: "menu_permisos_de_construcción",
    respuesta: "🏗️ ¿Qué tipo de permiso deseas consultar?",
    tipo: "lista",
    categoria: "construccion",
    secciones: [
      {
        title: "Opciones disponibles",
        rows: [
          { id: "btn_obras_menores", title: "Obras menores" },
          { id: "btn_fraccionamientos", title: "Fraccionamientos" },
          { id: "btn_demoliciones", title: "Demoliciones" }
        ]
      }
    ]
  },
  {
    intencion: "btn_obras_menores",
    respuesta: "🔧 Los permisos para obras menores aplican para remodelaciones, ampliaciones o mejoras pequeñas.",
    tipo: "botones",
    categoria: "construccion",
    intencion_padre: "menu_permisos_de_construcción",
    botones: ["btn_obras_menores_info", "btn_obras_menores_costos"]
  },
  {
    intencion: "btn_fraccionamientos",
    respuesta: "📐 Para fraccionar un terreno, debés cumplir con requisitos técnicos y legales.",
    tipo: "botones",
    categoria: "construccion",
    intencion_padre: "menu_permisos_de_construcción",
    botones: ["btn_fraccionamientos_info", "btn_fraccionamientos_documentos"]
  },
  {
    intencion: "btn_demoliciones",
    respuesta: "🏚️ La demolición de construcciones debe cumplir con los lineamientos del reglamento municipal.",
    tipo: "botones",
    categoria: "construccion",
    intencion_padre: "menu_permisos_de_construcción",
    botones: ["btn_demoliciones_info", "btn_demoliciones_documentos"]
  },
  {
    intencion: "btn_obras_menores_info",
    respuesta: "📋 *Requisitos para obras menores*\n\n- Formulario de solicitud\n- Planos visados (si aplica)\n- Constancia de uso de suelo\n- Estar al día con tributos municipales",
    tipo: "botones",
    categoria: "construccion",
    intencion_padre: "btn_obras_menores",
    botones: ["btn_obras_menores"]
  },
  {
    intencion: "btn_obras_menores_costos",
    respuesta: "💵 *Costos de permiso de obra menor*\n\nEl monto varía según el tipo y tamaño de la obra. Se calcula como porcentaje del presupuesto estimado de la obra. Consultá en la ventanilla única.",
    tipo: "botones",
    categoria: "construccion",
    intencion_padre: "btn_obras_menores",
    botones: ["btn_obras_menores"]
  },
  {
    intencion: "btn_fraccionamientos_info",
    respuesta: "📏 *Requisitos para fraccionamiento*\n\n- Informe técnico del agrimensor\n- Cumplimiento de normativa ambiental\n- Estudio de factibilidad de servicios públicos\n- Aprobación del departamento de catastro",
    tipo: "botones",
    categoria: "construccion",
    intencion_padre: "btn_fraccionamientos",
    botones: ["btn_fraccionamientos"]
  },
  {
    intencion: "btn_fraccionamientos_documentos",
    respuesta: "📑 *Documentos requeridos*\n\n- Plano catastrado\n- Copia de cédula\n- Certificación literal del terreno\n- Comprobante de pago del trámite",
    tipo: "botones",
    categoria: "construccion",
    intencion_padre: "btn_fraccionamientos",
    botones: ["btn_fraccionamientos"]
  },
  {
    intencion: "btn_demoliciones_info",
    respuesta: "🧱 *Requisitos para demolición*\n\n- Permiso vigente de construcción (si aplica)\n- Carta de autorización del propietario\n- Declaración jurada de demolición\n- Cumplimiento con medidas de seguridad",
    tipo: "botones",
    categoria: "construccion",
    intencion_padre: "btn_demoliciones",
    botones: ["btn_demoliciones"]
  },
  {
    intencion: "btn_demoliciones_documentos",
    respuesta: "📎 *Documentos requeridos para demolición*\n\n- Fotocopia del plano registrado\n- Constancia de uso de suelo\n- Autorización notarial si hay copropietarios\n- Recibo de pago por el trámite",
    tipo: "botones",
    categoria: "construccion",
    intencion_padre: "btn_demoliciones",
    botones: ["btn_demoliciones"]
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    // Insertar botones (solo los que no existen)
    for (const b of botones) {
      await Boton.updateOne({ id: b.id }, b, { upsert: true });
    }

    // Obtener todos los _id
    const botonesDB = await Boton.find({ id: { $in: botones.map(b => b.id) } }).lean();
    const mapa = Object.fromEntries(botonesDB.map(b => [b.id, b._id]));

    // Convertir los strings a ObjectIds usando el mapa
    const respuestasFinal = respuestas.map(r => {
      if (Array.isArray(r.botones)) {
        r.botones = r.botones.map(id => mapa[id]).filter(Boolean);
      }
      return r;
    });

    await Respuesta.insertMany(respuestasFinal);
    console.log("🎯 Respuestas insertadas correctamente");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB");
  }
}

seed();
