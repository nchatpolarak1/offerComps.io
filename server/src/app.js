// the express app itself, with no listener, so it can also run as a serverless function

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const config = require('./config/env');
const connections = require('./db/connections');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

// a serverless invocation starts with nothing open, so make sure the databases are
// connected before any route runs. locally they are already open and this costs nothing
app.use(function (req, res, next) {
    connections.connectAll().then(function () {
        next();
    }).catch(next);
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
