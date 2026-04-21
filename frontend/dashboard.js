/* =========================
   AUTH CHECK
========================= */
if (!localStorage.getItem("user")) {
    window.location.href = "index.html";
}

let depositAddresses = {};

/* =========================
   LOAD DEPOSIT ADDRESSES
========================= */
async function loadDepositAddresses() {
  try {
    const res = await fetch("https://crypto-save-production.up.railway.app/api/deposit-addresses");
    depositAddresses = await res.json();
  } catch (err) {
    console.log("Failed to load deposit addresses", err);
  }
}

/* =========================
   UPDATE ADDRESS DISPLAY
========================= */
function updateDepositAddress() {
  const coin = document.getElementById("depositCoin")?.value;
  const el = document.getElementById("depositWalletAddress");

  if (!el) return;

  el.innerText = depositAddresses[coin] || "Address not available";
}

/* =========================
   COPY ADDRESS (PROFESSIONAL)
========================= */
function copyDepositAddress() {
  const el = document.getElementById("depositWalletAddress");

  if (!el) return;

  navigator.clipboard.writeText(el.innerText);
  showToast("Address copied");
}

async function loadDepositAddresses() {
  try {
    const res = await fetch("https://crypto-save-production.up.railway.app/api/deposit-addresses");
    depositAddresses = await res.json();
  } catch (err) {
    console.log("Failed to load deposit addresses", err);
  }
}

/* =========================
   STATE
========================= */
let hidden = localStorage.getItem("hideBalance") === "true";

/* =========================
   DOM READY
========================= */
document.addEventListener("DOMContentLoaded", () => {

    const nav = document.getElementById("nav-dashboard");
    if (nav) nav.classList.add("nav-active");

    setupGreeting();
    setupBalanceToggle();
    loadPortfolio();
    loadDepositAddresses(); // 🔥 ADD THIS

    setInterval(loadPortfolio, 5000);
});

/* =========================
   GREETING
========================= */
function setupGreeting() {
    const user = localStorage.getItem("user");
    const el = document.getElementById("userGreeting");

    if (!user || !el) return;

    const name = user.charAt(0).toUpperCase() + user.slice(1);
    el.innerHTML = `Welcome back, <strong>${name}</strong>`;
}


/* =========================
   PORTFOLIO LOADER
========================= */
async function loadPortfolio() {
    try {
        const res = await fetch("https://crypto-save-production.up.railway.app/portfolio");
        const data = await res.json();

        const assetsDiv = document.getElementById("assets");
        const txTable = document.getElementById("transactions");
        const totalEl = document.getElementById("total");

        if (!assetsDiv || !txTable || !totalEl) return;

        assetsDiv.innerHTML = "";
        txTable.innerHTML = "";

        let total = 0;

        const prices = {
            bitcoin: 65000,
            ethereum: 3500,
            usdt: 1,
            solana: 150
        };

        const logos = {
            bitcoin: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
            ethereum: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
            usdt: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
            solana: "https://assets.coingecko.com/coins/images/4128/large/solana.png"
        };

        /* =========================
           ASSETS
        ========================== */
        if (data.assets) {
            for (let key in data.assets) {
                const amount = data.assets[key];
                const value = amount * (prices[key] || 1);

                total += value;

                const card = document.createElement("div");
                card.className = "asset-card-clean";

                card.innerHTML = `
                    <div class="asset-left">
                        <img src="${logos[key]}" class="coin-logo"/>
                        <div>
                            <h4>${key.toUpperCase()}</h4>
                            <small>${amount}</small>
                        </div>
                    </div>
                    <div class="asset-right">
                        <strong>$${value.toFixed(2)}</strong>
                    </div>
                `;

                assetsDiv.appendChild(card);
            }
        }

        /* =========================
           TOTAL BALANCE
        ========================== */
        if (hidden) {
            totalEl.innerText = "****";
        } else {
            animateValue(totalEl, total);
        }

        /* =========================
           TRANSACTIONS
        ========================== */
        const recent = (data.transactions || []).reverse();

        recent.forEach(tx => {
            const row = document.createElement("tr");

            const statusClass =
                tx.status === "Completed"
                    ? "status-complete"
                    : "status-pending";

            row.innerHTML = `
                <td>${tx.date || "-"}</td>
                <td>${tx.type || "-"}</td>
                <td>$${tx.amount || 0}</td>
                <td><span class="${statusClass}">${tx.status || "-"}</span></td>
            `;

            txTable.appendChild(row);
        });

    } catch (err) {
        console.log("Error loading portfolio:", err);
    }
}


/* =========================
   BALANCE TOGGLE (EYE)
========================= */
function setupBalanceToggle() {
    const toggleBtn = document.getElementById("toggleBalance");
    const totalEl = document.getElementById("total");
    const eyeOpen = document.getElementById("eyeOpen");
    const eyeClosed = document.getElementById("eyeClosed");

    if (!toggleBtn || !totalEl || !eyeOpen || !eyeClosed) return;

    function updateUI() {
        if (hidden) {
            totalEl.innerText = "****";
            eyeOpen.style.display = "none";
            eyeClosed.style.display = "inline";
        } else {
            eyeOpen.style.display = "inline";
            eyeClosed.style.display = "none";
            loadPortfolio();
        }
    }

    toggleBtn.addEventListener("click", () => {
        hidden = !hidden;
        localStorage.setItem("hideBalance", hidden);
        updateUI();
    });

    updateUI();
}


/* =========================
   ANIMATION
========================= */
function animateValue(el, newValue) {
    let start = parseFloat(el.innerText.replace("$", "")) || 0;
    let end = newValue;
    let duration = 400;
    let startTime = null;

    function animate(currentTime) {
        if (!startTime) startTime = currentTime;
        let progress = (currentTime - startTime) / duration;

        let value = start + (end - start) * progress;

        if (progress < 1) {
            el.innerText = "$" + value.toFixed(2);
            requestAnimationFrame(animate);
        } else {
            el.innerText = "$" + end.toFixed(2);
        }
    }

    requestAnimationFrame(animate);
}


/* =========================
   LOGOUT
========================= */
function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
}


/* =========================
   TOAST
========================= */
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 100);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}


/* =========================
   MODALS
========================= */
function openDeposit() {
    document.getElementById("depositModal").style.display = "flex";
}

function closeDeposit() {
    document.getElementById("depositModal").style.display = "none";
}

function openWithdraw() {
    document.getElementById("withdrawModal").style.display = "flex";
}

function closeWithdraw() {
    document.getElementById("withdrawModal").style.display = "none";
}

function updateDepositAddress() {
  const coin = document.getElementById("depositCoin").value;

  const el = document.getElementById("depositWalletAddress");

  if (!el) return;

  el.innerText = depositAddresses[coin] || "Address not available";
}

function copyDepositAddress() {
  const el = document.getElementById("depositWalletAddress");

  if (!el) return;

  navigator.clipboard.writeText(el.innerText);

  showToast("Address copied");
}

const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

if (hamburger && navLinks) {
  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}