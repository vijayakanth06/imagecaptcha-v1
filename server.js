const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const app = express();
const port = 3000;  // Port for the Express server

// Middleware for parsing JSON request bodies
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
    const honeypotValue = req.body.honeypot;
    
    // Check honeypot field
    if (honeypotValue) {
        return res.json({ message: 'Bot detected' });
    }

    const csvData = cursorData.map(item => `${item.x},${item.y},${item.speed}`).join('\n');
    
    const fs = require('fs');
    fs.writeFileSync('data.csv', csvData);

    exec('python3 predict_with_model.py', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing Python script: ${error}`);
            return res.status(500).json({ message: 'Server error' });
        }

        console.log('Script output successful');
        const isBot = stdout.includes('Bot detected');
        if (isBot) {console.log('Bot detected');
            return res.json({ message: 'Bot detected' });
        }
        console.log('success');
        return res.json({ message: 'Data processed successfully.' });
    });
});

app.listen(port, () => {
    console.log(`Server running at https://localhost:${port}`);
});
