// company queries

const mysqlPool = require('../db/mysqlPool');

function toCompany(row) {
    return {
        companyId: row.company_id,
        companyName: row.company_name,
        industry: row.industry,
        websiteUrl: row.website_url,
        hqCityId: row.hq_city_id
    };
}

async function findById(companyId) {
    const sql =
        'SELECT company_id, company_name, industry, website_url, hq_city_id ' +
        'FROM company WHERE company_id = ?';
    const rows = await mysqlPool.query(sql, [companyId]);

    if (rows.length === 0) {
        return null;
    }
    return toCompany(rows[0]);
}

async function findByName(companyName) {
    const sql =
        'SELECT company_id, company_name, industry, website_url, hq_city_id ' +
        'FROM company WHERE company_name = ?';
    const rows = await mysqlPool.query(sql, [companyName]);

    if (rows.length === 0) {
        return null;
    }
    return toCompany(rows[0]);
}

// two offers at the same employer share one company row
async function findOrCreate(companyName) {
    const existing = await findByName(companyName);
    if (existing !== null) {
        return existing;
    }

    const sql = 'INSERT INTO company (company_name) VALUES (?)';
    const result = await mysqlPool.query(sql, [companyName]);

    return {
        companyId: result.insertId,
        companyName: companyName,
        industry: null,
        websiteUrl: null,
        hqCityId: null
    };
}

module.exports = {
    findById: findById,
    findByName: findByName,
    findOrCreate: findOrCreate
};
