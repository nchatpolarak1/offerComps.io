// shared MongoDB connection, holds offer_perks

const { MongoClient } = require('mongodb');
const config = require('../config/env');

const client = new MongoClient(config.mongo.url);
let database = null;
let connectPromise = null;

async function openConnection() {
    try {
        await client.connect();
        database = client.db(config.mongo.database);
        await database.command({ ping: 1 });
    } catch (error) {
        throw new Error(
            'Could not connect to MongoDB at ' + config.mongo.safeUrl +
            '. Check that mongod is running. Original error: ' + error.message
        );
    }
}

// only opens the connection once, however many times it is called
async function connect() {
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
    connectPromise = null;
    database = null;
    await client.close();
}

module.exports = {
    connect: connect,
    db: db,
    collection: collection,
    close: close
};
