// city lookups, cached in Redis as city:<cityId> hashes

const mysqlPool = require('../db/mysqlPool');
const redisClient = require('../db/redisClient');

const CACHE_TTL_SECONDS = 86400;

function keyFor(cityId) {
    return 'city:' + cityId;
}

function toCity(row) {
    return {
        cityId: row.city_id,
        cityName: row.city_name,
        stateCode: row.state_code,
        colIndex: Number(row.col_index),
        meanCommuteMinutes: Number(row.mean_commute_minutes),
        medianRent1br: row.median_rent_1br === null ? null : Number(row.median_rent_1br)
    };
}

// the fixed list the add-offer dropdown shows
async function all() {
    const sql =
        'SELECT c.city_id, c.city_name, c.state_code, c.col_index, ' +
        'c.mean_commute_minutes, c.median_rent_1br ' +
        'FROM city c JOIN state s ON s.state_code = c.state_code ' +
        'ORDER BY c.city_name';
    const rows = await mysqlPool.query(sql, []);
    const cities = [];

    for (let i = 0; i < rows.length; i++) {
        cities.push(toCity(rows[i]));
    }
    return cities;
}

async function readCache(cityId) {
    const data = await redisClient.client.hGetAll(keyFor(cityId));

    if (!data || Object.keys(data).length === 0) {
        return null;
    }

    let rent = null;
    if (data.medianRent1br !== undefined && data.medianRent1br !== '') {
        rent = Number(data.medianRent1br);
    }

    return {
        cityId: Number(cityId),
        cityName: data.cityName,
        stateCode: data.stateCode,
        colIndex: Number(data.colIndex),
        meanCommuteMinutes: Number(data.meanCommuteMinutes),
        medianRent1br: rent
    };
}

async function writeCache(city) {
    const key = keyFor(city.cityId);
    let rent = '';

    if (city.medianRent1br !== null) {
        rent = String(city.medianRent1br);
    }

    await redisClient.client.hSet(key, {
        cityName: city.cityName,
        stateCode: city.stateCode,
        colIndex: String(city.colIndex),
        meanCommuteMinutes: String(city.meanCommuteMinutes),
        medianRent1br: rent
    });
    await redisClient.client.expire(key, CACHE_TTL_SECONDS);
}

// cities barely ever change, so the cache is filled on the first miss
async function findById(cityId) {
    const cached = await readCache(cityId);
    if (cached !== null) {
        return cached;
    }

    const sql =
        'SELECT city_id, city_name, state_code, col_index, ' +
        'mean_commute_minutes, median_rent_1br ' +
        'FROM city WHERE city_id = ?';
    const rows = await mysqlPool.query(sql, [cityId]);

    if (rows.length === 0) {
        return null;
    }

    const city = toCity(rows[0]);
    await writeCache(city);
    return city;
}

module.exports = {
    all: all,
    findById: findById
};
