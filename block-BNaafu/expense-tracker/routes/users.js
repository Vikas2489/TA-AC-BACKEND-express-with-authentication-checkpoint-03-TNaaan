var express = require('express');
const Salary = require('../models/Salary');
const User = require('../models/users');
const Expense = require('../models/Expense');
var router = express.Router();
var auth = require("../middlewares/auth");
var VerificationToken = require("../models/VerificationToken");
var mail = require("../utils/mail");
var sgmail = require("@sendgrid/mail");
const moment = require('moment');

// register form 
router.get("/register", (req, res, next) => {
    return res.render("usersRegister", { error: req.flash('error')[0] });
});

// post register form 
router.post("/", (req, res, next) => {
    User.create(req.body, (err, user) => {
        if (err) {
            if (err.code === 11000) {
                req.flash("error", "Email already registered");
                return res.redirect("/users/register");
            }
            if (err.name === "ValidationError") {
                req.flash("error", "Password Must be longer than 5 in length");
                return res.redirect("/users/register");
            }
            return res.json({ err });
        }
        VerificationToken.create({ owner: user._id, token: mail.generateOtp() }, (err, newToken) => {
            if (err) return next(err);
            console.log(err, "ERROR");

            // send verify link to user
            sgmail.setApiKey('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');
            let msg = {
                to: user.email,
                from: 'homosapien2489@gmail.com',
                subject: "Verify Your Email Account To Access Expense-tracker",
                html: `<a href = "http://localhost:3000/verify/${newToken.owner}/${newToken.token}"> Verify Your Email By Clicking Here On This Button </a>`
            };
            sgmail.send(msg, (err, info) => {
                if (err) {
                    console.log("mail not sent");
                } else {
                    console.log("mail  sent");
                }
            })
            return res.status(200).send("An Email sent to your account please verify");

        });
    })
});

// show login form
router.get("/login", (req, res, next) => {
    return res.render("usersLogin.ejs", { error: req.flash('error')[0] });
});

// post login form
router.post("/login", (req, res, next) => {
    let { email, password } = req.body;
    if (!email || !password) {
        req.flash('error', "Email/Password required");
        return res.redirect("/users/login");
    }
    User.findOne({ email }, (err, user) => {
        if (err) return next(err);
        if (user) {
            if (user.isVerified) {
                return user.verifyPassword(password, (err, result) => {
                    if (err) return next(err);
                    if (!result) {
                        req.flash('error', "Password is incorrect");
                        return res.redirect("/users/login")
                    } else {
                        req.session.userId = user.id;
                        return res.redirect("/users/dashboard");
                    }
                });
            } else {
                VerificationToken.create({ owner: user.id, token: mail.generateOtp() }, (err, newToken) => {
                    if (err) return next(err);
                    mail.mailTransport().sendMail({
                        from: "emailverification@email.com",
                        to: user.email,
                        subject: "Verify your email account",
                        html: `<a href="http://localhost:3000/verify/${newToken.owner}/${newToken.token}">Verify Your Email By Clicking Here On This Button</a>`
                    });
                    req.flash('error', "Email was not verified, so we have sent an link to your mail to verify your email.");
                    return res.redirect("/users/login");
                })

            }
        }
        if (!user) {
            req.flash('error', "Email not registered");
            return res.redirect("/users/login");
        }
    });
});

// logout
router.get("/logout", (req, res, next) => {
    res.clearCookie('connect-sid');
    req.session.destroy();
    return res.redirect("/users/login");
});

// get salary form after successfull registeration
router.get("/salary", auth.userLoggedInOrNot, (req, res) => {
    return res.render("user_salary_form");
});

// post salary form
router.post("/salary", auth.userLoggedInOrNot, (req, res, next) => {
    req.body.source = req.body.source.trim().split(/[,\s/]+/);
    req.body.userId = req.session.userId || req.session.passport.user;
    Salary.create(req.body, (err, salary) => {
        if (err) return next(err);
        return res.redirect("/users/expenseForm");
    });
});

// show expense form
router.get("/expenseForm", auth.userLoggedInOrNot, (req, res, next) => {
    return res.render("user_expense_form");
});

// post expense form
router.post("/expenseForm", auth.userLoggedInOrNot, (req, res, next) => {
    req.body.category = req.body.category.trim().split(/[,\s/]+/);
    req.body.userId = req.session.userId || req.session.passport.user;
    Expense.create(req.body, (err, expense) => {
        if (err) return next(err);
        return res.redirect("/users/dashboard");
    });
});

