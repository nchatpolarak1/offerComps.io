// checks the Authorization header on protected routes

const sessionService = require('../services/sessionService');
const { httpError } = require('./errorHandler');

function readToken(req) {
    const header = req.get('Authorization');
    if (!header) {
        return null;
    }

    const parts = header.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1];
}

async function requireSession(req, res, next) {
    try {
        const token = readToken(req);
        if (token === null) {
            throw httpError(401, 'You must be logged in to do that.');
        }

        const session = await sessionService.get(token);
        if (session === null) {
            throw httpError(401, 'Your session has expired. Please log in again.');
        }

        await sessionService.touch(token);

        req.user = session;
        req.token = token;
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    requireSession: requireSession,
    readToken: readToken
};
