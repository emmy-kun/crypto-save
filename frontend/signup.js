function setLoading(state) {
    const spinner = document.getElementById("spinner");
    const btnText = document.getElementById("btnText");
    const signupBtn = document.getElementById("signupBtn");

    if (!spinner || !btnText || !signupBtn) return;

    if (state) {
        spinner.classList.remove("hidden");
        btnText.textContent = "Creating account...";
        signupBtn.disabled = true;
    } else {
        spinner.classList.add("hidden");
        btnText.textContent = "Sign Up";
        signupBtn.disabled = false;
    }
}

async function signup() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!username || !password || !confirmPassword) {
        alert("Please fill all fields");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    setLoading(true);

    try {
        const response = await fetch(
            "https://crypto-save-production.up.railway.app/signup",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            }
        );

        const data = await response.json();

        if (data.success) {
            alert("Account created. You can now sign in.");
            window.location.href = "index.html";
        } else {
            alert(data.message || "Signup failed");
        }
    } catch (err) {
        alert("Server error");
    }

    setLoading(false);
}
