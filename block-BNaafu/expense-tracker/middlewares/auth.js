var express = require("express");
var Salary = require("../models/Salary");
var Expense = require("../models/Expense");
var User = require("../models/users");

module.exports = {
    userLoggedInOrNot: (req, res, next) => {
        if (req.session.userId || req.user) {
            next();
        } else {
            req.flash('error', "Login first to access");
            return res.redirect("/users/login");
        }
    },
    userInfo: (req, res, next) => {
        if (req.session.userId) {
            let userId = req.session.userId;
            User.findById(userId, (err, user) => {
                res.locals.user = user;
                req.user = user;
                return next();
            });
        } else if (req.user) {
            let userId = req.user._id;
            User.findById(userId, (err, user) => {
                res.locals.user = user;
                return next();
            });
        } else {
            res.locals.user = null;
            req.user = null;
            return next();
        }
    },
    fetchSources: (req, res, next) => {
        if (req.session.userId || req.user._id) {
            var userId = req.session.userId || req.user._id;
            Salary.find({ userId }).distinct('source', (err, sources) => {
                if (err) return next(err);
                res.locals.sources = sources;
                next();
            })
        } else {
            res.locals.sources = null;
            next();
        }
    },
    fetchCategories: (req, res, next) => {
        if (req.session.userId || req.user._id) {
            var userId = req.session.userId || req.user._id;
            Expense.find({ userId }).distinct("category", (err, allCategories) => {
                if (err) return next(err);
                res.locals.allCategories = allCategories;
                next();
            });
        } else {
            res.locals.allCategories = null;
            next();
        }
    }
}