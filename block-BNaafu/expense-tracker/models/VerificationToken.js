var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require("bcrypt");
var User = require("./users");

var verificationTokenSchema = new Schema({
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    createdAt: { type: Date, expires: 3600, default: Date.now() }
});


var VerificationToken = mongoose.model("VerificationToken", verificationTokenSchema);
module.exports = VerificationToken;