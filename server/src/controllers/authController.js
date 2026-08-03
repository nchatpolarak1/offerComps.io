// request handlers for /api/auth

const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');
const rateLimitMiddleware = require('../middleware/rateLimitMiddleware');
const { httpError } = require('../middleware/errorHandler');

const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 50;
const MAX_EMAIL_LENGTH = 255;

function isValidEmail(email) {
    // one @ with a dot in the domain
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

function cleanText(value) {
    if (typeof value !== 'string') {
        return '';
    }
    return value.trim();
}

function validateRegistration(body) {
    const email = cleanText(body.email).toLowerCase();
    const firstName = cleanText(body.firstName);
    const lastName = cleanText(body.lastName);
    const password = body.password;
    const errors = [];

    if (email === '') {
        errors.push('Email is required.');
    } else if (!isValidEmail(email)) {
        errors.push('Please enter a valid email address.');
    } else if (email.length > MAX_EMAIL_LENGTH) {
        errors.push('Email is too long.');
    }

    if (firstName === '') {
        errors.push('First name is required.');
    } else if (firstName.length > MAX_NAME_LENGTH) {
        errors.push('First name is too long.');
    }

    if (lastName === '') {
        errors.push('Last name is required.');
    } else if (lastName.length > MAX_NAME_LENGTH) {
        errors.push('Last name is too long.');
    }

    if (typeof password !== 'string' || password === '') {
        errors.push('Password is required.');
    } else if (password.length < MIN_PASSWORD_LENGTH) {
        errors.push('Password must be at least ' + MIN_PASSWORD_LENGTH + ' characters.');
    }

    return {
        errors: errors,
        values: {
            email: email,
            firstName: firstName,
            lastName: lastName,
            password: password
        }
    };
}

async function register(req, res, next) {
    try {
        const checked = validateRegistration(req.body);
        if (checked.errors.length > 0) {
            throw httpError(400, checked.errors[0]);
        }

        const result = await authService.register(checked.values);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

async function login(req, res, next) {
    try {
        const email = cleanText(req.body.email).toLowerCase();
        const password = req.body.password;

        if (email === '' || typeof password !== 'string' || password === '') {
            throw httpError(400, 'Email and password are both required.');
        }

        let result = null;
        try {
            result = await authService.login(email, password);
        } catch (error) {
            // only bad credentials count toward the lockout
            if (error.status === 401) {
                await rateLimitMiddleware.recordFailure(email);
            }
            throw error;
        }

        await rateLimitMiddleware.clearFailures(email);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

async function logout(req, res, next) {
    try {
        await authService.logout(req.token);
        res.json({ message: 'Logged out.' });
    } catch (error) {
        next(error);
    }
}

// restores login state after a page refresh
async function me(req, res, next) {
    try {
        const row = await userRepository.findById(req.user.userId);
        if (row === null) {
            throw httpError(404, 'User not found.');
        }
        res.json({ user: authService.toPublicUser(row) });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    register: register,
    login: login,
    logout: logout,
    me: me
};
