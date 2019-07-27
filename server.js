const express = require("express");
const app = express();

app.get("/", function(req, res) {
    console.log("Send message on get request");
    res.send("Testing express server!");
});

app.set("port", process.env.PORT || 3000);

let server = app.listen(app.get("port"), function() {
    console.log(`Express server listening on port: ${server.address().port}`);
});