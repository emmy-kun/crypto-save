document.getElementById("nav-transactions").classList.add("nav-active");

async function loadTransactions() {
    const res = await fetch("http://localhost:5000/portfolio");
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

        row.innerHTML = `
            <td>${tx.date}</td>
            <td>${tx.type}</td>
            <td>$${tx.amount}</td>
            <td>${tx.status}</td>
        `;

        table.appendChild(row);
    });txs.forEach(tx => {
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