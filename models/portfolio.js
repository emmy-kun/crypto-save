const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  date: String,
  type: String,
  amount: Number,
  status: String
});

const portfolioSchema = new mongoose.Schema({
  assets: {
    bitcoin: { type: Number, default: 0 },
    ethereum: { type: Number, default: 0 },
    usdt: { type: Number, default: 0 },
    solana: { type: Number, default: 0 }
  },

  transactions: [transactionSchema]
});

module.exports = mongoose.model("Portfolio", portfolioSchema);