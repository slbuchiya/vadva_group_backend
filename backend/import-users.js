const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1t_dKA9npVwJSPeAy5Vtv92t2LGgJKoChSyQmg4PPw3o/export?format=csv';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

// Simple CSV Parser handling quoted fields
const parseCSV = (text) => {
    const lines = text.split('\n'); // Split by line
    const result = [];
    const headers = lines[0].split(',').map(h => h.trim());

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const obj = {};
        const currentLine = lines[i];
        const values = [];
        let currentVal = '';
        let inQuotes = false;

        for (let j = 0; j < currentLine.length; j++) {
            const char = currentLine[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentVal.trim());
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
        values.push(currentVal.trim());

        // Map columns based on index
        // 0: Timestamp
        // 1: Full Name (તમારું પૂરું નામ લખો)
        // 2: T-Shirt Name (T-Shirt પર તમારું શું નામ લખવાનું છે)
        // 3: Size (સાઇઝ)
        // 4: Mobile (તમારો મોબાઈલ નંબર)

        if (values.length >= 5) {
            obj.fullName = values[1].replace(/^"|"$/g, '').trim();
            obj.tshirtName = values[2].replace(/^"|"$/g, '').trim();
            obj.size = values[3].replace(/^"|"$/g, '').trim();
            obj.mobile = values[4].replace(/^"|"$/g, '').trim();

            // Clean mobile number (remove spaces, etc if needed)
            // obj.mobile = obj.mobile.replace(/\D/g, ''); 

            result.push(obj);
        }
    }
    return result;
};

const fs = require('fs');
const path = require('path');

const CSV_FILE_NAME = 'Untitled form (Responses) - Form responses 1.csv';
const CSV_FILE_PATH = path.join(__dirname, CSV_FILE_NAME);

const importData = async () => {
    await connectDB();

    try {
        console.log(`Reading data from local file: ${CSV_FILE_NAME}...`);

        if (!fs.existsSync(CSV_FILE_PATH)) {
            throw new Error(`File not found: ${CSV_FILE_PATH}`);
        }

        const text = fs.readFileSync(CSV_FILE_PATH, 'utf8');
        const users = parseCSV(text);

        console.log(`Found ${users.length} users to process.`);

        let count = 0;
        for (const user of users) {
            // Basic validation
            if (!user.mobile || !user.fullName) {
                console.log(`Skipping invalid row: ${JSON.stringify(user)}`);
                continue;
            }

            // Upsert: Update if mobile exists, otherwise insert
            await User.findOneAndUpdate(
                { mobile: user.mobile },
                {
                    $set: {
                        fullName: user.fullName,
                        tshirtName: user.tshirtName,
                        size: user.size,
                        // Default values are handled by schema if creating new, 
                        // but standard practice to set them if needed or let defaults handle it.
                        // Schema defaults: amount: 300, paymentStatus: false
                    }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            process.stdout.write('.');
            count++;
        }

        console.log(`\nImported/Updated ${count} users successfully.`);
        process.exit(0);

    } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    }
};

importData();
