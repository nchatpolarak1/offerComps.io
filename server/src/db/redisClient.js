// shared Redis client

const redis = require('redis');
const config = require('../config/env');

// without a strategy the client retries forever, so a bad url hangs startup
// instead of reporting itself. returning an Error stops the retries and lets
// connect() reject with the message below
const client = redis.createClient({
    url: config.redis.url,
    socket: {
        reconnectStrategy: function (retries) {
            if (retries >= 3) {
                return new Error('Gave up connecting to Redis after ' + retries + ' attempts.');
            }
            return Math.min(retries * 200, 1000);
        }
    }
});

// a hosted redis listens for TLS only, and the extra s is easy to miss
function tlsHint() {
    const url = config.redis.url;
    const isLocal = url.indexOf('127.0.0.1') !== -1 || url.indexOf('localhost') !== -1;

    if (url.indexOf('rediss://') !== 0 && !isLocal) {
        return ' A hosted Redis needs TLS, so the url usually has to start with rediss://.';
    }

    return '';
}

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
            '. Check that the Redis server is running.' + tlsHint() +
            ' Original error: ' + error.message
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
