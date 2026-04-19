async function updateAssets() {
    const btc = document.getElementById("btc").value;
    const eth = document.getElementById("eth").value;
    const usdt = document.getElementById("usdt").value;
    const sol = document.getElementById("sol").value;

    await fetch("http://localhost:5000/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            assets: {
                bitcoin: Number(btc),
                ethereum: Number(eth),
                usdt: Number(usdt),
                solana: Number(sol)
            }
        })
    });

    alert("Assets Updated");

    // 🔥 force refresh signal (important for dashboard)
    localStorage.setItem("refresh", Date.now());
}

async function addTransaction() {
    const date = document.getElementById("date").value;
    const type = document.getElementById("type").value;
    const amount = document.getElementById("amount").value;
    const status = document.getElementById("status").value;

    await fetch("http://localhost:5000/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            transactions: [{
                date,
                type,
                amount: Number(amount),
                status
            }]
        })
    });

    alert("Transaction Added");

    // 🔥 force refresh signal
    localStorage.setItem("refresh", Date.now());
}