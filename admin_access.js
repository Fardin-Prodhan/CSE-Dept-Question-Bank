const API_BASE =
    "https://cse-question-bank-api.fardin83832006.workers.dev";

const ADMIN_DASHBOARD =
    "admin.html";


// =========================================
// ELEMENTS
// =========================================

const form =
    document.getElementById("adminAccessForm");

const passwordInput =
    document.getElementById("adminPass");

const togglePassword =
    document.getElementById("togglePassword");

const verifyButton =
    document.getElementById("verifyButton");

const normalState =
    document.getElementById("normalState");

const loadingState =
    document.getElementById("loadingState");

const errorMessage =
    document.getElementById("errorMessage");


// =========================================
// PASSWORD TOGGLE
// =========================================

togglePassword.addEventListener(
    "click",
    () => {

        const isHidden =
            passwordInput.type === "password";

        passwordInput.type =
            isHidden
                ? "text"
                : "password";

        const icon =
            togglePassword.querySelector("i");

        icon.className =
            isHidden
                ? "fa-solid fa-eye-slash"
                : "fa-solid fa-eye";

    }
);


// =========================================
// ERROR
// =========================================

function showError(message) {

    errorMessage.textContent =
        message;

    errorMessage.classList.remove(
        "hidden"
    );

}


function hideError() {

    errorMessage.classList.add(
        "hidden"
    );

}


// =========================================
// LOADING
// =========================================

function setLoading(loading) {

    verifyButton.disabled =
        loading;

    if (loading) {

        normalState.classList.add(
            "hidden"
        );

        loadingState.classList.remove(
            "hidden"
        );

    } else {

        normalState.classList.remove(
            "hidden"
        );

        loadingState.classList.add(
            "hidden"
        );

    }

}


// =========================================
// ADMIN VERIFICATION
// =========================================

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        hideError();

        const password =
            passwordInput.value;

        if (!password) {

            showError(
                "Please enter the secret pass key."
            );

            passwordInput.focus();

            return;

        }

        setLoading(true);

        try {

            const response =
                await fetch(
                    `${API_BASE}/auth/admin`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                            "X-Password": password
                        }
                    }
                );


            let data = null;

            try {

                data =
                    await response.json();

            } catch {

                data = null;

            }


            if (!response.ok) {

                throw new Error(
                    data?.error ||
                    "Invalid secret pass key."
                );

            }


            if (!data?.token) {

                throw new Error(
                    "Verification failed. No admin token received."
                );

            }


            // =================================
            // SAVE REAL SERVER TOKEN
            // =================================

            sessionStorage.setItem(
                "admin_token",
                data.token
            );

            sessionStorage.setItem(
                "admin_authenticated",
                "true"
            );


            // Clear password from input

            passwordInput.value = "";


            // =================================
            // REDIRECT
            // =================================

            window.location.replace(
                ADMIN_DASHBOARD
            );


        } catch (error) {

            console.error(
                "Admin verification error:",
                error
            );

            showError(
                error.message ||
                "Unable to verify admin access."
            );

        } finally {

            setLoading(false);

        }

    }
);


// =========================================
// ENTER KEY
// =========================================

passwordInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            form.requestSubmit();

        }

    }
);