// app_user queries

const mysqlPool = require('../db/mysqlPool');

async function findByEmail(email) {
    const sql =
        'SELECT user_id, email, password_hash, first_name, last_name, created_at, last_login_at ' +
        'FROM app_user WHERE email = ?';
    const rows = await mysqlPool.query(sql, [email]);

    if (rows.length === 0) {
        return null;
    }
    return rows[0];
}

async function findById(userId) {
    const sql =
        'SELECT user_id, email, first_name, last_name, created_at, last_login_at ' +
        'FROM app_user WHERE user_id = ?';
    const rows = await mysqlPool.query(sql, [userId]);

    if (rows.length === 0) {
        return null;
    }
    return rows[0];
}

// returns the new user id
async function insert(user) {
    const sql =
        'INSERT INTO app_user (email, password_hash, first_name, last_name) ' +
        'VALUES (?, ?, ?, ?)';
    const params = [user.email, user.passwordHash, user.firstName, user.lastName];
    const result = await mysqlPool.query(sql, params);
    return result.insertId;
}

async function updateLastLogin(userId) {
    const sql = 'UPDATE app_user SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = ?';
    await mysqlPool.query(sql, [userId]);
}

module.exports = {
    findByEmail: findByEmail,
    findById: findById,
    insert: insert,
    updateLastLogin: updateLastLogin
};
