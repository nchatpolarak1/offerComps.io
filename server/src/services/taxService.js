// federal and state income tax, and what pay is worth after cost of living

const taxBracketRepository = require('../repositories/taxBracketRepository');

const FEDERAL_CODE = 'US';

// the only year seeded in tax_bracket
const TAX_YEAR = 2025;

// walks the brackets bottom up, taxing the slice of income that falls in each
function bracketTax(income, brackets) {
    let owed = 0;

    for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];

        if (income <= bracket.lower) {
            break;
        }

        let top = income;
        if (bracket.upper !== null && bracket.upper < income) {
            top = bracket.upper;
        }

        owed = owed + (top - bracket.lower) * bracket.rate;
    }

    return owed;
}

async function federalTax(income, year) {
    const brackets = await taxBracketRepository.findByJurisdiction(FEDERAL_CODE, year);
    return bracketTax(income, brackets);
}

// Texas and Washington have no rows, which means no state income tax
async function stateTax(income, stateCode, year) {
    const brackets = await taxBracketRepository.findByJurisdiction(stateCode, year);
    return bracketTax(income, brackets);
}

async function takeHome(gross, stateCode, year) {
    const federal = await federalTax(gross, year);
    const state = await stateTax(gross, stateCode, year);

    return {
        federalTax: federal,
        stateTax: state,
        takeHome: gross - federal - state
    };
}

// col_index is 100.0 at the national average, so this is what the money would
// be worth in an average-cost city
function colAdjust(amount, colIndex) {
    return (amount * 100) / colIndex;
}

module.exports = {
    TAX_YEAR: TAX_YEAR,
    federalTax: federalTax,
    stateTax: stateTax,
    takeHome: takeHome,
    colAdjust: colAdjust
};
