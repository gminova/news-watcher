"use strict";

let express = require("express");
let joi = require("joi"); //for data validation
let authHelper = require("./authHelper");

let router = express.Router();

router.post("/", authHelper.checkAuth)

module.exports = router;
