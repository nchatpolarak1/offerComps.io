// shared MySQL pool, all queries parameterized

const mysql = require('mysql2/promise');
const config = require('../config/env');

const pool = mysql.createPool({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

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

// startup check
async function connect() {
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

async function close() {
    await pool.end();
}

module.exports = {
    query: query,
    getConnection: getConnection,
    connect: connect,
    close: close
};
