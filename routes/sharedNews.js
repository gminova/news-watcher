"use strict";

let express = require("express");
let joi = require("joi"); //for data validation
let authHelper = require("./authHelper");

let router = express.Router();

router.post("/", authHelper.checkAuth, function(req, res, next) {
  //validate the body
  let schema = {
    contentSnippet: joi
      .string()
      .max(200)
      .required(),
    date: joi.date().required(),
    hours: joi.string().max(20),
    imageUrl: joi
      .string()
      .max(300)
      .required(),
    keep: joi.boolean().required(),
    link: joi
      .string()
      .max(300)
      .required(),
    source: joi
      .string()
      .max(50)
      .required(),
    storyID: joi
      .string()
      .max(100)
      .required(),
    titile: joi
      .string()
      .max(200)
      .required()
  };

  joi.validate(req.body, schema, function(err) {
    if (err) return next(err);
    //First make sure we are not at the count limit
    req.body.collection.count({ type: "SHAREDSTORY_TYPE" }, function(
      err,
      count
    ) {
      if (err) return next(err);
      if (count > process.env.MAX_SHARED_STORIES)
        return next(new Error("Shared story limit reached"));

      //make sure the story was not already shared
      req.body.collection.count(
        { type: "SHAREDSTORY_TYPE", _id: req.body.storyID },
        function(err, count) {
          if (err) return next(err);
          if (count > 0) return next(new Error("Story was already shared"));

          //set id and guarantee uniqueness of failures
          let xrefStory = {
            _id: req.body.storyID,
            type: "SHAREDSTORY_TYPE",
            story: req.body,
            comments: [
              {
                displayName: req.auth.displayName,
                userId: req.auth.userId,
                dateTime: Date.now(),
                comment:
                  req.auth.displayName + "thought everyone might enjoy this!"
              }
            ]
          };

          req.body.collection.insertOne(xrefStory, function createUser(
            err,
            result
          ) {
            if (err) return next(err);

            res.status(201).json(result.ops[0]);
          });
        }
      );
    });
  });
});

router.get("/", authHelper.checkAuth, function(req, res, next) {
  req.body.collection
    .find({ type: "SHAREDSTORY_TYPE" })
    .toArray(function(err, docs) {
      if (err) return next(err);

      res.status(200).json(docs);
    });
});

module.exports = router;
