// entry point: connects to the databases, then listens

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const config = require('./config/env');
const mysqlPool = require('./db/mysqlPool');
const redisClient = require('./db/redisClient');
const mongoConnection = require('./db/mongoConnection');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

function registerMiddleware() {
    app.use(cors({ origin: config.clientOrigin }));
    app.use(express.json());
}

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

function registerRoutes() {
    app.use('/api', routes);
    registerClient();
    app.use(notFound);
    app.use(errorHandler);
}

async function connectDatabases() {
    await mysqlPool.connect();
    console.log('Connected to MySQL database "' + config.mysql.database + '"');

    await redisClient.connect();
    console.log('Connected to Redis at ' + config.redis.url);

    await mongoConnection.connect();
    console.log('Connected to MongoDB database "' + config.mongo.database + '"');
}

async function start() {
    try {
        await connectDatabases();
    } catch (error) {
        console.error('Startup failed.');
        console.error(error.message);
        process.exit(1);
    }

    registerMiddleware();
    registerRoutes();

    app.listen(config.port, function () {
        console.log('API server listening on http://localhost:' + config.port);
    });
}

start();
