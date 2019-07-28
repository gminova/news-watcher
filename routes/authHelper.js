//a module to inject middleware which validates the request header user token

"use strict"
const jwt = require('jwt-simple');

//check for a token in the customer header setting and verify that it is signed and has not been
//tampered with.
//if no header token is present, throw error

module.exports.checkAuth = function (req, res, next) {
    if(req.headers['x-auth']) {
        try {
            req.auth = jwt.decode(req.headers['x-auth'], process.env.JWT_SECRET);
            if(req.auth && req.auth.authorized && req.auth.userId) {
                return next();
            } else {
                return next(new Error('User is not logged in.'));
            }
        } catch (err) {
            return next(err);
        }
    } else {
        return next(new Error('User is not logged in.'));
    }
};