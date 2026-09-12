// shared MySQL pool, all queries parameterized

const mysql = require('mysql2/promise');
const config = require('../config/env');

const pool = mysql.createPool({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    ssl: config.mysql.ssl,
    waitForConnections: true,
    connectionLimit: config.mysql.connectionLimit,
    queueLimit: 0
});

let connectPromise = null;

async function query(sql, params) {
    const result = await pool.query(sql, params);
    const rows = result[0];
    return rows;
}

// for transactions, caller must release it
async function getConnection() {
    const connection = await pool.getConnection();
    return connection;
}

async function openConnection() {
    try {
        const connection = await pool.getConnection();
        connection.release();
    } catch (error) {
        throw new Error(
            'Could not connect to MySQL at ' + config.mysql.host + ':' + config.mysql.port +
            ' as user "' + config.mysql.user + '". Check that the database server is running ' +
            'and that server/.env is correct. Original error: ' + error.message
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

async function close() {
    connectPromise = null;
    await pool.end();
}

module.exports = {
    query: query,
    getConnection: getConnection,
    connect: connect,
    close: close
};
