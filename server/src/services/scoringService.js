// scores offers against the weights a user set: pay, commute, hours, flexibility

const cityRepository = require('../repositories/cityRepository');
const offerService = require('./offerService');
const taxService = require('./taxService');

// working from home is worth something on its own, so this axis is a fixed
// scale rather than a comparison between the offers
const FLEXIBILITY_SCORES = { remote: 1.0, hybrid: 0.6, onsite: 0.3 };

function flexibilityScore(workArrangement) {
    const score = FLEXIBILITY_SCORES[workArrangement];

    if (score === undefined) {
        return 0;
    }
    return score;
}

// more is better, so the best offer sets the bar
function higherIsBetter(value, best) {
    if (best <= 0) {
        return 0;
    }
    return value / best;
}

// fewer minutes and fewer hours are better, so the ratio flips
function lowerIsBetter(value, best) {
    if (value <= 0) {
        return 1;
    }
    return best / value;
}

function round(value, places) {
    const factor = Math.pow(10, places);
    return Math.round(value * factor) / factor;
}

// everything the scoring needs for one offer, gathered before any comparing
async function measure(userId, offer) {
    const breakdown = await offerService.getBreakdown(userId, offer.offerId);
    const city = await cityRepository.findById(offer.cityId);

    // perks are real money but are not wages, so they are added after tax and
    // then put in national-average terms like the rest of the pay
    const payValue = taxService.colAdjust(
        breakdown.takeHome + breakdown.perksValue,
        city.colIndex
    );

    return {
        offer: offer,
        breakdown: breakdown,
        payValue: payValue,
        commuteMinutes: city.meanCommuteMinutes,
        hoursWeek: offer.expectedHoursWeek
    };
}

async function score(userId, offers, weights) {
    const measured = [];

    for (let i = 0; i < offers.length; i++) {
        measured.push(await measure(userId, offers[i]));
    }

    let bestPay = 0;
    let bestCommute = 0;
    let bestHours = 0;

    for (let i = 0; i < measured.length; i++) {
        if (measured[i].payValue > bestPay) {
            bestPay = measured[i].payValue;
        }
        if (bestCommute === 0 || measured[i].commuteMinutes < bestCommute) {
            bestCommute = measured[i].commuteMinutes;
        }
        if (bestHours === 0 || measured[i].hoursWeek < bestHours) {
            bestHours = measured[i].hoursWeek;
        }
    }

    const scores = [];

    for (let i = 0; i < measured.length; i++) {
        const item = measured[i];
        const parts = {
            pay: higherIsBetter(item.payValue, bestPay),
            commute: lowerIsBetter(item.commuteMinutes, bestCommute),
            hours: lowerIsBetter(item.hoursWeek, bestHours),
            flexibility: flexibilityScore(item.offer.workArrangement)
        };

        const total =
            weights.pay * parts.pay +
            weights.commute * parts.commute +
            weights.hours * parts.hours +
            weights.flexibility * parts.flexibility;

        scores.push({
            offerId: item.offer.offerId,
            companyName: item.offer.companyName,
            jobTitle: item.offer.jobTitle,
            cityName: item.offer.cityName,
            stateCode: item.offer.stateCode,
            score: round(total * 100, 1),
            parts: {
                pay: round(parts.pay, 3),
                commute: round(parts.commute, 3),
                hours: round(parts.hours, 3),
                flexibility: round(parts.flexibility, 3)
            },
            values: {
                adjustedPay: round(item.payValue, 2),
                commuteMinutes: item.commuteMinutes,
                hoursWeek: item.hoursWeek,
                workArrangement: item.offer.workArrangement
            },
            breakdown: item.breakdown
        });
    }

    // highest score first, the order the comparison page shows them in
    scores.sort(function (a, b) {
        return b.score - a.score;
    });

    return scores;
}

module.exports = {
    score: score
};
