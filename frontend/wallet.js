document.getElementById("nav-wallet").classList.add("nav-active");

async function loadWallet() {
    try {
        const res = await fetch("https://crypto-save-production.up.railway.app");
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
           UPDATE TOTAL BALANCE
        ========================== */
        const totalEl = document.getElementById("walletTotal");

        if (totalEl) {
            totalEl.innerText = "$" + total.toFixed(2);
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