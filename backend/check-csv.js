const fs = require('fs');
const path = require('path');

const CSV_FILE_NAME = 'Untitled form (Responses) - Form responses 1.csv';
const CSV_FILE_PATH = path.join(__dirname, CSV_FILE_NAME);

const analyzeCSV = () => {
    try {
        const text = fs.readFileSync(CSV_FILE_PATH, 'utf8');
        const lines = text.split('\n');

        console.log(`Total Lines: ${lines.length}`);

        const mobileCounts = {};
        let validRows = 0;
        let invalidRows = 0;

        // Skip header
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = [];
            let currentVal = '';
            let inQuotes = false;

            for (let j = 0; j < line.length; j++) {
                const char = line[j];
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

            if (values.length >= 5) {
                // Mobile is index 4
                let mobile = values[4].replace(/^"|"$/g, '').trim();

                if (mobile) {
                    mobileCounts[mobile] = (mobileCounts[mobile] || 0) + 1;
                    validRows++;
                } else {
                    console.log(`Row ${i + 1}: Missing Mobile`);
                    invalidRows++;
                }
            } else {
                console.log(`Row ${i + 1}: Invalid Column Count (${values.length})`);
                invalidRows++;
            }
        }

        console.log(`Valid Rows: ${validRows}`);
        console.log(`Invalid Rows: ${invalidRows}`);

        console.log('\n--- Duplicates ---');
        let duplicateCount = 0;
        for (const [mobile, count] of Object.entries(mobileCounts)) {
            if (count > 1) {
                console.log(`Mobile ${mobile}: ${count} times`);
                duplicateCount += (count - 1);
            }
        }
        console.log(`Total Extra Duplicates: ${duplicateCount}`);
        console.log(`Unique Mobiles: ${Object.keys(mobileCounts).length}`);

    } catch (err) {
        console.error("Error:", err);
    }
};

analyzeCSV();
