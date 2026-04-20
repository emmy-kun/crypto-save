const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* =========================
   CONNECT MONGODB
========================= */
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));
/* =========================
   MODEL
========================= */
const Portfolio = require("./models/Portfolio");

/* =========================
   INIT (FORCES SINGLE CLEAN DOC)
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
  } else {
    data.assets = data.assets || {};
    data.transactions = data.transactions || [];
    await data.save();
  }

  res.json(data);
});

/* =========================
   GET PORTFOLIO
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
   ADMIN UPDATE (FIXED)
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

  // ✅ UPDATE ASSETS
  if (assets) {
    data.assets = assets;
  }

  // ✅ ADD TRANSACTIONS (DO NOT OVERWRITE)
if (Array.isArray(transactions)) {
  transactions.forEach(newTx => {
    const index = data.transactions.findIndex(
      tx =>
        tx.date === newTx.date &&
        tx.amount === newTx.amount &&
        tx.type === newTx.type
    );

    if (index !== -1) {
      // ✅ UPDATE EXISTING TRANSACTION (change status)
      data.transactions[index].status = newTx.status;
    } else {
      // ✅ ADD NEW TRANSACTION
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
   TEMP RESET ROUTE
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