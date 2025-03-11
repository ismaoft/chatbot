const dialogflow = require('@google-cloud/dialogflow');
const path = require('path');

const sessionClient = new dialogflow.SessionsClient({
    keyFilename: path.join(__dirname, '../dialogflow-key.json')
});

async function detectIntent(queryText, sessionId) {
    const sessionPath = sessionClient.projectAgentSessionPath(process.env.DIALOGFLOW_PROJECT_ID, sessionId);

    const request = {
        session: sessionPath,
        queryInput: {
            text: { text: queryText, languageCode: 'es' },
        },
    };

    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    return {
        response: result.fulfillmentText,
        intent: result.intent ? result.intent.displayName : "Desconocida"
    };
}

module.exports = { detectIntent };
