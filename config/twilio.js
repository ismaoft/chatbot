const twilio = require('twilio');

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const twilioNumber = `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;

module.exports = { twilioClient, twilioNumber };
