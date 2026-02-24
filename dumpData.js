require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/srm_backend';

async function dumpData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        const dumpDir = path.join(__dirname, 'data_dump');
        
        if (!fs.existsSync(dumpDir)) {
            fs.mkdirSync(dumpDir);
        }

        const allData = {};

        for (const collection of collections) {
            const collectionName = collection.name;
            const data = await mongoose.connection.db.collection(collectionName).find({}).toArray();
            allData[collectionName] = data;
            
            fs.writeFileSync(
                path.join(dumpDir, `${collectionName}.json`),
                JSON.stringify(data, null, 2)
            );
            console.log(`✓ Dumped ${collectionName}: ${data.length} documents`);
        }

        fs.writeFileSync(
            path.join(dumpDir, 'all_data.json'),
            JSON.stringify(allData, null, 2)
        );
        console.log(`\n✓ All data saved to ${dumpDir}`);

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

dumpData();
