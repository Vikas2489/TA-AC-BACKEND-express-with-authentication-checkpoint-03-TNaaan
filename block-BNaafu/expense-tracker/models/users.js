var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require("bcrypt");

var userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true, },
    password: { type: String, minlength: 5 },
    age: { type: Number, default: 18 },
    phone: { type: Number },
    country: { type: String },
    isVerified: { type: Boolean, default: false, required: true }
});

userSchema.pre('save', function(next) {
    if (this.password && this.isModified('password')) {
        bcrypt.hash(this.password, 8, (err, hashed) => {
            if (err) return next(err);
            console.log(this.password, "updating");
            this.password = hashed;
            next();
        });
    } else {
        next();
    }
});

userSchema.methods.verifyPassword = function(password, cb) {
    bcrypt.compare(password, this.password, (err, result) => {
        return cb(err, result);
    });
};

var User = mongoose.model("User", userSchema);
module.exports = User;