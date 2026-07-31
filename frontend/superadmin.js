const API = "https://crypto-save-production.up.railway.app";

let selectedUsername = "";

/* =========================
   AUTH GATE
========================= */
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("superadminToken");
    if (token) {
        showPanel();
    }
});

async function superadminLogin() {
    const password = document.getElementById("superadminPassword").value;

    if (!password) {
        alert("Enter the superadmin password");
        return;
    }

    try {
        const res = await fetch(`${API}/superadmin/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password })
        });

        const data = await res.json();

        if (data.success) {
            localStorage.setItem("superadminToken", data.token);
            showPanel();
        } else {
            alert(data.message || "Invalid password");
        }
    } catch (err) {
        alert("Server error");
    }
}

function showPanel() {
    document.getElementById("loginGate").classList.add("hidden");
    document.getElementById("panel").classList.remove("hidden");
    loadUsers();
}

function authHeaders() {
    return {
        "Content-Type": "application/json",
        "x-superadmin-token": localStorage.getItem("superadminToken") || ""
    };
}

async function handleAuthFailure(res) {
    if (res.status === 401) {
        localStorage.removeItem("superadminToken");
        alert("Session expired, please log in again");
        location.reload();
        return true;
    }
    return false;
}

/* =========================
   USER LIST
========================= */
async function loadUsers() {
    const res = await fetch(`${API}/superadmin/users`, { headers: authHeaders() });

    if (await handleAuthFailure(res)) return;

    const users = await res.json();

    const select = document.getElementById("userSelect");
    select.innerHTML = '<option value="">-- Choose a user --</option>';

    users.forEach(u => {
        const option = document.createElement("option");
        option.value = u.username;
        option.textContent = u.username;
        select.appendChild(option);
    });
}

async function loadSelectedUser() {
    selectedUsername = document.getElementById("userSelect").value;
    const info = document.getElementById("selectedUserInfo");

    if (!selectedUsername) {
        info.textContent = "";
        return;
    }

    const res = await fetch(`${API}/superadmin/portfolio/${encodeURIComponent(selectedUsername)}`, {
        headers: authHeaders()
    });

    if (await handleAuthFailure(res)) return;

    const data = await res.json();
    const assets = data.assets || {};

    info.textContent =
        `Current — BTC: ${assets.bitcoin || 0}, ETH: ${assets.ethereum || 0}, USDT: ${assets.usdt || 0}, SOL: ${assets.solana || 0}, Deposit: ${data.depositAddress || "(none)"}`;

    document.getElementById("depositAddressInput").value = data.depositAddress || "";
}

/* =========================
   ACTIONS
========================= */
function requireSelectedUser() {
    if (!selectedUsername) {
        alert("Select a user first");
        return false;
    }
    return true;
}

async function updateAssets() {
    if (!requireSelectedUser()) return;

    const btc = Number(document.getElementById("btc").value) || 0;
    const eth = Number(document.getElementById("eth").value) || 0;
    const usdt = Number(document.getElementById("usdt").value) || 0;
    const sol = Number(document.getElementById("sol").value) || 0;

    const res = await fetch(`${API}/superadmin/update/${encodeURIComponent(selectedUsername)}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            assets: { bitcoin: btc, ethereum: eth, usdt: usdt, solana: sol }
        })
    });

    if (await handleAuthFailure(res)) return;

    alert("Assets updated");
    loadSelectedUser();
}

async function addTransaction() {
    if (!requireSelectedUser()) return;

    const date = document.getElementById("date").value;
    const type = document.getElementById("type").value;
    const amount = Number(document.getElementById("amount").value);
    const status = document.getElementById("status").value;

    const res = await fetch(`${API}/superadmin/update/${encodeURIComponent(selectedUsername)}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            transactions: [{ date, type, amount, status }]
        })
    });

    if (await handleAuthFailure(res)) return;

    alert("Transaction added");
}

async function addDepositAddress() {
    if (!requireSelectedUser()) return;

    const address = document.getElementById("depositAddressInput").value;

    if (!address) {
        alert("Enter address");
        return;
    }

    try {
        const res = await fetch(`${API}/superadmin/deposit-address/${encodeURIComponent(selectedUsername)}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ address })
        });

        if (await handleAuthFailure(res)) return;

        const data = await res.json();
        alert(data.message || "Updated");
    } catch (err) {
        alert("Failed to update address");
    }
}
