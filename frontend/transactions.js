/* =========================
   AUTH CHECK
========================= */
if (!localStorage.getItem("loggedIn")) {
    window.location.href = "index.html";
}

document.getElementById("nav-transactions").classList.add("nav-active");

async function loadTransactions() {
    const username = localStorage.getItem("user");
    if (!username) return;

    const res = await fetch(`https://crypto-save-production.up.railway.app/portfolio/${encodeURIComponent(username)}`);
    const data = await res.json();

    const table = document.getElementById("allTransactions");
    table.innerHTML = "";

    const txs = Array.isArray(data.transactions) ? data.transactions : [];

    if (txs.length === 0) {
        table.innerHTML = `<tr><td colspan="4">No transactions</td></tr>`;
        return;
    }

    txs.forEach(tx => {
        const row = document.createElement("tr");

        const statusClass =
            tx.status === "Completed" ? "status-complete" : "status-pending";

        row.innerHTML = `
            <td>${tx.date}</td>
            <td>${tx.type}</td>
            <td>$${tx.amount}</td>
            <td><span class="${statusClass}">${tx.status}</span></td>
        `;

        table.appendChild(row);
    });
}

loadTransactions();

// HAMBURGER TOGGLE
setupHamburger();

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

function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("hideBalance");
    window.location.href = "index.html";
}