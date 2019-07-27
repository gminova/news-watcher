const express = require("express"); //route handlers
const path = require('path'); //populate path property of the address
const logger = require('morgan'); // http request logging
const bodyParser = require('body-parser'); // access to http request body
const cp = require('child_process'); //forking a separate node.js processes
const responseTime = require('response-time'); // performance logging
const assert = require('assert'); // assert tesing of values
const helmet = require('helmet'); //security measures
const RateLimit = require('express-rate-limit'); //IP based rate limiter
const csp = require('helmet-csp'); 

const app = express();

app.get("/", function(req, res) {
    console.log("Send message on get request");
    res.send("Testing express server!");
});

app.set("port", process.env.PORT || 3000);

let server = app.listen(app.get("port"), function() {
    console.log(`Express server listening on port: ${server.address().port}`);
});