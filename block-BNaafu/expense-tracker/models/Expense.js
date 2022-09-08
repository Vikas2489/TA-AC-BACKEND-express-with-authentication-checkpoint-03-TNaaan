var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var User = require("./users");

var expenseSchema = new Schema({
    category: { type: [String], required: true },
    amount: { type: Number, required: true },
    date: { type: Date },
    userId: { type: Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

var Expense = mongoose.model("Expense", expenseSchema);

module.exports = Expense;