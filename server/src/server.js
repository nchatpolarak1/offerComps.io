// entry point: connects to the databases, then listens

const config = require('./config/env');
const connections = require('./db/connections');
const app = require('./app');

async function start() {
    try {
        await connections.connectAll();
    } catch (error) {
        console.error('Startup failed.');
        console.error(error.message);
        process.exit(1);
    }

    app.listen(config.port, function () {
        console.log('API server listening on http://localhost:' + config.port);
    });
}

start();
