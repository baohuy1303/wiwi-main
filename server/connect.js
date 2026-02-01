const { MongoClient, ServerApiVersion } = require('mongodb');

require("dotenv").config({ path: "./.env" });
// Create a MongoClient with a MongoClientOptions object to set the Stable API version

const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const connectToServer = async () => {
  console.log("Connecting with URI:", process.env.ATLAS_URI);
  try {
    await mongoose.connect(process.env.ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Successfully connected to MongoDB Atlas with Mongoose");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // Kill if fail
  }
};

module.exports = { connectToServer };



/* const client = new MongoClient(process.env.ATLAS_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let database;

module.exports = {
  connectToServer: async () => {
    try {
        await client.connect(); // ✅ CONNECT FIRST
        database = client.db('nanikids');
        console.log('✅ Successfully connected to MongoDB Atlas');
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err);
        throw err; // 🔥 Fail fast
    }
},
getDb: () => {
    return database;
},
}*/
