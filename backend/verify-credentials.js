require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;

if (!uri) {
    console.error("❌ ERROR: MONGO_URI is missing in .env file!");
    process.exit(1);
}

// Mask password for safe logging
const maskedUri = uri.replace(/\/\/(.*):(.*)@/, "//$1:****@");
console.log(`\n🔍 Trying to connect to MongoDB...`);
console.log(`📝 Using URI from .env: ${maskedUri}`);

mongoose.connect(uri)
    .then(() => {
        console.log("\n✅ SUCCESS: Connected to MongoDB!");
        console.log("👉 Your .env file is correct.");
        process.exit(0);
    })
    .catch(err => {
        console.error("\n❌ CONNECTION FAILED!");
        console.error(`👉 Reason: ${err.message}`);
        console.error("\n⚠️  Likely Causes:");
        console.error("   1. Username or Password in .env is incorrect.");
        console.error("   2. Your IP address is not whitelisted in MongoDB Atlas 'Network Access'.");
        console.error("   3. Database user does not exist.");
        process.exit(1);
    });
