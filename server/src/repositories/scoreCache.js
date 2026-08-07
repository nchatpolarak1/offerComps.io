// scored offers for a comparison, cached in Redis as a comparison:<id>:scores
// sorted set so the ranking comes back already in order

const redisClient = require('../db/redisClient');

const CACHE_TTL_SECONDS = 3600;

function keyFor(comparisonId) {
    return 'comparison:' + comparisonId + ':scores';
}

async function write(comparisonId, scores) {
    const key = keyFor(comparisonId);
    const members = [];

    for (let i = 0; i < scores.length; i++) {
        members.push({ score: scores[i].score, value: String(scores[i].offerId) });
    }

    if (members.length === 0) {
        return;
    }

    await redisClient.client.del(key);
    await redisClient.client.zAdd(key, members);
    await redisClient.client.expire(key, CACHE_TTL_SECONDS);
}

// highest score first; null when nothing has been cached yet
async function readRanking(comparisonId) {
    const rows = await redisClient.client.zRangeWithScores(keyFor(comparisonId), 0, -1, {
        REV: true
    });

    if (!rows || rows.length === 0) {
        return null;
    }

    const ranking = [];
    for (let i = 0; i < rows.length; i++) {
        ranking.push({ offerId: Number(rows[i].value), score: rows[i].score });
    }
    return ranking;
}

// the 1 hour TTL is only a backup, this is what actually keeps scores honest
// when an offer or a weight changes
async function invalidate(comparisonId) {
    await redisClient.client.del(keyFor(comparisonId));
}

module.exports = {
    write: write,
    readRanking: readRanking,
    invalidate: invalidate
};
