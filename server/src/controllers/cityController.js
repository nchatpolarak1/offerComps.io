// request handler for /api/cities, the list the add-offer form picks from

const cityRepository = require('../repositories/cityRepository');

async function list(req, res, next) {
    try {
        const cities = await cityRepository.all();
        res.json({ cities: cities });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    list: list
};
