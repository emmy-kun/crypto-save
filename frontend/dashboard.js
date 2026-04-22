/* =========================
   AUTH CHECK
========================= */
if (!localStorage.getItem("user")) {
    window.location.href = "index.html";
}

let depositAddress = "";

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

    setInterval(loadPortfolio, 5000);

    loadDepositAddress();
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

        if (hidden) {
            totalEl.innerText = "****";
        } else {
            animateValue(totalEl, total);
        }

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
   BALANCE TOGGLE
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
   MODALS (RESTORED)
========================= */
function openDeposit() {
    const modal = document.getElementById("depositModal");
    if (modal) modal.style.display = "flex";
}

function closeDeposit() {
    const modal = document.getElementById("depositModal");
    if (modal) modal.style.display = "none";
}

function openWithdraw() {
    const modal = document.getElementById("withdrawModal");
    if (modal) modal.style.display = "flex";
}

function closeWithdraw() {
    const modal = document.getElementById("withdrawModal");
    if (modal) modal.style.display = "none";
}

async function loadDepositAddress() {
  try {
    const res = await fetch("https://crypto-save-production.up.railway.app/api/deposit-address");
    const data = await res.json();

    depositAddress = data.address;

    const el = document.getElementById("depositWalletAddress");
    if (el) el.innerText = depositAddress;

  } catch (err) {
    console.log("Failed to load address", err);
  }
}

function copyDepositAddress() {
  if (!depositAddress) return;

  navigator.clipboard.writeText(depositAddress);
  showToast("Address copied");
}