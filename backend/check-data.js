require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const checkData = async () => {
    try {
        console.log("Connecting to DB...");
        console.log("URI:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected");

        const count = await User.countDocuments();
        console.log(`\n---------------------`);
        console.log(`📊 TOTAL USERS FOUND: ${count}`);
        console.log(`---------------------\n`);

        if (count > 0) {
            const sample = await User.findOne();
            console.log("Sample User:", sample);
        }

        // console.log("Create Clean Slate: Deleting all users...");
        // await User.deleteMany({});
        // console.log("✅ All users deleted");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

checkData();
