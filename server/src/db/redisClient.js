// shared Redis client

const redis = require('redis');
const config = require('../config/env');

const client = redis.createClient({ url: config.redis.url });

client.on('error', function (error) {
    console.error('Redis error:', error.message);
});

async function connect() {
    try {
        await client.connect();
    } catch (error) {
        throw new Error(
            'Could not connect to Redis at ' + config.redis.url +
            '. Check that the Redis server is running. Original error: ' + error.message
        );
    }
}

async function close() {
    await client.quit();
}

module.exports = {
    client: client,
    connect: connect,
    close: close
};
