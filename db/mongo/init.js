
const existingCollections = db.getCollectionNames();

if (existingCollections.indexOf('offer_perks') === -1) {
    db.createCollection('offer_perks');
    print('created collection offer_perks');
} else {
    print('collection offer_perks already exists');
}

// one perk document per offer
db.offer_perks.createIndex({ Oid: 1 }, { unique: true, name: 'uq_offer_perks_Oid' });
db.offer_perks.createIndex({ Uid: 1 }, { name: 'idx_offer_perks_Uid' });

print('MongoDB setup finished for database ' + db.getName());
