// named comparisons: the weights a user cares about and the offers they picked

const comparisonRepository = require('../repositories/comparisonRepository');
const offerRepository = require('../repositories/offerRepository');
const scoreCache = require('../repositories/scoreCache');
const offerService = require('./offerService');
const scoringService = require('./scoringService');
const { httpError } = require('../middleware/errorHandler');

// mysql2 hands DECIMAL columns back as strings
function toNumber(value) {
    return Number(value);
}

function toPublicComparison(row, offerIds) {
    return {
        comparisonId: row.comparison_id,
        comparisonName: row.comparison_name,
        weights: {
            pay: toNumber(row.w_pay),
            commute: toNumber(row.w_commute),
            hours: toNumber(row.w_hours),
            flexibility: toNumber(row.w_flexibility)
        },
        offerIds: offerIds
    };
}

// "not found" either way, so one user cannot probe another's comparison ids
async function requireOwnedRow(userId, comparisonId) {
    const row = await comparisonRepository.findById(comparisonId);

    if (row === null || row.user_id !== userId) {
        throw httpError(404, 'That comparison was not found.');
    }
    return row;
}

// a comparison may only point at offers the same user owns
async function requireOwnedOffers(userId, offerIds) {
    for (let i = 0; i < offerIds.length; i++) {
        const row = await offerRepository.findById(offerIds[i]);

        if (row === null || row.user_id !== userId) {
            throw httpError(400, 'One of the chosen offers was not found.');
        }
    }
}

async function listComparisons(userId) {
    const rows = await comparisonRepository.findByUser(userId);
    const comparisons = [];

    for (let i = 0; i < rows.length; i++) {
        const offerIds = await comparisonRepository.findOfferIds(rows[i].comparison_id);
        const comparison = toPublicComparison(rows[i], offerIds);

        // free when the scores are already cached, null until they are computed
        comparison.ranking = await scoreCache.readRanking(rows[i].comparison_id);
        comparisons.push(comparison);
    }

    return comparisons;
}

async function getScores(userId, comparisonId) {
    const comparison = await getComparison(userId, comparisonId);
    const scores = await scoringService.score(userId, comparison.offers, comparison.weights);

    await scoreCache.write(comparisonId, scores);

    return {
        comparisonId: comparisonId,
        comparisonName: comparison.comparisonName,
        weights: comparison.weights,
        scores: scores
    };
}

// the break-even figures do not depend on the weights, so the page asks for
// them once instead of every time a slider moves
async function getBreakEven(userId, comparisonId) {
    const comparison = await getComparison(userId, comparisonId);
    const result = await scoringService.breakEven(userId, comparison.offers);

    return {
        comparisonId: comparisonId,
        comparisonName: comparison.comparisonName,
        bestOfferId: result.bestOfferId,
        bestCompanyName: result.bestCompanyName,
        offers: result.offers
    };
}

// the detail view needs the offers themselves, not just their ids
async function getComparison(userId, comparisonId) {
    const row = await requireOwnedRow(userId, comparisonId);
    const offerIds = await comparisonRepository.findOfferIds(comparisonId);
    const comparison = toPublicComparison(row, offerIds);
    const offers = [];

    for (let i = 0; i < offerIds.length; i++) {
        offers.push(await offerService.getOffer(userId, offerIds[i]));
    }

    comparison.offers = offers;
    return comparison;
}

async function createComparison(userId, details) {
    await requireOwnedOffers(userId, details.offerIds);

    const comparisonId = await comparisonRepository.insert({
        userId: userId,
        comparisonName: details.comparisonName,
        wPay: details.weights.pay,
        wCommute: details.weights.commute,
        wHours: details.weights.hours,
        wFlexibility: details.weights.flexibility
    });

    // the comparison row is taken back out if the picked offers cannot be saved
    try {
        await comparisonRepository.setOffers(comparisonId, details.offerIds);
    } catch (error) {
        await comparisonRepository.remove(comparisonId);
        throw error;
    }

    return await getComparison(userId, comparisonId);
}

async function updateComparison(userId, comparisonId, details) {
    await requireOwnedRow(userId, comparisonId);
    await requireOwnedOffers(userId, details.offerIds);

    await comparisonRepository.update({
        comparisonId: comparisonId,
        comparisonName: details.comparisonName,
        wPay: details.weights.pay,
        wCommute: details.weights.commute,
        wHours: details.weights.hours,
        wFlexibility: details.weights.flexibility
    });
    await comparisonRepository.setOffers(comparisonId, details.offerIds);

    // new weights or a different set of offers means the cached scores are stale
    await scoreCache.invalidate(comparisonId);

    return await getComparison(userId, comparisonId);
}

async function deleteComparison(userId, comparisonId) {
    await requireOwnedRow(userId, comparisonId);
    await comparisonRepository.remove(comparisonId);
    await scoreCache.invalidate(comparisonId);
}

module.exports = {
    listComparisons: listComparisons,
    getComparison: getComparison,
    getScores: getScores,
    getBreakEven: getBreakEven,
    createComparison: createComparison,
    updateComparison: updateComparison,
    deleteComparison: deleteComparison
};
