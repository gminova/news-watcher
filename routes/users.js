"use strict";

const express = require("express");
const bycript = require("bcryptjs");
const async = require("async");
const joi = require("joi");
const authHelper = require("./authHelper");
const ObjectId = require("mongodb").ObjectID;

const router = express.Router();

router.post("/", function postUser(req, res, next) {
  //Password must be 7-15 characters in length and contain at least one numeric digit and a special character
  let schema = {
    displayName: joi
      .string()
      .alphanum()
      .min(3)
      .max(50)
      .required(),
    email: joi
      .string()
      .email()
      .min(7)
      .max(50)
      .required(),
    password: joi
      .string()
      .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7, 15}$/)
      .required()
  };

  joi.validate(req.body, schema, function(err, value) {
    if (err)
      return next(
        new Error(
          "Invalid field: display name 3 - 50 alphanumeric, valid email, password 7 - 15 (one number, one special character)"
        )
      );

    req.body.collection.findOne(
      { type: "USER_TYPE", email: req.body.email },
      function(err, doc) {
        if (err) return next(err);

        if (doc) return next(new Error("Email account already registered"));

        let xferUser = {
          type: "USER_TYPE",
          displayName: req.body.displayName,
          email: req.body.email,
          passwordHash: null,
          date: Date.now(),
          completed: false,
          settings: {
            requireWIFI: true,
            enableAlerts: false
          },
          newsFilters: [
            {
              name: "Technology Companies",
              keyWords: [
                "Apple",
                "Microsoft",
                "IBM",
                "Amazon",
                "Google",
                "Intel"
              ],
              enableAlert: false,
              alertFrequency: 0,
              enableAutoDelete: false,
              deleteTime: 0,
              newsStories: []
            }
          ],
          savedStories: []
        };

        bcrypt.hash(req.body.password, 10, function getHash(err, hash) {
          if (err) return next(err);
          req.node2.send({ msg: "REFRESH_STORIES", doc: result.ops[0] });
          res.status(201).json(result.ops[0]);
        });
      }
    );
  });
});

module.exports = router;
