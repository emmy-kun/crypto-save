function setLoading(state) {
    const spinner = document.getElementById("spinner");
    const btnText = document.getElementById("btnText");
    const loginBtn = document.getElementById("loginBtn");

    if (!spinner || !btnText || !loginBtn) return;

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

async function login() {

    setLoading(true);

    const username =
        document.getElementById("username").value;

    const password =
        document.getElementById("password").value;

    if (!username || !password) {
        alert("Please fill all fields");
        setLoading(false);
        return;
    }

    try {

        const response = await fetch(
            "https://crypto-save-production.up.railway.app/send-code",
            {
                method: "POST"
            }
        );

        const data = await response.json();

        if (data.success) {

            document
                .getElementById("verifyModal")
                .classList
                .remove("hidden");

        } else {

            alert("Failed to send code");

        }

    } catch (err) {

        alert("Server error");

    }

    setLoading(false);
}

async function verifyCode() {

    const code = document.getElementById("verificationCode").value;

    const username = document.getElementById("username").value;

    try {

        const response = await fetch(
            "https://crypto-save-production.up.railway.app/verify-code",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ code })
            }
        );

        const data = await response.json();

        console.log("Backend response:", data);

        if (data.success) {

            console.log("Verification successful");
            alert("Verification successful");

            localStorage.setItem("user", username);
            localStorage.setItem("loggedIn", "true");

            window.location.href = "dashboard.html";

        } else {

            alert("Invalid verification code");
        }

    } catch (err) {
        console.log(err);
        alert("Server error");
    }
}