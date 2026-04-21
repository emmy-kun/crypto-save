let currentTotal = 0;
document.getElementById("nav-wallet").classList.add("nav-active");

async function loadWallet() {
    try {
        const res = await fetch("https://crypto-save-production.up.railway.app/portfolio");
        const data = await res.json();

        const assetsDiv = document.getElementById("walletAssets");
        assetsDiv.innerHTML = "";

        let total = 0;
        let count = 0;

        // TEMP PRICES (we upgrade later)
        const prices = {
            bitcoin: 65000,
            ethereum: 3500,
            usdt: 1,
            solana: 150
        };

        // ✅ LOGOS (with fallback safety)
        const logos = {
            bitcoin: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
            ethereum: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
            usdt: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
            solana: "https://assets.coingecko.com/coins/images/4128/large/solana.png"
        };

        /* =========================
           SAFE LOOP THROUGH ASSETS
        ========================== */
        if (data.assets && typeof data.assets === "object") {

            Object.keys(data.assets).forEach(key => {

                const amount = Number(data.assets[key]) || 0;

                // skip empty assets (clean UI)
                if (amount <= 0) return;

                const price = prices[key] || 1;
                const value = amount * price;

                total += value;
                count++;

                const el = document.createElement("div");
                el.className = "wallet-row";

                el.innerHTML = `
                    <div class="wallet-left">
                        <img 
                            src="${logos[key] || ''}" 
                            alt="${key}" 
                            onerror="this.style.display='none'"
                        />
                        <div>
                            <h4>${key.toUpperCase()}</h4>
                            <small>${amount}</small>
                        </div>
                    </div>

                    <div class="wallet-right">
                        <strong>$${value.toFixed(2)}</strong>
                    </div>
                `;

                assetsDiv.appendChild(el);
            });
        }

/* =========================
   UPDATE TOTAL BALANCE (FIXED)
========================= */
if (typeof updateBalanceUI === "function") {
    updateBalanceUI(total);
}
        /* =========================
           UPDATE ASSET COUNT
        ========================== */
        const countEl = document.getElementById("assetCount");

        if (countEl) {
            countEl.innerText = count;
        }

    } catch (err) {
        console.log("Wallet error:", err);
    }
}

/* LOAD */
loadWallet();

// HAMBURGER TOGGLE
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

if (hamburger) {
  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

const toggleBtn = document.getElementById("toggleBalance");
const totalEl = document.getElementById("walletTotal");

const eyeOpen = document.getElementById("eyeOpen");
const eyeClosed = document.getElementById("eyeClosed");

let hidden = localStorage.getItem("hideBalance") === "true";

function updateBalanceUI(value) {
  if (value !== undefined) {
    currentTotal = value; // ✅ store latest real value
  }

  if (hidden) {
    totalEl.innerText = "****";
    eyeOpen.style.display = "none";
    eyeClosed.style.display = "inline";
  } else {
    totalEl.innerText = "$" + currentTotal.toFixed(2); // ✅ use stored value
    eyeOpen.style.display = "inline";
    eyeClosed.style.display = "none";
  }
}

toggleBtn.addEventListener("click", () => {
  hidden = !hidden;
  localStorage.setItem("hideBalance", hidden);
  updateBalanceUI(); // ✅ now works because value is stored
});

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

function submitDeposit() {
  alert("Deposit request sent");
  closeDeposit();
}

function submitWithdraw() {
  alert("Withdrawal request submitted");
  closeWithdraw();
}


setInterval(loadPortfolio, 5000);
