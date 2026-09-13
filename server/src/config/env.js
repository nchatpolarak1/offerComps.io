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
    // resolved against the server directory rather than the working directory, so
    // the path still finds the file when the process is started from the repo root
    const certPath = path.resolve(__dirname, '..', '..', process.env.MYSQL_CA_CERT_PATH);
    mysqlSsl = { ca: fs.readFileSync(certPath, 'utf8') };
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

// vercel only injects VERCEL and VERCEL_ENV when the project is set to expose its
// system variables, so neither is dependable on its own. the lambda runtime underneath
// always sets AWS_LAMBDA_FUNCTION_NAME, whatever that setting says
function isHostedRuntime() {
    return Boolean(
        process.env.VERCEL ||
        process.env.VERCEL_ENV ||
        process.env.AWS_LAMBDA_FUNCTION_NAME ||
        process.env.NODE_ENV === 'production'
    );
}

// one long running server shares a single pool, but a host runs many instances that
// each hold their own, and a free tier database allows only a couple of dozen
// connections across all of them. so a host gets a much smaller pool by default
const DEFAULT_POOL_SIZE = 10;
const HOSTED_POOL_SIZE = 2;

function defaultConnectionLimit() {
    if (isHostedRuntime()) {
        return HOSTED_POOL_SIZE;
    }
    return DEFAULT_POOL_SIZE;
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
        connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT) || defaultConnectionLimit()
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

    // the redis and mongo defaults point at 127.0.0.1, which is never right on a
    // deployed host, so ask for them there instead of quietly trying localhost
    if (isHostedRuntime()) {
        if (!process.env.REDIS_URL) {
            missing.push('REDIS_URL');
        }
        if (!process.env.MONGO_URL) {
            missing.push('MONGO_URL');
        }
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
