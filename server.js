const express = require('express');
const { exec } = require('child_process');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware for parsing JSON request bodies
app.use(express.json());
app.use(express.static('public'));

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many attempts from this IP, please try again after 5 minutes.',
});

app.use(limiter);

app.post('/send-data', (req, res) => {
    if (!req.body.cursorData) {
        return res.status(400).json({ message: 'No data received.' });
    }

    const cursorData = req.body.cursorData;
    const csvFilePath = path.join(__dirname, 'cursorData.csv');

    // Convert cursor data to CSV format
    const csvData = cursorData.map(item => `${item.x},${item.y}`).join('\n');
    const csvHeader = 'x,y\n'; // Add headers if needed

    // Save cursor data to CSV file
    fs.writeFile(csvFilePath, csvHeader + csvData, (err) => {
        if (err) {
            console.error(`Error saving file: ${err}`);
            return res.status(500).json({ message: 'Error saving data.' });
        }

        // Execute the Python script
        const scriptPath = path.join(__dirname, 'predict_with_model.py');
        exec(`python3 ${scriptPath} ${csvFilePath}`, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error executing script: ${stderr}`);
                return res.status(500).json({ message: 'Error processing data.' });
            }

            const isBot = stdout.includes('Bot detected');
            if (isBot) {
                return res.status(403).json({ message: 'Bot detected. Please try again.' });
            } else {
                res.json({ redirect: 'target.html' });
            }
        });
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
