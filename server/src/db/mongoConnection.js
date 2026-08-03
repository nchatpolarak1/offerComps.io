// shared MongoDB connection, holds offer_perks and offer_files

const { MongoClient } = require('mongodb');
const config = require('../config/env');

const client = new MongoClient(config.mongo.url);
let database = null;

async function connect() {
    try {
        await client.connect();
        database = client.db(config.mongo.database);
        await database.command({ ping: 1 });
    } catch (error) {
        throw new Error(
            'Could not connect to MongoDB at ' + config.mongo.url +
            '. Check that mongod is running. Original error: ' + error.message
        );
    }
}

function db() {
    if (database === null) {
        throw new Error('MongoDB is not connected yet. Call connect() first.');
    }
    return database;
}

function collection(name) {
    return db().collection(name);
}

async function close() {
    await client.close();
}

module.exports = {
    connect: connect,
    db: db,
    collection: collection,
    close: close
};
