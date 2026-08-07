// tax brackets, cached in Redis as taxBrackets:<jurisdiction>:<year> JSON strings

const mysqlPool = require('../db/mysqlPool');
const redisClient = require('../db/redisClient');

const CACHE_TTL_SECONDS = 86400;

function keyFor(jurisdictionCode, taxYear) {
    return 'taxBrackets:' + jurisdictionCode + ':' + taxYear;
}

// mysql2 hands DECIMAL columns back as strings
function toBracket(row) {
    return {
        lower: Number(row.lower_bound),
        upper: row.upper_bound === null ? null : Number(row.upper_bound),
        rate: Number(row.rate)
    };
}

async function readCache(jurisdictionCode, taxYear) {
    const text = await redisClient.client.get(keyFor(jurisdictionCode, taxYear));

    if (text === null) {
        return null;
    }
    return JSON.parse(text);
}

async function writeCache(jurisdictionCode, taxYear, brackets) {
    const key = keyFor(jurisdictionCode, taxYear);
    await redisClient.client.set(key, JSON.stringify(brackets), { EX: CACHE_TTL_SECONDS });
}

// brackets change once a year, so the cache is filled on the first miss. states
// with no rows (Texas, Washington) cache an empty list instead of asking again.
async function findByJurisdiction(jurisdictionCode, taxYear) {
    const cached = await readCache(jurisdictionCode, taxYear);
    if (cached !== null) {
        return cached;
    }

    const sql =
        'SELECT lower_bound, upper_bound, rate FROM tax_bracket ' +
        'WHERE jurisdiction_code = ? AND tax_year = ? ORDER BY lower_bound';
    const rows = await mysqlPool.query(sql, [jurisdictionCode, taxYear]);
    const brackets = [];

    for (let i = 0; i < rows.length; i++) {
        brackets.push(toBracket(rows[i]));
    }

    await writeCache(jurisdictionCode, taxYear, brackets);
    return brackets;
}

module.exports = {
    findByJurisdiction: findByJurisdiction
};
