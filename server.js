//server modules
const express = require("express"); //route handlers
const path = require('path'); //populate path property of the address

//middleware modules
const logger = require('morgan'); // http request logging
const bodyParser = require('body-parser'); // access to http request body
const cp = require('child_process'); //forking a separate node.js processes
const responseTime = require('response-time'); // performance logging
const assert = require('assert'); // assert tesing of values
const helmet = require('helmet'); //security measures
const RateLimit = require('express-rate-limit'); //IP based rate limiter
const csp = require('helmet-csp'); 

if(process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

//route handlers
const users = require('./routes/users');
const session = require('./routes/session');
const sharedNews = require('./routes/sharedNews');
const homeNews = require('./routes/homeNews');

const app = express();
app.enable('trust proxy'); //enables to use actual IP address in the header requests

//apply limits to all requests
const limiter = new RateLimit({
    windowMs = 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    delayMs: 0 // disable delaying - full speed until max limit
});
app.use(limiter);

app.use(helmet()); // take defaults to start with
app.use(csp({
    // specify directives for content sources
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'ajax-googleapis.com', 'maxcdn.bootstrapcdn.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'maxcdn.bootstrapcdn.com'],
        fontSrc: ["'self'", 'maxcdn.bootstrapcdn.com'],
        imgSrc: ['*']
    }
}));
app.get("/", function(req, res) {
    console.log("Send message on get request");
    res.send("Testing express server!");
});

app.set("port", process.env.PORT || 3000);

let server = app.listen(app.get("port"), function() {
    console.log(`Express server listening on port: ${server.address().port}`);
});