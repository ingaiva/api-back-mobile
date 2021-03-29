const mongoose = require("mongoose");
const LocationSchema = new mongoose.Schema({
    type:String,
    coordinates:[], 
    info:String,   
});
const TransactionSchema = new mongoose.Schema({  
    userId: String,
    location: LocationSchema,
    action: String,
    type: String,
    currency: String,
    amount: Number,
    createdAt: Date,  
    updatedAt: Date,  
});
const Transaction = mongoose.model("Transaction", TransactionSchema);

module.exports = Transaction;
