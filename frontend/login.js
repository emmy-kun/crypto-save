function setLoading(state) {
    const spinner = document.getElementById("spinner");
    const btnText = document.getElementById("btnText");
    const loginBtn = document.getElementById("loginBtn");

    if (state) {
        spinner.classList.remove("hidden");
        btnText.textContent = "Signing in...";
        loginBtn.disabled = true;
    } else {
        spinner.classList.add("hidden");
        btnText.textContent = "Sign In";
        loginBtn.disabled = false;
    }
}

function login() {
    setLoading(true);

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    setTimeout(() => {
        if (username && password) {
            localStorage.setItem("user", username);
            window.location.href = "dashboard.html";
        } else {
            alert("Please fill all fields");
        }

        setLoading(false);
    }, 1200);
}       