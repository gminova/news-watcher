let express = require("express"); // For route handlers and templates to serve up.
let path = require("path"); // Populating the path property of the request
let logger = require("morgan"); // HTTP request logging
let bodyParser = require("body-parser"); // Easy access to the HTTP request body
let cp = require("child_process"); // Forking a separate Node.js processes
let responseTime = require("response-time"); // For code timing checks for performance logging
let assert = require("assert"); // assert testing of values
let helmet = require("helmet"); // Helmet module for HTTP header hack mitigations
let RateLimit = require("express-rate-limit"); // IP based rate limiter
let csp = require("helmet-csp");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

let users = require("./routes/users");
let session = require("./routes/session");
let sharedNews = require("./routes/sharedNews");
let homeNews = require("./routes/homeNews");

let app = express();
app.enable("trust proxy"); // Since we are behind Nginx load balancing with Elastic Beanstalk

let limiter = new RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  delayMs: 0 // disable delaying - full speed until the max limit is reached
});
app.use(limiter);

app.use(helmet()); // Take the defaults to start with
app.use(
  csp({
    // Specify directives for content sources
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "ajax.googleapis.com",
        "maxcdn.bootstrapcdn.com"
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "maxcdn.bootstrapcdn.com"],
      fontSrc: ["'self'", "maxcdn.bootstrapcdn.com"],
      imgSrc: ["*"]
    }
  })
);

app.use(responseTime());

app.use(logger("dev"));

app.use(bodyParser.json({ limit: "100kb" }));

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.use(express.static(path.join(__dirname, "build")));

let node2 = cp.fork("./worker/app_FORK.js");
node2.on("exit", function(code) {
  console.log("Worker crashed and was restarted.", code);
  node2 = undefined;
  if (!server.testrun) node2 = cp.fork("./worker/app_FORK.js");
});

//
// MongoDB database connection initialization
//
let db = {};
let MongoClient = require("mongodb").MongoClient;

//Use connect method to connect to the Server
MongoClient.connect(
  process.env.MONGODB_CONNECT_URL,
  { useNewUrlParser: true },
  function(err, client) {
    assert.equal(null, err);
    db.client = client;
    db.collection = client.db("newswatcherdb").collection("newswatcher");
    console.log("Connected to MongoDB server");
  }
);

// If our process is shut down, close out the database connections gracefully
process.on("SIGINT", function() {
  console.log("MongoDB connection close on app termination");
  db.client.close();
  node2.kill();
  process.exit(0);
});

process.on("SIGUSR2", function() {
  console.log("MongoDB connection close on app restart");
  db.client.close();
  node2.kill();
  process.kill(process.pid, "SIGUSR2");
});

app.use(function(req, res, next) {
  req.db = db;
  req.node2 = node2;
  next();
});

app.use("/api/users", users);
app.use("/api/sessions", session);
app.use("/api/sharednews", sharedNews);
app.use("/api/homenews", homeNews);

app.use(function(req, res, next) {
  let err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// development error handler that will add in a stacktrace
if (app.get("env") === "development") {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500).json({ message: err.toString(), error: err });
    console.log(err);
  });
}

app.use(function(err, req, res, next) {
  console.log(err);
  res.status(err.status || 500).json({ message: err.toString(), error: {} });
});

app.set("port", process.env.PORT || 3000);

let server = app.listen(app.get("port"), function() {
  console.log("Express server listening on port " + server.address().port);
});

server.db = db;
server.node2 = node2;
module.exports = server;
