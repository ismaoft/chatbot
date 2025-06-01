function parseMessage(messageData) {
  if (!messageData) return null;

  if (messageData.interactive?.button_reply) {
    return messageData.interactive.button_reply.id;
  }

  if (messageData.interactive?.list_reply) {
    return messageData.interactive.list_reply.id;
  }

  return messageData.text?.body?.trim().toLowerCase() || null;
}

module.exports = { parseMessage };
