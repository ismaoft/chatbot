module.exports = function handleError(error, context = "Error desconocido") {
    console.error(`❌ ${context}:`, error.response?.data || error.message);
};