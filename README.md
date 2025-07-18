# 🤖 Chatbot Municipalidad de San Pablo

Este proyecto es un **chatbot inteligente** que funciona a través de **WhatsApp Cloud API**, conectado con **MongoDB** y **Dialogflow**, diseñado para brindar respuestas automáticas y asistencia a ciudadanos sobre servicios municipales.

---

## 📌 Funcionalidades principales

- Responde preguntas frecuentes de forma automática.
- Guarda preguntas sin respuesta para futura edición.
- Integra **Dialogflow** para interpretación de intenciones y NLP.
- Utiliza MongoDB para almacenar usuarios, mensajes e intenciones.
- Registro de actividad por cada mensaje enviado y recibido.
- Arquitectura modular organizada con controladores, servicios y utilidades.

---

## 🔧 Instalación

### 1️⃣ Clona el repositorio

```bash
git clone https://github.com/ismaoft/chatbot.git
cd chatbot
```

### 2️⃣ Instala dependencias

```bash
npm install
```

### 3️⃣ Configura el archivo `.env`

Crea un archivo `.env` en la raíz del proyecto y coloca tus credenciales:

```env
WHATSAPP_CLOUD_TOKEN=EAAJH7...gZDZD
WHATSAPP_PHONE_ID=1234567890
WHATSAPP_VERIFY_TOKEN=mi-verificacion
MONGODB_URI=mongodb+srv://usuario:clave@cluster0.mongodb.net/chatbot
DIALOGFLOW_PROJECT_ID=chatbot-municipalidad-38271
```

### 4️⃣ Inicia el servidor

```bash
node index.js
```

---

## 🗂️ Estructura del proyecto

```
├── controllers/
│   └── whatsappController.js
├── services/
│   ├── respuestaService.js
│   ├── messageService.js
│   ├── userService.js
│   └── preguntaNoRespondidaService.js
├── models/
│   ├── Usuario.js
│   ├── Mensaje.js
│   └── Respuesta.js
├── utils/
│   ├── sendMessage.js
│   ├── messages.js
│   └── errorHandler.js
├── config/
│   └── dialogflow.js
├── .env
├── index.js
└── README.md
```

---

## 🧪 Pruebas

- Usá [Postman](https://www.postman.com/) o WhatsApp directamente para enviar mensajes al bot.
- Verificá los registros en consola y en la base de datos MongoDB Atlas.

---

## 🧠 Tecnologías utilizadas

- **Node.js**
- **Express**
- **MongoDB + Mongoose**
- **Dialogflow**
- **WhatsApp Cloud API**
- **Axios**

---

## ✍️ Autor

Desarrollado por **Ismael Salazar Blanco**  
Estudiante de Ingeniería en Sistemas, UNA Costa Rica.  

📧 Contacto: ismaoft@gmail.com  
🐙 GitHub: [@ismaoft](https://github.com/ismaoft)

---

## 📜 Licencia

Este proyecto es de uso académico y de libre adaptación con fines educativos.