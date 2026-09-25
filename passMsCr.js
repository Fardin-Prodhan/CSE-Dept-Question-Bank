document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       CONFIG & ENDPOINTS
    ========================================= */
    const AUTH_API_ENDPOINT = "https://cse-question-bank-api.fardin83832006.workers.dev/auth/cr";
    const UPLOAD_PORTAL_URL = "upload.html";

    /* =========================================
       DOM ELEMENTS
    ========================================= */
    const form = document.getElementById("passwordForm");
    const password = document.getElementById("secretPass");
    const togglePassword = document.getElementById("togglePassword");
    const verifyBtn = document.getElementById("verifyBtn");
    const errorMessage = document.getElementById("errorMessage");
    const errorText = document.getElementById("errorText");
    const card = document.getElementById("verificationCard");
    const successCard = document.getElementById("successCard");
    const backBtn = document.getElementById("backBtn");
    const hackerAvatar = document.getElementById("hackerAvatar");
    const hackerStatus = document.getElementById("hackerStatus");
    const statusText = document.getElementById("statusText");
    const blackout = document.getElementById("blackoutScreen");
    const crashTimer = document.getElementById("crashTimer");
    const crashProgress = document.getElementById("crashProgress");

    /* =========================================
       WEB AUDIO SYNTHESIS
    ========================================= */
    let audioContext = null;

    function getAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }

    function playWrongSound() {
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;
            
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();

            oscillator.type = "sawtooth";
            oscillator.frequency.setValueAtTime(170, now);
            oscillator.frequency.exponentialRampToValueAtTime(55, now + 0.55);

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.25, now + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.start(now);
            oscillator.stop(now + 0.65);

            setTimeout(() => {
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();

                osc2.type = "square";
                osc2.frequency.value = 75;

                gain2.gain.setValueAtTime(0.0001, ctx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.13, ctx.currentTime + 0.02);
                gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.start();
                osc2.stop(ctx.currentTime + 0.4);
            }, 180);

        } catch (error) {
            console.log("Audio feedback disabled or restricted by browser.");
        }
    }

    function playSuccessSound() {
        try {
            const ctx = getAudioContext();
            const notes = [523.25, 659.25, 783.99, 1046.50];

            notes.forEach((frequency, index) => {
                const start = ctx.currentTime + index * 0.12;
                const oscillator = ctx.createOscillator();
                const gain = ctx.createGain();

                oscillator.type = "sine";
                oscillator.frequency.value = frequency;

                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.exponentialRampToValueAtTime(0.18, start + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);

                oscillator.connect(gain);
                gain.connect(ctx.destination);
                oscillator.start(start);
                oscillator.stop(start + 0.5);
            });
        } catch (error) {
            console.log("Audio feedback disabled or restricted by browser.");
        }
    }

    /* =========================================
       PASSWORD VISIBILITY TOGGLE
    ========================================= */
    togglePassword.addEventListener("click", () => {
        if (password.type === "password") {
            password.type = "text";
            togglePassword.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
        } else {
            password.type = "password";
            togglePassword.innerHTML = '<i class="fa-solid fa-eye"></i>';
        }
        password.focus();
    });

    /* =========================================
       INPUT ERROR CLEARING
    ========================================= */
    password.addEventListener("input", () => {
        errorMessage.classList.remove("show");
        card.classList.remove("shake");
    });

    /* =========================================
       FORM SUBMISSION & AUTHENTICATION
    ========================================= */
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const enteredPass = password.value.trim();

        if (!enteredPass) {
            showError("Please enter the secret pass key.");
            password.focus();
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(AUTH_API_ENDPOINT, {
                method: "POST",
                headers: {
                    "X-Password": enteredPass,
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.token) {
                accessDenied(data.error || "Incorrect secret pass key.");
                return;
            }

            // Save Authentication Token to Session
            sessionStorage.setItem("cr_token", data.token);
            sessionStorage.setItem("cr_authenticated", "true");

            accessGranted();

        } catch (error) {
            console.error("Authentication error:", error);
            setLoading(false);
            showError("Unable to connect to authentication server.");
        }
    });

    /* =========================================
       ACCESS DENIED & LOCKDOWN FLOW
    ========================================= */
    function accessDenied(message) {
        setLoading(false);
        password.value = "";
        password.focus();

        showError(message);

        hackerAvatar.classList.remove("ethical");
        hackerStatus.classList.remove("ethical");
        statusText.textContent = "BLACK HAT DETECTED";

        // Trigger CSS Card Shake Effect
        card.classList.remove("shake");
        void card.offsetWidth;
        card.classList.add("shake");

        playWrongSound();
        startSecurityLockdown();
    }

    function startSecurityLockdown() {
        blackout.classList.add("active");

        let remaining = 5;
        crashTimer.textContent = `SYSTEM LOCKDOWN: ${remaining}`;

        crashProgress.style.transition = "width 5s linear";
        crashProgress.style.width = "100%";

        const interval = setInterval(() => {
            remaining--;
            if (remaining > 0) {
                crashTimer.textContent = `SYSTEM LOCKDOWN: ${remaining}`;
            }
        }, 1000);

        setTimeout(() => {
            clearInterval(interval);
            blackout.classList.remove("active");
            crashProgress.style.transition = "none";
            crashProgress.style.width = "0%";
            crashTimer.textContent = "SYSTEM LOCKDOWN: 5";
        }, 5000);
    }

    /* =========================================
       ACCESS GRANTED FLOW
    ========================================= */
    function accessGranted() {
        setLoading(false);

        hackerAvatar.classList.add("ethical");
        hackerStatus.classList.add("ethical");
        statusText.textContent = "ETHICAL HACKER VERIFIED";

        playSuccessSound();

        card.style.display = "none";
        successCard.classList.add("show");

        setTimeout(() => {
            window.location.href = UPLOAD_PORTAL_URL;
        }, 1800);
    }

    /* =========================================
       UI HELPER FUNCTIONS
    ========================================= */
    function showError(text) {
        errorText.textContent = text;
        errorMessage.classList.add("show");
    }

    function setLoading(isLoading) {
        verifyBtn.disabled = isLoading;

        const btnContent = verifyBtn.querySelector(".btn-content");
        const loadingContent = verifyBtn.querySelector(".loading-content");

        if (isLoading) {
            btnContent.style.display = "none";
            loadingContent.style.display = "flex";
        } else {
            btnContent.style.display = "flex";
            loadingContent.style.display = "none";
        }
    }

    /* =========================================
       BACK NAVIGATION
    ========================================= */
    backBtn.addEventListener("click", () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = "index.html";
        }
    });
});