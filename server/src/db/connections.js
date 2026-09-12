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

async function closeAll() {
    announced = false;
    await mysqlPool.close();
    await redisClient.close();
    await mongoConnection.close();
}

module.exports = {
    connectAll: connectAll,
    closeAll: closeAll
};
