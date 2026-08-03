// entry point: connects to the databases, then listens

const express = require('express');
const cors = require('cors');

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

function registerRoutes() {
    app.use('/api', routes);
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
