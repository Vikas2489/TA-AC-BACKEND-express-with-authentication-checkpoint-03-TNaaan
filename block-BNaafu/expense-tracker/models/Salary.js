var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var User = require("./users");

var salarySchema = new Schema({
    source: { type: [String], required: true },
    amount: { type: Number, required: true },
    date: { type: Date },
    userId: { type: Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

var Salary = mongoose.model("Salary", salarySchema);

module.exports = Salary;