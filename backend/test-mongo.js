const mongoose = require('mongoose');

// URI provided by user
const uri = "mongodb+srv://Sachin1966:Sachin1966@smartfit.bocyckn.mongodb.net/?appName=SMARTFIT";

console.log("Attempting to connect...");

mongoose.connect(uri)
    .then(() => {
        console.log("Successfully connected!");
        process.exit(0);
    })
    .catch(err => {
        console.error("Connection failed:", err.message);
        console.error("Full error:", err);
        process.exit(1);
    });
