// 1. Enter your NEW MongoDB Password inside the quotes below:
const password = "YOUR_NEW_PASSWORD_HERE";

// 2. Do not change these unless you changed them in Atlas
const username = "slbuchiya";
const cluster = "govindsuragroup.ghhvytp.mongodb.net";
const dbName = "tshirt_store";

// ---------------------------------------------------------
// This code will URL-encode your password properly
const encodedPassword = encodeURIComponent(password);
const encodedUsername = encodeURIComponent(username);

const uri = `mongodb+srv://${encodedUsername}:${encodedPassword}@${cluster}/${dbName}?retryWrites=true&w=majority&appName=GovindSuraGroup`;

console.log("\n=======================================================");
console.log("COPY THIS EXACT CONNECTION STRING FOR RENDER:");
console.log("=======================================================\n");
console.log(uri);
console.log("\n=======================================================\n");
