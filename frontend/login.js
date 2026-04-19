function login() {
    const username = document.getElementById("username").value;

    // store user (optional)
    localStorage.setItem("user", username);

    // 🔥 redirect to dashboard
    window.location.href = "dashboard.html";
}