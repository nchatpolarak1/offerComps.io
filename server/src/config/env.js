// settings from server/.env

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// tax year of the brackets in db/mysql/seed.sql
const TAX_YEAR = 2025;

// session idle timeout, in seconds
const SESSION_TTL_SECONDS = 1800;

// failed login lockout
const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_ATTEMPT_WINDOW_SECONDS = 900;

// a hosted database needs TLS and its certificate, a local one needs neither.
// the certificate comes from a file when developing and from the variable itself
// on a host like vercel, where there is nowhere to put the file
let mysqlSsl;
if (process.env.MYSQL_CA_CERT) {
    mysqlSsl = { ca: process.env.MYSQL_CA_CERT };
} else if (process.env.MYSQL_CA_CERT_PATH) {
    mysqlSsl = { ca: fs.readFileSync(process.env.MYSQL_CA_CERT_PATH, 'utf8') };
}

// a hosted url carries the password in it, so hide that before it reaches a log
function hidePassword(rawUrl) {
    try {
        const parsed = new URL(rawUrl);
        if (parsed.password) {
            parsed.password = '***';
        }
        return parsed.toString();
    } catch (error) {
        return 'the configured url';
    }
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
        url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
        safeUrl: hidePassword(process.env.REDIS_URL || 'redis://127.0.0.1:6379')
    },

    mongo: {
        url: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017',
        safeUrl: hidePassword(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017'),
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
            'Missing required settings: ' + missing.join(', ') +
            '. Set them in server/.env when running locally, or as environment ' +
            'variables on the host when deployed.'
        );
    }
}

checkRequiredSettings();

module.exports = config;
