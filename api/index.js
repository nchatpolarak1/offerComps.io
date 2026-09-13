// vercel serves this file as the /api function. the express app is the handler.
// loading it can throw before express exists, usually because a setting is
// missing, so catch that and answer with json instead of an unexplained 500
let app = null;
let loadError = null;

try {
    app = require('../server/src/app');
} catch (error) {
    loadError = error;
    console.error('The API failed to start:', error);
}

module.exports = function (request, response) {
    if (loadError !== null) {
        response.statusCode = 500;
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ error: 'The API could not start. ' + loadError.message }));
        return;
    }

    app(request, response);
};
