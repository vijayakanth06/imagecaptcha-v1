const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// In-memory request count for rate-limiting
let requestCount = {};
const MAX_REQUESTS = 5;
const BLOCK_DURATION = 3 * 60 * 1000; // Block IP for 3 minutes

// Handler for the serverless function
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Rate limiting logic
    if (requestCount[ip] && requestCount[ip].blocked) {
      if (Date.now() - requestCount[ip].blockedAt > BLOCK_DURATION) {
        // Unblock IP after the block duration
        requestCount[ip].blocked = false;
        requestCount[ip].count = 1; // Reset request count
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

    // Check if cursor data is provided
    if (!req.body.cursorData) {
      return res.status(400).json({ message: 'No cursor data received.' });
    }

    const cursorData = req.body.cursorData;
    const filePath = path.join('/tmp', 'data.csv'); // Use '/tmp' for serverless

    // Convert cursor data to CSV format
    const csvData = cursorData.map(item => `${item.x},${item.y},${item.speed}`).join('\n');

    // Save CSV file to a temporary directory
    fs.writeFileSync(filePath, 'x,y,speed\n' + csvData);

    // Execute Python script
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    exec(`${pythonCommand} ${path.join(__dirname, 'predict_with_model.py')} ${filePath}`, (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({ message: 'Error processing data.' });
      }

      const isBot = stdout.includes('Bot detected');
      if (isBot) {
        return res.status(403).json({ message: 'Bot detected. Please try again.' });
      } else {
        return res.status(200).json({ message: 'Data processed successfully.' });
      }
    });
  } else {
    // Handle non-POST methods
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}


/* const express = require('express');
const { exec } = require('child_process');
const cors= require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static('public'));
app.use(cors());

let requestCount = {};
const MAX_REQUESTS = 5;
const BLOCK_DURATION = 3 * 60 * 1000; // Block IP for 3 minutes

// Middleware to handle IP-based rate limiting
app.use((req, res, next) => {
    const ip = req.ip;

    if (requestCount[ip] && requestCount[ip].blocked) {
        if (Date.now() - requestCount[ip].blockedAt > BLOCK_DURATION) {
            // Unblock IP after the duration
            requestCount[ip].blocked = false;
            requestCount[ip].count = 1; // Reset request count
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

// Route to handle cursor data processing
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
        const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
        exec(`${pythonCommand} ${path.join(__dirname, 'predict_with_model.py')} ${filePath}`, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error executing script: ${stderr}`);
                return res.status(500).json({ message: 'Error processing data.' });
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
 */