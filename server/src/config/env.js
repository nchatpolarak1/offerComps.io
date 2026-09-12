// settings from server/.env

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// tax year of the brackets in db/mysql/seed.sql
const TAX_YEAR = 2025;

// session idle timeout, in seconds
const SESSION_TTL_SECONDS = 1800;

// failed login lockout
const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_ATTEMPT_WINDOW_SECONDS = 900;

// a hosted database needs TLS and its certificate, a local one needs neither
let mysqlSsl;
if (process.env.MYSQL_CA_CERT) {
    mysqlSsl = { ca: process.env.MYSQL_CA_CERT };
}

const config = {
    port: Number(process.env.PORT) || 3000,
    clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

    mysql: {
        host: process.env.MYSQL_HOST || '127.0.0.1',
        port: Number(process.env.MYSQL_PORT) || 3306,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        ssl: mysqlSsl,
        connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT) || 10
    },

    redis: {
        url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
    },

    mongo: {
        url: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017',
        database: process.env.MONGO_DATABASE || 'job_offers'
    },

    taxYear: TAX_YEAR,
    sessionTtlSeconds: SESSION_TTL_SECONDS,
    loginAttemptLimit: LOGIN_ATTEMPT_LIMIT,
    loginAttemptWindowSeconds: LOGIN_ATTEMPT_WINDOW_SECONDS
};

function checkRequiredSettings() {
    const missing = [];

    if (!config.mysql.user) {
        missing.push('MYSQL_USER');
    }
    if (!config.mysql.password) {
        missing.push('MYSQL_PASSWORD');
    }
    if (!config.mysql.database) {
        missing.push('MYSQL_DATABASE');
    }

    if (missing.length > 0) {
        throw new Error(
            'Missing required settings in server/.env: ' + missing.join(', ') +
            '. Copy server/.env.example to server/.env and fill it in.'
        );
    }
}

checkRequiredSettings();

module.exports = config;
