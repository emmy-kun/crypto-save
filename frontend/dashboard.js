// 🔒 redirect if not logged in
if (!localStorage.getItem("user")) {
    window.location.href = "index.html";
}

document.getElementById("nav-dashboard").classList.add("nav-active");

async function loadPortfolio() {
    try {
        const res = await fetch("http://localhost:5000/portfolio");
        const data = await res.json();

        const assetsDiv = document.getElementById("assets");
        const txTable = document.getElementById("transactions");

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
           RENDER ASSETS
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
        const totalEl = document.getElementById("total");

        if (hidden) {
            totalEl.innerText = "****";
        } else {
            animateValue(totalEl, total);
        }
        /* =========================
           ALL TRANSACTIONS (FIXED)
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

/* AUTO LOAD */
loadPortfolio();

/* AUTO REFRESH */
setInterval(loadPortfolio, 5000);

/* LOGOUT */
function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
}

const toggleBtn = document.getElementById("toggleBalance");
const totalEl = document.getElementById("total");

const eyeOpen = document.getElementById("eyeOpen");
const eyeClosed = document.getElementById("eyeClosed");

let hidden = localStorage.getItem("hideBalance") === "true";

function updateUI() {
    if (hidden) {
        totalEl.innerText = "****";
        eyeOpen.style.display = "none";
        eyeClosed.style.display = "inline";
    } else {
        loadPortfolio();
        eyeOpen.style.display = "inline";
        eyeClosed.style.display = "none";
    }
}

toggleBtn.addEventListener("click", () => {
    hidden = !hidden;
    localStorage.setItem("hideBalance", hidden);
    updateUI();
});

updateUI();

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

// HAMBURGER TOGGLE
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

if (hamburger) {
  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}