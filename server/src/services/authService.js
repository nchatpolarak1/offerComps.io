// registration, login and logout

const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const sessionService = require('./sessionService');
const { httpError } = require('../middleware/errorHandler');

const SALT_ROUNDS = 10;

async function hashPassword(password) {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
}

async function verifyPassword(password, hash) {
    const matches = await bcrypt.compare(password, hash);
    return matches;
}

// user fields the API is allowed to return
function toPublicUser(row) {
    return {
        userId: row.user_id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name
    };
}

async function register(details) {
    const existing = await userRepository.findByEmail(details.email);
    if (existing !== null) {
        throw httpError(409, 'An account with that email already exists.');
    }

    const passwordHash = await hashPassword(details.password);
    const userId = await userRepository.insert({
        email: details.email,
        passwordHash: passwordHash,
        firstName: details.firstName,
        lastName: details.lastName
    });

    const created = await userRepository.findById(userId);
    const token = await sessionService.create(created);

    return { user: toPublicUser(created), token: token };
}

async function login(email, password) {
    const row = await userRepository.findByEmail(email);

    // same message either way, so accounts are not revealed
    if (row === null) {
        throw httpError(401, 'Email or password is incorrect.');
    }

    const passwordMatches = await verifyPassword(password, row.password_hash);
    if (!passwordMatches) {
        throw httpError(401, 'Email or password is incorrect.');
    }

    await userRepository.updateLastLogin(row.user_id);
    const token = await sessionService.create(row);

    return { user: toPublicUser(row), token: token };
}

async function logout(token) {
    await sessionService.destroy(token);
}

module.exports = {
    register: register,
    login: login,
    logout: logout,
    toPublicUser: toPublicUser
};
