// request handlers for /api/offers

const offerService = require('../services/offerService');
const cityRepository = require('../repositories/cityRepository');
const { httpError } = require('../middleware/errorHandler');

const MAX_COMPANY_LENGTH = 150;
const MAX_TITLE_LENGTH = 150;
const MAX_LEVEL_LENGTH = 50;
const MAX_PERK_NAME_LENGTH = 100;
const MAX_PERK_DETAIL_LENGTH = 100;
const MAX_PERKS = 20;

const EQUITY_TYPES = ['none', 'RSU'];
const WORK_ARRANGEMENTS = ['onsite', 'hybrid', 'remote'];
const OFFER_STATUSES = ['pending', 'accepted', 'declined', 'expired'];
const PERK_CATEGORIES = ['retirement', 'PTO', 'lifestyle', 'other'];

function cleanText(value) {
    if (typeof value !== 'string') {
        return '';
    }
    return value.trim();
}

function isFilledIn(value) {
    return value !== undefined && value !== null && value !== '';
}

function isInList(value, allowed) {
    return allowed.indexOf(value) !== -1;
}

// '2026-09-15' and nothing else
function isValidDate(value) {
    const pattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!pattern.test(value)) {
        return false;
    }
    const parsed = new Date(value);
    return !isNaN(parsed.getTime());
}

// null means the request left perks out, not the same as sending none
function validatePerks(rawPerks, errors) {
    if (rawPerks === undefined || rawPerks === null) {
        return null;
    }

    if (!Array.isArray(rawPerks)) {
        errors.push('Perks must be a list.');
        return [];
    }

    if (rawPerks.length > MAX_PERKS) {
        errors.push('An offer can have at most ' + MAX_PERKS + ' perks.');
        return [];
    }

    const perks = [];

    for (let i = 0; i < rawPerks.length; i++) {
        const raw = rawPerks[i];

        if (raw === null || typeof raw !== 'object') {
            errors.push('Each perk must have a name and a category.');
            return [];
        }

        const name = cleanText(raw.name);
        const category = cleanText(raw.category);
        const detail = cleanText(raw.detail);
        let annualValue = null;

        if (name === '') {
            errors.push('Every perk needs a name.');
            return [];
        }
        if (name.length > MAX_PERK_NAME_LENGTH) {
            errors.push('Perk names must be ' + MAX_PERK_NAME_LENGTH + ' characters or fewer.');
            return [];
        }
        if (!isInList(category, PERK_CATEGORIES)) {
            errors.push('Perk category must be one of: ' + PERK_CATEGORIES.join(', ') + '.');
            return [];
        }
        if (detail.length > MAX_PERK_DETAIL_LENGTH) {
            errors.push('Perk details must be ' + MAX_PERK_DETAIL_LENGTH + ' characters or fewer.');
            return [];
        }

        if (isFilledIn(raw.annualValue)) {
            annualValue = Number(raw.annualValue);
            if (isNaN(annualValue) || annualValue < 0) {
                errors.push('The value of "' + name + '" must be zero or more.');
                return [];
            }
        }

        perks.push({
            name: name,
            category: category,
            annualValue: annualValue,
            detail: detail === '' ? null : detail
        });
    }

    return perks;
}

