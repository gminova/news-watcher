"use strict";

let express = require("express");
let router = express.Router();

//Retrieve all top news, same for all users
router.get("/", function(req, res, next) {
  req.db.collection.findOne(
    { _id: process.env.GLOBAL_STORIES_ID },
    { homeNewsStories: 1 },
    function(err, doc) {
      if (err) return next(err);

      res.status(200).json(doc.homeNewsStories);
    }
  );
});

module.exports = router;