// reset password
router.get("/password/edit", (req, res, next) => {
    return res.render("resetPasswordform", { error: req.flash('error')[0], update_password: req.flash('update_password')[0] });
});

// post to update your password
router.post("/password", (req, res, next) => {
    let userId = req.session.userId;
    console.log(req.body);
    let old_password = req.body.old_password;
    let new_password = req.body.new_password;
    let confirm_password = req.body.confirm_password;
    if (!old_password || !new_password || !confirm_password) {
        req.flash('error', "All fields are required to reset your password.");
        return res.redirect('/users/password/edit');
    } else {
        User.findById(userId, (err, user) => {
            user.verifyPassword(old_password, (err, result) => {
                if (err) return next(err);
                if (result) {
                    if (new_password == confirm_password) {
                        user.password = confirm_password;
                        user.save((err, user) => {
                            if (err) return next(err);
                            req.flash('update_password', "Update Password successfully");
                            return res.redirect("/users/password/edit");
                        });
                    } else if (new_password != confirm_password) {
                        req.flash('error', "New password should match confirm password");
                        return res.redirect("/users/password/edit");
                    }
                } else if (!result) {
                    req.flash('error', "Old password is incorrect!");
                    return res.redirect("/users/password/edit");
                }

            })
        })

    }
});

// dashboard 
router.get("/dashboard", auth.fetchSources, auth.fetchCategories, (req, res, next) => {
    let userId = req.session.userId || req.user.id;
    let { source, start_date, end_date, category, monthName, year } = req.query;
    let date = new Date();
    let month = date.getMonth() + 1;
    let currentMonthExpense, currentMonthSalary;
    let salaryQuery = {};
    let expenseQuery = {};

    // showing current month salaries and expenses
    if (source || start_date || end_date || category) {
        if (req.query.source) {
            salaryQuery.source = req.query.source;
        }
        if (req.query.category) {
            expenseQuery.category = req.query.category;
        }
        if (req.query.start_date) {
            start_date = moment(req.query.start_date);
            salaryQuery.start_date = start_date.toISOString();
            expenseQuery.start_date = start_date.toISOString();
        }
        if (req.query.end_date) {
            end_date = moment(req.query.end_date);
            salaryQuery.end_date = end_date.toISOString();
            expenseQuery.end_date = end_date.toISOString();
        }
        console.log(salaryQuery, "salaryQuery", expenseQuery, "expenseQuery");
        // finding salary and expense according to the search
        Salary.find({ source: salaryQuery.source, date: { $gte: salaryQuery.start_date, $lte: salaryQuery.end_date } }, (err, salaries) => {
            if (err) return next(err);
            Expense.find({ category: expenseQuery.category, date: { $gte: expenseQuery.start_date, $lte: expenseQuery.end_date } }, (err, expenses) => {
                if (err) return next(err);
                return res.render("userDashboard", { salaries, expenses });
            });
        })
    } else if (monthName || year) {
        let monthsNameArr = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
        let indexOfMonth = monthsNameArr.indexOf(monthName) + 1;
        console.log(monthName, typeof year);
        Salary.find({ userId }, (err, salaries) => {
            if (err) return next(err);
            salaries = salaries.filter(salary => {
                if (moment(salary.date).year() == year && moment(salary.date).month() + 1 == indexOfMonth) {
                    return salary;
                }
            });
            Expense.find({ userId }, (err, expenses) => {
                if (err) return next(err);
                expenses = expenses.filter(expense => {
                    if (moment(expense.date).year() == year && moment(expense.date).month() + 1 == indexOfMonth) {
                        return expense;
                    }
                });
                return res.render("userDashboard", { salaries, expenses });
            })
        })
    } else {
        Salary.find({ userId }, (err, salaries) => {
            if (err) return next(err);
            currentMonthSalary = salaries.filter((salary) => {
                var salaryMonth = moment(salary.date).month() + 1;
                return salaryMonth === month;
            });
            Expense.find({ userId }, (err, expenses) => {
                if (err) return next(err);
                currentMonthExpense = expenses.filter((expense) => {
                    var expenseMonth = moment(expense.date).month() + 1;
                    return expenseMonth === month;
                });
                return res.render('userDashboard', { salaries: currentMonthSalary, expenses: currentMonthExpense });
            });
        });
    }


});

module.exports = router;