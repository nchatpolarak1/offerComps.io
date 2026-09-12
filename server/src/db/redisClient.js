// shared Redis client

const redis = require('redis');
const config = require('../config/env');

const client = redis.createClient({ url: config.redis.url });

let connectPromise = null;

client.on('error', function (error) {
    console.error('Redis error:', error.message);
});

async function openConnection() {
    try {
        await client.connect();
    } catch (error) {
        throw new Error(
            'Could not connect to Redis at ' + config.redis.safeUrl +
            '. Check that the Redis server is running. Original error: ' + error.message
        );
    }
}

// only opens the connection once, however many times it is called
async function connect() {
    if (client.isOpen) {
        return;
    }

    // the socket closed after a successful connect, so try again from scratch
    if (connectPromise !== null && !client.isOpen) {
        connectPromise = null;
    }

    if (connectPromise === null) {
        connectPromise = openConnection();
    }

    try {
        await connectPromise;
    } catch (error) {
        connectPromise = null;
        throw error;
    }
}

async function close() {
    connectPromise = null;
    await client.quit();
}

module.exports = {
    client: client,
    connect: connect,
    close: close
};
