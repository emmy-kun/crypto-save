const API = "https://crypto-save-production.up.railway.app";

let selectedUsername = "";
let allUsers = [];

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
    const errorEl = document.getElementById("loginError");
    const btn = document.getElementById("loginBtn");

    errorEl.textContent = "";

    if (!password) {
        errorEl.textContent = "Enter the superadmin password";
        return;
    }

    btn.disabled = true;
    btn.textContent = "Checking...";

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
            errorEl.textContent = data.message || "Invalid password";
        }
    } catch (err) {
        errorEl.textContent = "Server error, please try again";
    }

    btn.disabled = false;
    btn.textContent = "Unlock Panel";
}

function showPanel() {
    document.getElementById("loginGate").classList.add("hidden");
    document.getElementById("panel").classList.remove("hidden");

    const topbarRight = document.getElementById("topbarRight");
    topbarRight.innerHTML = `
        <span class="sa-badge">Authenticated</span>
        <button class="sa-logout-btn" onclick="forceLogoutAll()">Log everyone out</button>
        <button class="sa-logout-btn" onclick="superadminLogout()">Log out</button>
    `;

    loadUsers();
}

function superadminLogout() {
    localStorage.removeItem("superadminToken");
    location.reload();
}

async function forceLogoutAll() {
    const ok = confirm("Force every logged-in user to be logged out?");
    if (!ok) return;

    const res = await fetch(`${API}/superadmin/force-logout-all`, {
        method: "POST",
        headers: authHeaders()
    });

    if (await handleAuthFailure(res)) return;

    if (!res.ok) {
        showToast("Failed to log everyone out", true);
        return;
    }

    showToast("All users have been logged out");
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
        showToast("Session expired, please log in again", true);
        setTimeout(() => location.reload(), 1200);
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

    allUsers = await res.json();
    document.getElementById("userCount").textContent = allUsers.length;
    renderUserList();
}

function renderUserList() {
    const query = document.getElementById("userSearch").value.trim().toLowerCase();
    const list = document.getElementById("userList");

    const filtered = allUsers.filter(u => u.username.toLowerCase().includes(query));

    if (filtered.length === 0) {
        list.innerHTML = `<div class="sa-empty-state">${allUsers.length === 0 ? "No accounts yet" : "No matches"}</div>`;
        return;
    }

    list.innerHTML = "";

    filtered.forEach(u => {
        const row = document.createElement("div");
        row.className = "sa-user-row" + (u.username === selectedUsername ? " active" : "");
        row.onclick = () => selectUser(u.username);

        row.innerHTML = `
            <div class="sa-avatar">${u.username.charAt(0).toUpperCase()}</div>
            <div class="sa-user-name">${u.username}</div>
        `;

        list.appendChild(row);
    });
}

/* =========================
   SELECT USER
========================= */
async function selectUser(username) {
    selectedUsername = username;
    renderUserList();

    document.getElementById("selectedName").textContent = username;
    document.getElementById("selectedSub").textContent = "Managing this account's assets, transactions & deposit address";
    document.getElementById("detailSections").classList.remove("hidden");
    document.getElementById("deleteUserBtn").classList.remove("hidden");

    const res = await fetch(`${API}/superadmin/portfolio/${encodeURIComponent(username)}`, {
        headers: authHeaders()
    });

    if (await handleAuthFailure(res)) return;

    const data = await res.json();
    const assets = data.assets || {};

    document.getElementById("statBtc").textContent = assets.bitcoin || 0;
    document.getElementById("statEth").textContent = assets.ethereum || 0;
    document.getElementById("statUsdt").textContent = assets.usdt || 0;
    document.getElementById("statSol").textContent = assets.solana || 0;

    document.getElementById("currentAddress").textContent = data.depositAddress || "No address set";
    document.getElementById("depositAddressInput").value = "";

    renderTransactions(data.transactions || []);
}

function renderTransactions(transactions) {
    const body = document.getElementById("txTableBody");

    if (!transactions.length) {
        body.innerHTML = `<tr><td colspan="4" style="color:#94a3b8;">No transactions</td></tr>`;
        return;
    }

    body.innerHTML = "";

    [...transactions].reverse().forEach(tx => {
        const statusClass = tx.status === "Completed" ? "completed" : "pending";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${tx.date || "-"}</td>
            <td>${tx.type || "-"}</td>
            <td>$${tx.amount || 0}</td>
            <td><span class="sa-status ${statusClass}">${tx.status || "-"}</span></td>
        `;
        body.appendChild(row);
    });
}

/* =========================
   ACTIONS
========================= */
function requireSelectedUser() {
    if (!selectedUsername) {
        showToast("Select an account first", true);
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

    ["btc", "eth", "usdt", "sol"].forEach(id => document.getElementById(id).value = "");

    showToast("Assets updated");
    selectUser(selectedUsername);
}

async function addTransaction() {
    if (!requireSelectedUser()) return;

    const date = document.getElementById("date").value;
    const type = document.getElementById("type").value;
    const amount = Number(document.getElementById("amount").value);
    const status = document.getElementById("status").value;

    if (!date || !type) {
        showToast("Date and type are required", true);
        return;
    }

    const res = await fetch(`${API}/superadmin/update/${encodeURIComponent(selectedUsername)}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            transactions: [{ date, type, amount, status }]
        })
    });

    if (await handleAuthFailure(res)) return;

    document.getElementById("date").value = "";
    document.getElementById("type").value = "";
    document.getElementById("amount").value = "";

    showToast("Transaction added");
    selectUser(selectedUsername);
}

async function addDepositAddress() {
    if (!requireSelectedUser()) return;

    const address = document.getElementById("depositAddressInput").value.trim();

    if (!address) {
        showToast("Enter an address", true);
        return;
    }

    const res = await fetch(`${API}/superadmin/deposit-address/${encodeURIComponent(selectedUsername)}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ address })
    });

    if (await handleAuthFailure(res)) return;

    showToast("Deposit address updated");
    selectUser(selectedUsername);
}

async function confirmDeleteUser() {
    if (!requireSelectedUser()) return;

    const ok = confirm(`Delete account "${selectedUsername}" and all of its data? This cannot be undone.`);
    if (!ok) return;

    const res = await fetch(`${API}/superadmin/users/${encodeURIComponent(selectedUsername)}`, {
        method: "DELETE",
        headers: authHeaders()
    });

    if (await handleAuthFailure(res)) return;

    if (!res.ok) {
        showToast("Failed to delete account", true);
        return;
    }

    showToast(`Deleted ${selectedUsername}`);

    selectedUsername = "";
    document.getElementById("selectedName").textContent = "No account selected";
    document.getElementById("selectedSub").textContent = "Choose an account from the list to manage it";
    document.getElementById("detailSections").classList.add("hidden");
    document.getElementById("deleteUserBtn").classList.add("hidden");

    loadUsers();
}

/* =========================
   TOAST
========================= */
function showToast(message, isError) {
    const toast = document.createElement("div");
    toast.className = "sa-toast" + (isError ? " error" : "");
    toast.textContent = message;

    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 2200);
}
