const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));
app.use(cors());

let requestCount = {};
const MAX_REQUESTS = 5;
const BLOCK_DURATION = 3 * 60 * 1000; // Block IP for 3 minutes

function rateLimit(req, res, next) {
    const ip = req.ip;
    const now = Date.now();
    if (!requestCount[ip]) {
        requestCount[ip] = { count: 1, firstRequestTime: now };
    } else {
        requestCount[ip].count++;
        if (requestCount[ip].count > MAX_REQUESTS && now - requestCount[ip].firstRequestTime < BLOCK_DURATION) {
            return res.status(429).json({ message: 'Too many requests, please try again later.' });
        }
        if (now - requestCount[ip].firstRequestTime > BLOCK_DURATION) {
            requestCount[ip] = { count: 1, firstRequestTime: now };
        }
    }
    next();
}

app.post('/send-data', rateLimit, (req, res) => {
    const cursorData = req.body.cursorData;

    if (!cursorData) {
        return res.status(400).json({ message: 'No data received.' });
    }

    const filePath = path.join(__dirname, 'data.csv');
    const csvData = cursorData.map(item => `${item.x},${item.y},${item.speed}`).join('\n');

    fs.writeFile(filePath, 'x,y,speed\n' + csvData, (err) => {
        if (err) {
            console.error('Error saving CSV:', err);
            return res.status(500).json({ message: 'Error processing data' });
        }

        exec(`python3 server/predict_with_model.py ${filePath}`, (err, stdout, stderr) => {
            if (err) {
                console.error('Error executing script:', stderr);
                return res.status(500).json({ message: 'Error processing data' });
            }

            const isBot = stdout.includes('Bot detected');
            if (isBot) {
                return res.status(403).json({ message: 'Bot detected. Please try again.' });
            } else {
                return res.status(200).json({ message: 'Data processed successfully.' });
            }
        });
    });
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
