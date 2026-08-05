// the offer_perks documents in MongoDB, one per offer, joined to MySQL by Oid

const mongoConnection = require('../db/mongoConnection');

const COLLECTION_NAME = 'offer_perks';

function perksCollection() {
    return mongoConnection.collection(COLLECTION_NAME);
}

async function findByOffer(offerId) {
    const document = await perksCollection().findOne({ Oid: offerId });

    if (document === null || !document.perks) {
        return [];
    }
    return document.perks;
}

// every offer in the list at once, so the list page makes one Mongo call
async function findByOffers(offerIds) {
    const documents = await perksCollection().find({ Oid: { $in: offerIds } }).toArray();
    const byOffer = {};

    for (let i = 0; i < documents.length; i++) {
        const document = documents[i];
        if (document.perks) {
            byOffer[document.Oid] = document.perks;
        }
    }
    return byOffer;
}

async function upsert(offerId, userId, perks) {
    const changes = {
        $set: {
            Oid: offerId,
            Uid: userId,
            perks: perks
        }
    };
    await perksCollection().updateOne({ Oid: offerId }, changes, { upsert: true });
}

async function deleteByOffer(offerId) {
    await perksCollection().deleteOne({ Oid: offerId });
}

module.exports = {
    findByOffer: findByOffer,
    findByOffers: findByOffers,
    upsert: upsert,
    deleteByOffer: deleteByOffer
};
