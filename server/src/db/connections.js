// opens the three database connections together

const config = require('../config/env');
const mysqlPool = require('./mysqlPool');
const redisClient = require('./redisClient');
const mongoConnection = require('./mongoConnection');

let announced = false;

async function connectAll() {
    await mysqlPool.connect();
    await redisClient.connect();
    await mongoConnection.connect();

    if (!announced) {
        console.log('Connected to MySQL database "' + config.mysql.database + '"');
        console.log('Connected to Redis at ' + config.redis.safeUrl);
        console.log('Connected to MongoDB database "' + config.mongo.database + '"');
        announced = true;
    }
}

// opens the three the same way, but reports each one separately instead of stopping
// at the first failure, so a health check can say which database is the broken one
async function checkAll() {
    const names = ['mysql', 'redis', 'mongo'];
    const results = await Promise.allSettled([
        mysqlPool.connect(),
        redisClient.connect(),
        mongoConnection.connect()
    ]);

    const report = {};
    let i = 0;
    while (i < names.length) {
        if (results[i].status === 'fulfilled') {
            report[names[i]] = { ok: true };
        } else {
            report[names[i]] = { ok: false, error: results[i].reason.message };
        }
        i = i + 1;
    }

    return report;
}

async function closeAll() {
    announced = false;
    await mysqlPool.close();
    await redisClient.close();
    await mongoConnection.close();
}

module.exports = {
    connectAll: connectAll,
    checkAll: checkAll,
    closeAll: closeAll
};
