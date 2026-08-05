// listing and saving offers, joining the MySQL row to its MongoDB perks

const offerRepository = require('../repositories/offerRepository');
const companyRepository = require('../repositories/companyRepository');
const perksRepository = require('../repositories/perksRepository');
const { httpError } = require('../middleware/errorHandler');

// mysql2 hands DECIMAL columns back as strings, so money is converted here
function toNumber(value) {
    if (value === null || value === undefined) {
        return null;
    }
    return Number(value);
}

function toPublicOffer(row, perks) {
    return {
        offerId: row.offer_id,
        companyId: row.company_id,
        companyName: row.company_name,
        cityId: row.city_id,
        cityName: row.city_name,
        stateCode: row.state_code,
        jobTitle: row.job_title,
        jobLevel: row.job_level,
        baseSalary: toNumber(row.base_salary),
        signingBonus: toNumber(row.signing_bonus),
        annualBonusPct: toNumber(row.annual_bonus_pct),
        equityType: row.equity_type,
        equityTotalValue: toNumber(row.equity_total_value),
        equityVestYears: row.equity_vest_years,
        equityCliffMonths: row.equity_cliff_months,
        expectedHoursWeek: row.expected_hours_week,
        workArrangement: row.work_arrangement,
        offerStatus: row.offer_status,
        deadlineDate: row.deadline_date,
        perks: perks
    };
}

async function listOffers(userId) {
    const rows = await offerRepository.findByUser(userId);

    if (rows.length === 0) {
        return [];
    }

    const offerIds = [];
    for (let i = 0; i < rows.length; i++) {
        offerIds.push(rows[i].offer_id);
    }

    const perksByOffer = await perksRepository.findByOffers(offerIds);
    const offers = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        let perks = perksByOffer[row.offer_id];
        if (!perks) {
            perks = [];
        }
        offers.push(toPublicOffer(row, perks));
    }

    return offers;
}

// the same "not found" either way, so one user cannot probe another's offer ids
async function getOffer(userId, offerId) {
    const row = await offerRepository.findById(offerId);

    if (row === null || row.user_id !== userId) {
        throw httpError(404, 'That offer was not found.');
    }

    const perks = await perksRepository.findByOffer(offerId);
    return toPublicOffer(row, perks);
}

async function createOffer(userId, details) {
    const company = await companyRepository.findOrCreate(details.companyName);

    const offerId = await offerRepository.insert({
        userId: userId,
        companyId: company.companyId,
        cityId: details.cityId,
        jobTitle: details.jobTitle,
        jobLevel: details.jobLevel,
        baseSalary: details.baseSalary,
        signingBonus: details.signingBonus,
        annualBonusPct: details.annualBonusPct,
        equityType: details.equityType,
        equityTotalValue: details.equityTotalValue,
        equityVestYears: details.equityVestYears,
        equityCliffMonths: details.equityCliffMonths,
        expectedHoursWeek: details.expectedHoursWeek,
        workArrangement: details.workArrangement,
        offerStatus: details.offerStatus,
        deadlineDate: details.deadlineDate
    });

    // the two databases are not in one transaction, so a failed perks write
    // takes the MySQL row back out instead of leaving half an offer behind
    try {
        await perksRepository.upsert(offerId, userId, details.perks);
    } catch (error) {
        await offerRepository.remove(offerId);
        throw error;
    }

    return await getOffer(userId, offerId);
}

module.exports = {
    listOffers: listOffers,
    getOffer: getOffer,
    createOffer: createOffer,
    toPublicOffer: toPublicOffer
};
