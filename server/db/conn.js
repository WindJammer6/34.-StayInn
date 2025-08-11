require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;

const connection_str = process.env.ATLAS_URI || "";

const client = new MongoClient(connection_str);
const dbName = 'BookingRecords'

var db = null;

try {
    client.connect();
    db = client.db(dbName);
} catch (error) {
    console.error("database connection failed. " + error);
}

async function cleanup() {
    await client.disconnect();
}


module.exports = { db, cleanup } ;