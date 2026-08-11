// single error handler for the whole api, keeps stack traces off the response

function notFound(req, res) {
    res.status(404).json({ error: 'Not found' });
}

function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        next(error);
        return;
    }

    let status = 500;
    if (error.status) {
        status = error.status;
    }

    let message = error.message;
    if (status === 500) {
        console.error('Unexpected server error:', error);
        message = 'Something went wrong on the server.';
    }

    res.status(status).json({ error: message });
}

// throws an error that carries an http status code
function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

module.exports = {
    notFound: notFound,
    errorHandler: errorHandler,
    httpError: httpError
};
