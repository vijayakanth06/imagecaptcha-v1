const express = require('express');
const app = express();
const port = 3000;

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const ipBlockList = new Set();
const blockDuration = 5 * 60 * 1000; // 5 minutes in milliseconds

const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // limit each IP to 5 requests per windowMs
    onLimitReached: (req, res) => {
        const ip = req.ip;
        ipBlockList.add(ip);
        setTimeout(() => ipBlockList.delete(ip), blockDuration);
        res.status(429).send('Too many requests, please try again later.');
    },
});

app.use(helmet());
app.use(limiter);

app.use((req, res, next) => {
    if (ipBlockList.has(req.ip)) {
        res.status(403).send('Your IP is temporarily blocked.');
    } else {
        next();
    }
});

app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
