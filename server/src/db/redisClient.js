// shared Redis client

const redis = require('redis');
const config = require('../config/env');

// without a strategy the client retries forever, so a bad url hangs startup
// instead of reporting itself. returning an Error stops the retries and lets
// connect() reject with the message below
function build() {
    const fresh = redis.createClient({
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

    fresh.on('error', function (error) {
        console.error('Redis error:', error.message);
    });

    return fresh;
}

// replaced whenever the socket is past saving, so the getter below is what callers
// read rather than holding on to an instance of their own
let client = build();
let connectPromise = null;

// a hosted redis listens for TLS only, and the extra s is easy to miss
function tlsHint() {
    const url = config.redis.url;
    const isLocal = url.indexOf('127.0.0.1') !== -1 || url.indexOf('localhost') !== -1;

    if (url.indexOf('rediss://') !== 0 && !isLocal) {
        return ' A hosted Redis needs TLS, so the url usually has to start with rediss://.';
    }

    return '';
}

// a hosted redis hangs up on an idle connection, and a serverless instance sits idle
// between requests. once the strategy above gives up, node-redis cannot reopen that
// socket, so anything short of a new client leaves the instance permanently broken
async function openConnection() {
    if (client.isOpen) {
        try {
            await client.disconnect();
        } catch (error) {
            // already gone, which is the state we wanted anyway
        }
    }

    client = build();

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

// only opens the connection once, however many times it is called. isReady rather than
// isOpen, because a socket part way through reconnecting is open but cannot take commands
async function connect() {
    if (client.isReady) {
        return;
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

    connectPromise = null;
}

async function close() {
    connectPromise = null;

    if (client.isOpen) {
        await client.quit();
    }
}

module.exports = {
    // a getter, so a caller that took the reference early still reaches the live client
    get client() {
        return client;
    },
    connect: connect,
    close: close
};
