// saved comparisons and the offers picked into each one

const mysqlPool = require('../db/mysqlPool');

const SELECT_COLUMNS =
    'SELECT comparison_id, user_id, comparison_name, ' +
    'w_pay, w_commute, w_hours, w_flexibility, created_at ' +
    'FROM comparison ';

async function findByUser(userId) {
    const sql = SELECT_COLUMNS + 'WHERE user_id = ? ORDER BY created_at DESC';
    const rows = await mysqlPool.query(sql, [userId]);
    return rows;
}

async function findById(comparisonId) {
    const sql = SELECT_COLUMNS + 'WHERE comparison_id = ?';
    const rows = await mysqlPool.query(sql, [comparisonId]);

    if (rows.length === 0) {
        return null;
    }
    return rows[0];
}

// returns the new comparison id
async function insert(comparison) {
    const sql =
        'INSERT INTO comparison (user_id, comparison_name, ' +
        'w_pay, w_commute, w_hours, w_flexibility) VALUES (?, ?, ?, ?, ?, ?)';
    const params = [
        comparison.userId,
        comparison.comparisonName,
        comparison.wPay,
        comparison.wCommute,
        comparison.wHours,
        comparison.wFlexibility
    ];
    const result = await mysqlPool.query(sql, params);
    return result.insertId;
}

async function update(comparison) {
    const sql =
        'UPDATE comparison SET comparison_name = ?, w_pay = ?, w_commute = ?, ' +
        'w_hours = ?, w_flexibility = ? WHERE comparison_id = ?';
    const params = [
        comparison.comparisonName,
        comparison.wPay,
        comparison.wCommute,
        comparison.wHours,
        comparison.wFlexibility,
        comparison.comparisonId
    ];
    await mysqlPool.query(sql, params);
}

// comparison_offer rows go with it, the foreign key cascades
async function remove(comparisonId) {
    const sql = 'DELETE FROM comparison WHERE comparison_id = ?';
    await mysqlPool.query(sql, [comparisonId]);
}

async function findOfferIds(comparisonId) {
    const sql =
        'SELECT offer_id FROM comparison_offer ' +
        'WHERE comparison_id = ? ORDER BY display_order';
    const rows = await mysqlPool.query(sql, [comparisonId]);
    const offerIds = [];

    for (let i = 0; i < rows.length; i++) {
        offerIds.push(rows[i].offer_id);
    }
    return offerIds;
}

// the whole picked list is replaced at once, so it runs in a transaction and a
// failure part way through cannot leave a comparison holding half its offers
async function setOffers(comparisonId, offerIds) {
    const connection = await mysqlPool.getConnection();

    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM comparison_offer WHERE comparison_id = ?', [
            comparisonId
        ]);

        for (let i = 0; i < offerIds.length; i++) {
            await connection.query(
                'INSERT INTO comparison_offer (comparison_id, offer_id, display_order) ' +
                    'VALUES (?, ?, ?)',
                [comparisonId, offerIds[i], i + 1]
            );
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    findByUser: findByUser,
    findById: findById,
    insert: insert,
    update: update,
    remove: remove,
    findOfferIds: findOfferIds,
    setOffers: setOffers
};
