// login sessions, stored in Redis as session:<token> hashes

const crypto = require('crypto');
const redisClient = require('../db/redisClient');
const config = require('../config/env');

function keyFor(token) {
    return 'session:' + token;
}

async function create(user) {
    const token = crypto.randomBytes(32).toString('hex');
    const key = keyFor(token);

    await redisClient.client.hSet(key, {
        Uid: String(user.user_id),
        email: user.email,
        firstName: user.first_name
    });
    await redisClient.client.expire(key, config.sessionTtlSeconds);

    return token;
}

// null when the session has expired
async function get(token) {
    if (!token) {
        return null;
    }

    const data = await redisClient.client.hGetAll(keyFor(token));
    if (!data || Object.keys(data).length === 0) {
        return null;
    }

    return {
        userId: Number(data.Uid),
        email: data.email,
        firstName: data.firstName
    };
}

// resets the idle timeout
async function touch(token) {
    await redisClient.client.expire(keyFor(token), config.sessionTtlSeconds);
}

async function destroy(token) {
    await redisClient.client.del(keyFor(token));
}

module.exports = {
    create: create,
    get: get,
    touch: touch,
    destroy: destroy
};
