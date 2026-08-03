// Failed login lockout, counted in Redis as loginAttempts:<email>.
// EXPIRE is set only on the first failure, so the 15 minute window starts
// at attempt one rather than sliding forward with each new failure.

const redisClient = require('../db/redisClient');
const config = require('../config/env');
const { httpError } = require('./errorHandler');

function keyFor(email) {
    return 'loginAttempts:' + email;
}

// Runs before the login handler and blocks the attempt once the account
// has already hit the limit.
async function checkLoginAttempts(req, res, next) {
    try {
        const email = req.body.email;
        if (!email) {
            next();
            return;
        }

        const value = await redisClient.client.get(keyFor(email));
        let attempts = 0;
        if (value !== null) {
            attempts = Number(value);
        }

        if (attempts >= config.loginAttemptLimit) {
            throw httpError(429, 'Too many failed login attempts. Please try again later.');
        }

        next();
    } catch (error) {
        next(error);
    }
}

async function recordFailure(email) {
    const key = keyFor(email);
    const attempts = await redisClient.client.incr(key);

    if (attempts === 1) {
        await redisClient.client.expire(key, config.loginAttemptWindowSeconds);
    }
}

async function clearFailures(email) {
    await redisClient.client.del(keyFor(email));
}

module.exports = {
    checkLoginAttempts: checkLoginAttempts,
    recordFailure: recordFailure,
    clearFailures: clearFailures
};
