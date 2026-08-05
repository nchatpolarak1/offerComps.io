// offer queries, joined to company and city so a card can be shown in one trip

const mysqlPool = require('../db/mysqlPool');

// DATE_FORMAT keeps deadline_date a plain YYYY-MM-DD string instead of a Date
const SELECT_COLUMNS =
    'SELECT o.offer_id, o.user_id, o.company_id, o.city_id, ' +
    'co.company_name, ci.city_name, ci.state_code, ' +
    'o.job_title, o.job_level, o.base_salary, o.signing_bonus, o.annual_bonus_pct, ' +
    'o.equity_type, o.equity_total_value, o.equity_vest_years, o.equity_cliff_months, ' +
    'o.expected_hours_week, o.work_arrangement, o.offer_status, ' +
    'DATE_FORMAT(o.deadline_date, \'%Y-%m-%d\') AS deadline_date ' +
    'FROM offer o ' +
    'JOIN company co ON co.company_id = o.company_id ' +
    'JOIN city ci ON ci.city_id = o.city_id ';

async function findByUser(userId) {
    const sql = SELECT_COLUMNS + 'WHERE o.user_id = ? ORDER BY o.created_at DESC';
    const rows = await mysqlPool.query(sql, [userId]);
    return rows;
}

async function findById(offerId) {
    const sql = SELECT_COLUMNS + 'WHERE o.offer_id = ?';
    const rows = await mysqlPool.query(sql, [offerId]);

    if (rows.length === 0) {
        return null;
    }
    return rows[0];
}

// returns the new offer id
async function insert(offer) {
    const sql =
        'INSERT INTO offer (user_id, company_id, city_id, job_title, job_level, ' +
        'base_salary, signing_bonus, annual_bonus_pct, equity_type, equity_total_value, ' +
        'equity_vest_years, equity_cliff_months, expected_hours_week, work_arrangement, ' +
        'offer_status, deadline_date) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const params = [
        offer.userId,
        offer.companyId,
        offer.cityId,
        offer.jobTitle,
        offer.jobLevel,
        offer.baseSalary,
        offer.signingBonus,
        offer.annualBonusPct,
        offer.equityType,
        offer.equityTotalValue,
        offer.equityVestYears,
        offer.equityCliffMonths,
        offer.expectedHoursWeek,
        offer.workArrangement,
        offer.offerStatus,
        offer.deadlineDate
    ];
    const result = await mysqlPool.query(sql, params);
    return result.insertId;
}

async function remove(offerId) {
    const sql = 'DELETE FROM offer WHERE offer_id = ?';
    await mysqlPool.query(sql, [offerId]);
}

module.exports = {
    findByUser: findByUser,
    findById: findById,
    insert: insert,
    remove: remove
};
