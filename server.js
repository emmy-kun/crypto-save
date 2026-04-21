const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* =========================
   MONGODB CONNECTION
========================= */
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in environment variables");
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB error:", err));

/* =========================
   MODEL
========================= */
const Portfolio = require("./models/portfolio");

/* =========================
   INIT (ENSURES DATA EXISTS)
========================= */
app.get("/init", async (req, res) => {
  let data = await Portfolio.findOne();

  if (!data) {
    data = await Portfolio.create({
      assets: {
        bitcoin: 0.02,
        ethereum: 1,
        usdt: 500,
        solana: 5
      },
      transactions: []
    });
  }

  res.json(data);
});

/* =========================
   GET PORTFOLIO DATA
========================= */
app.get("/portfolio", async (req, res) => {
  const data = await Portfolio.findOne().sort({ _id: -1 });

  if (!data) {
    return res.json({
      assets: {},
      transactions: []
    });
  }

  res.json(data);
});

/* =========================
   ADMIN UPDATE (INCREMENTAL FIX)
========================= */
app.post("/admin/update", async (req, res) => {
  const { assets, transactions } = req.body || {};

  let data = await Portfolio.findOne().sort({ _id: -1 });

  if (!data) {
    data = await Portfolio.create({
      assets: {},
      transactions: []
    });
  }

  // ensure structure
  data.assets = data.assets || {};
  data.transactions = data.transactions || [];

  // ✅ INCREMENT ASSETS (NO MORE OVERWRITE)
  if (assets) {
    data.assets.bitcoin = (data.assets.bitcoin || 0) + (assets.bitcoin || 0);
    data.assets.ethereum = (data.assets.ethereum || 0) + (assets.ethereum || 0);
    data.assets.usdt = (data.assets.usdt || 0) + (assets.usdt || 0);
    data.assets.solana = (data.assets.solana || 0) + (assets.solana || 0);
  }

  // ✅ ADD OR UPDATE TRANSACTIONS
  if (Array.isArray(transactions)) {
    transactions.forEach(newTx => {
      const index = data.transactions.findIndex(
        tx =>
          tx.date === newTx.date &&
          tx.amount === newTx.amount &&
          tx.type === newTx.type
      );

      if (index !== -1) {
        data.transactions[index].status = newTx.status;
      } else {
        data.transactions.push(newTx);
      }
    });
  }

  await data.save();

  res.json({
    message: "updated",
    data
  });
});

/* =========================
   RESET DATABASE (DEV ONLY)
========================= */
app.get("/reset", async (req, res) => {
  await Portfolio.deleteMany({});
  res.send("Database cleared");
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});