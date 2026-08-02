
const existingCollections = db.getCollectionNames();

if (existingCollections.indexOf('offer_perks') === -1) {
    db.createCollection('offer_perks');
    print('created collection offer_perks');
} else {
    print('collection offer_perks already exists');
}

// One perk document per offer
db.offer_perks.createIndex({ Oid: 1 }, { unique: true, name: 'uq_offer_perks_Oid' });
db.offer_perks.createIndex({ Uid: 1 }, { name: 'idx_offer_perks_Uid' });

// offer_files, uploaded offer letters.
if (existingCollections.indexOf('offer_files') === -1) {
    db.createCollection('offer_files');
    print('created collection offer_files');
} else {
    print('collection offer_files already exists');
}

// An offer can have more than one file, so this index is not unique.
db.offer_files.createIndex({ Oid: 1 }, { name: 'idx_offer_files_Oid' });
db.offer_files.createIndex({ Uid: 1 }, { name: 'idx_offer_files_Uid' });

print('MongoDB setup finished for database ' + db.getName());
