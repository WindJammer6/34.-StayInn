require("dotenv").config();
const { MongoClient } = require("mongodb");

const connection_str = process.env.ATLAS_URI || "";
const dbName = "BookingRecords";

let client;
let db = null;

if (process.env.NODE_ENV !== "test") {
  try {
    client = new MongoClient(connection_str);
    client.connect();
    db = client.db(dbName);
  } catch (error) {
    console.error("database connection failed. " + error);
  }
} else {
  // In test mode, return a dummy object
  db = {};
}

async function cleanup() {
  if (client) {
    await client.close(); // correct method is .close() not .disconnect()
  }
}

module.exports = { db, cleanup };
