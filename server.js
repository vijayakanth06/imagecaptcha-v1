const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;  // Use environment port for Vercel


app.use(express.json());
app.use(express.static('public'));

let requestCount = {};
const MAX_REQUESTS = 5;
const BLOCK_DURATION = 3 * 60 * 1000; // Block IP for 3 minutes

app.use((req, res, next) => {
    const ip = req.ip;

    if (requestCount[ip] && requestCount[ip].blocked) {
        if (Date.now() - requestCount[ip].blockedAt > BLOCK_DURATION) {
            // Unblock IP after the duration
            requestCount[ip].blocked = false;
            requestCount[ip].count = 1;  // Reset request count
        } else {
            return res.status(403).json({ message: 'Your IP is blocked. Try again later.' });
        }
    }

    if (!requestCount[ip]) {
        requestCount[ip] = { count: 1, blocked: false };
    } else {
        requestCount[ip].count++;
        if (requestCount[ip].count > MAX_REQUESTS) {
            requestCount[ip].blocked = true;
            requestCount[ip].blockedAt = Date.now();
            return res.status(403).json({ message: 'Too many requests. Your IP is blocked.' });
        }
    }

    next();
});

app.post('/send-data', (req, res) => {
    if (!req.body.cursorData) {
        console.error('No cursor data received.');
        return res.status(400).json({ message: 'No data received.' });
    }

    const cursorData = req.body.cursorData;
    const filePath = path.join(__dirname, 'data.csv');

    // Convert cursor data to CSV format
    const csvData = cursorData.map(item => `${item.x},${item.y},${item.speed}`).join('\n');
   
    console.log('Saving CSV file...');

    // Save cursor data to CSV file
    fs.writeFile(filePath, 'x,y,speed\n' + csvData, (err) => {
        if (err) {
            console.error('Error saving CSV:', err);
            return res.status(500).send('Error processing data');
        }

        // Execute the Python script
        exec(`python3 ${path.join(__dirname, 'predict_with_model.py')} ${filePath}`, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error executing script: ${stderr}`);
                return res.status(500).json({ message: 'Error processing data.' });
                window.location.reload();
            }
            console.log('Script output successful');
            const isBot = stdout.includes('Bot detected');
            if (isBot) {
                console.log('Bot detected');
                return res.status(403).json({ message: 'Bot detected. Please try again.' });
            } else {
                console.log('success');
                return res.status(200).json({ message: 'Data processed successfully.' });
            }
        });
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