function validateOffer(body) {
    const errors = [];

    const companyName = cleanText(body.companyName);
    const jobTitle = cleanText(body.jobTitle);
    const jobLevel = cleanText(body.jobLevel);

    if (companyName === '') {
        errors.push('Company name is required.');
    } else if (companyName.length > MAX_COMPANY_LENGTH) {
        errors.push('Company name is too long.');
    }

    if (jobTitle === '') {
        errors.push('Job title is required.');
    } else if (jobTitle.length > MAX_TITLE_LENGTH) {
        errors.push('Job title is too long.');
    }

    if (jobLevel.length > MAX_LEVEL_LENGTH) {
        errors.push('Job level is too long.');
    }

    const cityId = Number(body.cityId);
    if (!isFilledIn(body.cityId) || isNaN(cityId)) {
        errors.push('Please choose a city.');
    }

    const baseSalary = Number(body.baseSalary);
    if (!isFilledIn(body.baseSalary) || isNaN(baseSalary)) {
        errors.push('Base salary is required.');
    } else if (baseSalary <= 0) {
        errors.push('Base salary must be greater than zero.');
    }

    let signingBonus = 0;
    if (isFilledIn(body.signingBonus)) {
        signingBonus = Number(body.signingBonus);
        if (isNaN(signingBonus) || signingBonus < 0) {
            errors.push('Signing bonus must be zero or more.');
        }
    }

    let annualBonusPct = 0;
    if (isFilledIn(body.annualBonusPct)) {
        annualBonusPct = Number(body.annualBonusPct);
        if (isNaN(annualBonusPct) || annualBonusPct < 0 || annualBonusPct > 100) {
            errors.push('Annual bonus must be between 0 and 100 percent.');
        }
    }

    let equityType = 'none';
    if (isFilledIn(body.equityType)) {
        equityType = cleanText(body.equityType);
        if (!isInList(equityType, EQUITY_TYPES)) {
            errors.push('Equity type must be "none" or "RSU".');
        }
    }

    let equityTotalValue = null;
    let equityVestYears = null;
    let equityCliffMonths = null;

    if (equityType === 'RSU') {
        equityTotalValue = Number(body.equityTotalValue);
        if (!isFilledIn(body.equityTotalValue) || isNaN(equityTotalValue) || equityTotalValue < 0) {
            errors.push('Enter the total value of the equity grant.');
        }

        equityVestYears = Number(body.equityVestYears);
        if (!isFilledIn(body.equityVestYears) || isNaN(equityVestYears)) {
            errors.push('Enter how many years the equity vests over.');
        } else if (equityVestYears < 1 || equityVestYears > 10) {
            errors.push('Equity must vest over 1 to 10 years.');
        }

        equityCliffMonths = 12;
        if (isFilledIn(body.equityCliffMonths)) {
            equityCliffMonths = Number(body.equityCliffMonths);
            if (isNaN(equityCliffMonths) || equityCliffMonths < 0 || equityCliffMonths > 60) {
                errors.push('The equity cliff must be between 0 and 60 months.');
            }
        }
    }

    let expectedHoursWeek = 40;
    if (isFilledIn(body.expectedHoursWeek)) {
        expectedHoursWeek = Number(body.expectedHoursWeek);
        if (isNaN(expectedHoursWeek) || expectedHoursWeek < 1 || expectedHoursWeek > 100) {
            errors.push('Expected hours per week must be between 1 and 100.');
        }
    }

    let workArrangement = 'onsite';
    if (isFilledIn(body.workArrangement)) {
        workArrangement = cleanText(body.workArrangement);
        if (!isInList(workArrangement, WORK_ARRANGEMENTS)) {
            errors.push('Work arrangement must be onsite, hybrid, or remote.');
        }
    }

    let offerStatus = 'pending';
    if (isFilledIn(body.offerStatus)) {
        offerStatus = cleanText(body.offerStatus);
        if (!isInList(offerStatus, OFFER_STATUSES)) {
            errors.push('Offer status must be pending, accepted, declined, or expired.');
        }
    }

    let deadlineDate = null;
    if (isFilledIn(body.deadlineDate)) {
        deadlineDate = cleanText(body.deadlineDate);
        if (!isValidDate(deadlineDate)) {
            errors.push('Please enter the deadline as YYYY-MM-DD.');
        }
    }

    const perks = validatePerks(body.perks, errors);

    return {
        errors: errors,
        values: {
            companyName: companyName,
            jobTitle: jobTitle,
            jobLevel: jobLevel === '' ? null : jobLevel,
            cityId: cityId,
            baseSalary: baseSalary,
            signingBonus: signingBonus,
            annualBonusPct: annualBonusPct,
            equityType: equityType,
            equityTotalValue: equityTotalValue,
            equityVestYears: equityVestYears,
            equityCliffMonths: equityCliffMonths,
            expectedHoursWeek: expectedHoursWeek,
            workArrangement: workArrangement,
            offerStatus: offerStatus,
            deadlineDate: deadlineDate,
            perks: perks
        }
    };
}

async function list(req, res, next) {
    try {
        const offers = await offerService.listOffers(req.user.userId);
        res.json({ offers: offers });
    } catch (error) {
        next(error);
    }
}

// a bad id is treated as a missing offer rather than a separate error
function readOfferId(req) {
    const offerId = Number(req.params.offerId);

    if (isNaN(offerId)) {
        throw httpError(404, 'That offer was not found.');
    }
    return offerId;
}

// validates the body and confirms the chosen city exists
async function readOfferValues(body) {
    const checked = validateOffer(body);
    if (checked.errors.length > 0) {
        throw httpError(400, checked.errors[0]);
    }

    const city = await cityRepository.findById(checked.values.cityId);
    if (city === null) {
        throw httpError(400, 'That city was not found.');
    }

    return checked.values;
}

async function get(req, res, next) {
    try {
        const offerId = readOfferId(req);
        const offer = await offerService.getOffer(req.user.userId, offerId);
        res.json({ offer: offer });
    } catch (error) {
        next(error);
    }
}

async function breakdown(req, res, next) {
    try {
        const offerId = readOfferId(req);
        const details = await offerService.getBreakdown(req.user.userId, offerId);
        res.json({ breakdown: details });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const values = await readOfferValues(req.body);
        const offer = await offerService.createOffer(req.user.userId, values);
        res.status(201).json({ offer: offer });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const offerId = readOfferId(req);
        const values = await readOfferValues(req.body);
        const offer = await offerService.updateOffer(req.user.userId, offerId, values);
        res.json({ offer: offer });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const offerId = readOfferId(req);
        await offerService.deleteOffer(req.user.userId, offerId);
        res.json({ message: 'Offer deleted.' });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    list: list,
    get: get,
    breakdown: breakdown,
    create: create,
    update: update,
    remove: remove,
    validateOffer: validateOffer
};
