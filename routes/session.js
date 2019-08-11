//A module for session login and logout
"use strict";
const express = require("express");
const bcrypt = require("bcryptjs"); //for password hash comparing
const jwt = require("jwt-simple"); //for token authentication
const joi = require("joi"); //for data validation
const authHelper = require("./authHelper");

const router = express.Router();

//create security token as the user logs in that can be passed to the client and
//used on subsequent calls.
//the user email and password are sent in the body of the request

router.post("/", function postSession(req, res, next) {
  //password must be between 7 and 15 characters in length
  //and contain at least one numeric digit and a speial character
  let schema = {
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

  joi.validate(req.body, schema, function(err) {
    if (err)
      return next(
        new Error(
          "Invalid field: password 7 to 15 (one number, one special character)"
        )
      );

    req.body.collection.findOne(
      { type: "USER_TYPE", email: req.body.email },
      function(err, user) {
        if (err) return next(err);

        if (!user) return next(new Error("User was not found."));

        bcrypt.compare(
          req.body.password,
          user.passwordHash,
          function comparePassword(err, match) {
            if (match) {
              try {
                const token = jwt.encode(
                  {
                    authorized: true,
                    sessionIP: req.ip,
                    sessionUA: req.headers["user-agent"],
                    userId: user._id.toHexString(),
                    displayName: user.displayName
                  },
                  process.env.JWT_SECRET
                );
                res
                  .status(201)
                  .json({
                    displayName: user.displayName,
                    userId: user._id.toHexString(),
                    token: token,
                    msg: "Authorized"
                  });
              } catch (err) {
                return next(err);
              }
            } else {
              return next(new Error("Wrong password"));
            }
          }
        );
      }
    );
  });
});

//delete token as user logs out

router.delete('/:id', authHelper.checkAuth, function(req, res, next) {
    //verify the passed in id is the same as that in the auth token
    if (req.params.id != req.auth.userId)
    return next(new Error('Invalid request for logout'));

    res.status(200).json({ msg: 'Logged out' });
});

module.exports =router;