var express = require('express');
var router = express.Router();
var passport = require("passport");
const User = require('../models/users');
const VerificationToken = require('../models/VerificationToken');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

// github login request
router.get("/auth/github", passport.authenticate('github'));

// callback while logging in using github
router.get("/auth/github/callback", passport.authenticate('github', { failureRedirect: "/users/login" }), (req, res, next) => {
    return res.redirect("/users/dashboard");
});

// google login request
router.get("/auth/google", passport.authenticate('google', {
    scope: ['email', 'profile']
}));

// callback while lgging in using google
router.get("/auth/google/callback", passport.authenticate('google', {
    successRedirect: '/users/dashboard',
    failureRedirect: '/users/login'
}));

// verifcation for email changing the user isVerified into true
router.get("/verify/:userId/:token", (req, res, next) => {
    let userId = req.params.userId;
    let token = req.params.token;
    console.log(userId, token);
    User.findByIdAndUpdate(userId, { isVerified: true }, (err, updatedUser) => {
        if (err) return next(err);
        VerificationToken.findOneAndDelete({ token }, (err, deletedVerificationtoken) => {
            if (err) return next(err);
            req.session.userId = updatedUser.id;
            return res.redirect("/users/salary");
        });
    });
});

module.exports = router;