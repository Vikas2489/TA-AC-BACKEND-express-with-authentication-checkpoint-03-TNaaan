var passport = require("passport");
var GithubStrategy = require("passport-github").Strategy;
var GoogleStrategy = require("passport-google-oauth2").Strategy;
const User = require("../models/users");

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_GOOGLE_ID,
    clientSecret: process.env.CLIENT_GOOGLE_KEY,
    callbackURL: '/auth/google/callback',
    passReqToCallback: true
}, (request, accessToken, refreshToken, profile, done) => {
    console.log(profile, "google user profile");
    let profileData = {
        name: profile._json.name,
        email: profile._json.email,
        isVerified: true
    };
    User.findOne({ email: profileData.email }, (err, user) => {
        if (err) return done(err);
        if (user) {
            done(null, user);
        }
        if (!user) {
            User.create(profileData, (err, user) => {
                if (err) return done(err);
                return done(null, user);
            });
        }
    });
}))

passport.use(new GithubStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: '/auth/github/callback'
}, (accessToken, refreshToken, profile, done) => {
    console.log(profile);
    let profileData = {
        name: profile._json.name,
        email: profile._json.email,
        isVerified: true,
    };
    User.findOne({ email: profileData.email }, (err, user) => {
        if (err) return done(err);
        if (user) {
            done(null, user);
        }
        if (!user) {
            User.create(profileData, (err, newUser) => {
                if (err) return done(err);
                return done(null, newUser);
            });
        }
    });
}));

passport.serializeUser((newUser, done) => {
    done(null, newUser.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        return done(err, user);
    });
});

module.exports = passport;