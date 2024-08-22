const express = require('express');
const { exec } = require('child_process');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;  // Port for the Express server

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
            res.status(500).send('Error processing data');
            return;
        }

      

        // Execute the Python script
        
        exec(`python3 ${path.join(__dirname, 'predict_with_model.py')} ${filePath}`, (error, stdout, stderr) => {
            if (err) {
                console.error(`Error executing script: ${stderr}`);
                return res.status(500).json({ message: 'Error processing data.' });
            }

            console.log('Python script output:', stdout);

            const isBot = stdout.includes('Bot detected');
            if (isBot) {
                return res.status(403).json({ message: 'Bot detected. Please try again.' });
            } else {
                res.json({ redirect: 'target.html' });
            }
        });
    });
});


app.use((req, res, next) => {
    const clientIp = req.ip;
    const currentTime = Date.now();
    const timeSinceLastRequest = currentTime - (requestTimestamps[clientIp] || 0);

    if (timeSinceLastRequest < 5000) {  // Block requests within 5 seconds from the same IP
        res.status(429).send('Too many requests - please wait a moment.');
    } else {
        requestTimestamps[clientIp] = currentTime;
        next();
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
