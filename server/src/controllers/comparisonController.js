// request handlers for /api/comparisons

const comparisonService = require('../services/comparisonService');
const { httpError } = require('../middleware/errorHandler');

const MAX_NAME_LENGTH = 100;
const MIN_OFFERS = 2;
const MAX_OFFERS = 6;

const WEIGHT_NAMES = ['pay', 'commute', 'hours', 'flexibility'];
const DEFAULT_WEIGHTS = { pay: 0.55, commute: 0.15, hours: 0.2, flexibility: 0.1 };

function cleanText(value) {
    if (typeof value !== 'string') {
        return '';
    }
    return value.trim();
}

function isFilledIn(value) {
    return value !== undefined && value !== null && value !== '';
}

// the weights are DECIMAL(3,2), and 0.55 + 0.15 + 0.2 + 0.1 is not exactly 1 in
// floating point, so they are rounded to cents before being added up
function roundToCents(value) {
    return Math.round(value * 100) / 100;
}

function validateWeights(rawWeights, errors) {
    if (rawWeights === undefined || rawWeights === null) {
        return Object.assign({}, DEFAULT_WEIGHTS);
    }

    if (typeof rawWeights !== 'object') {
        errors.push('Weights must be given as four numbers.');
        return Object.assign({}, DEFAULT_WEIGHTS);
    }

    const weights = {};
    let cents = 0;

    for (let i = 0; i < WEIGHT_NAMES.length; i++) {
        const name = WEIGHT_NAMES[i];
        const value = Number(rawWeights[name]);

        if (!isFilledIn(rawWeights[name]) || isNaN(value)) {
            errors.push('A weight is needed for ' + name + '.');
            return Object.assign({}, DEFAULT_WEIGHTS);
        }
        if (value < 0 || value > 1) {
            errors.push('The ' + name + ' weight must be between 0 and 1.');
            return Object.assign({}, DEFAULT_WEIGHTS);
        }

        weights[name] = roundToCents(value);
        cents = cents + Math.round(weights[name] * 100);
    }

    if (cents !== 100) {
        errors.push('The four weights must add up to 1.00.');
    }

    return weights;
}

function validateOfferIds(rawOfferIds, errors) {
    if (!Array.isArray(rawOfferIds)) {
        errors.push('Please choose the offers to compare.');
        return [];
    }
    if (rawOfferIds.length < MIN_OFFERS) {
        errors.push('Choose at least ' + MIN_OFFERS + ' offers to compare.');
        return [];
    }
    if (rawOfferIds.length > MAX_OFFERS) {
        errors.push('A comparison can hold at most ' + MAX_OFFERS + ' offers.');
        return [];
    }

    const offerIds = [];

    for (let i = 0; i < rawOfferIds.length; i++) {
        const offerId = Number(rawOfferIds[i]);

        if (!isFilledIn(rawOfferIds[i]) || isNaN(offerId)) {
            errors.push('One of the chosen offers was not valid.');
            return [];
        }
        if (offerIds.indexOf(offerId) !== -1) {
            errors.push('The same offer cannot be picked twice.');
            return [];
        }
        offerIds.push(offerId);
    }

    return offerIds;
}

function validateComparison(body) {
    const errors = [];
    const comparisonName = cleanText(body.comparisonName);

    if (comparisonName === '') {
        errors.push('Please name this comparison.');
    } else if (comparisonName.length > MAX_NAME_LENGTH) {
        errors.push('The comparison name is too long.');
    }

    const weights = validateWeights(body.weights, errors);
    const offerIds = validateOfferIds(body.offerIds, errors);

    return {
        errors: errors,
        values: {
            comparisonName: comparisonName,
            weights: weights,
            offerIds: offerIds
        }
    };
}

function readComparisonValues(body) {
    const checked = validateComparison(body);

    if (checked.errors.length > 0) {
        throw httpError(400, checked.errors[0]);
    }
    return checked.values;
}

// a bad id is treated as a missing comparison rather than a separate error
function readComparisonId(req) {
    const comparisonId = Number(req.params.comparisonId);

    if (isNaN(comparisonId)) {
        throw httpError(404, 'That comparison was not found.');
    }
    return comparisonId;
}

async function list(req, res, next) {
    try {
        const comparisons = await comparisonService.listComparisons(req.user.userId);
        res.json({ comparisons: comparisons });
    } catch (error) {
        next(error);
    }
}

async function get(req, res, next) {
    try {
        const comparisonId = readComparisonId(req);
        const comparison = await comparisonService.getComparison(req.user.userId, comparisonId);
        res.json({ comparison: comparison });
    } catch (error) {
        next(error);
    }
}

async function scores(req, res, next) {
    try {
        const comparisonId = readComparisonId(req);
        const result = await comparisonService.getScores(req.user.userId, comparisonId);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const values = readComparisonValues(req.body);
        const comparison = await comparisonService.createComparison(req.user.userId, values);
        res.status(201).json({ comparison: comparison });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const comparisonId = readComparisonId(req);
        const values = readComparisonValues(req.body);
        const comparison = await comparisonService.updateComparison(
            req.user.userId,
            comparisonId,
            values
        );
        res.json({ comparison: comparison });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const comparisonId = readComparisonId(req);
        await comparisonService.deleteComparison(req.user.userId, comparisonId);
        res.json({ message: 'Comparison deleted.' });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    list: list,
    get: get,
    scores: scores,
    create: create,
    update: update,
    remove: remove,
    validateComparison: validateComparison
};
