// the express app itself, with no listener, so it can also run as a serverless function

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const config = require('./config/env');
const connections = require('./db/connections');
const routes = require('./routes');
const { notFound, errorHandler, httpError } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

// answers before the connect middleware below, so it still reports when a database is
// down. that is the case it exists for: it names which of the three is broken and why
app.get('/api/health', function (req, res, next) {
    connections.checkAll().then(function (report) {
        const allUp = report.mysql.ok && report.redis.ok && report.mongo.ok;

        let status = 503;
        let label = 'degraded';
        if (allUp) {
            status = 200;
            label = 'ok';
        }

        res.status(status).json({ status: label, databases: report });
    }).catch(next);
});

// a serverless invocation starts with nothing open, so make sure the databases are
// connected before any route runs. locally they are already open and this costs nothing.
// a failure here is the host being unreachable, not a bug, so it keeps its own message
// instead of being flattened into the generic 500 the error handler gives everything else
app.use(function (req, res, next) {
    connections.connectAll().then(function () {
        next();
    }).catch(function (error) {
        next(httpError(503, error.message));
    });
});

app.use('/api', routes);

function registerClient() {
    const distPath = path.join(__dirname, '..', '..', 'client', 'dist');

    if (!fs.existsSync(distPath)) {
        console.log('No client build found at ' + distPath + ', serving the API only.');
        return;
    }

    app.use(express.static(distPath));

    // react router handles the paths, so anything else gets the same page.
    // an /api path that got this far is a real 404 and is left alone
    app.get('*', function (req, res, next) {
        if (req.path.indexOf('/api') === 0) {
            next();
            return;
        }

        res.sendFile(path.join(distPath, 'index.html'));
    });

    console.log('Serving the client build from ' + distPath);
}

registerClient();

app.use(notFound);
app.use(errorHandler);

module.exports = app;
