// failed login lockout, counted in Redis as loginAttempts:<email>

const redisClient = require('../db/redisClient');
const config = require('../config/env');
const { httpError } = require('./errorHandler');

function keyFor(email) {
    return 'loginAttempts:' + email;
}

// runs before the login handler, blocks once the account already hit the limit
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

    // only set the expiry on the first failure, not every one, so the window
    // starts at attempt one instead of sliding forward each time
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
