const API_BASE =
    "https://cse-question-bank-api.fardin83832006.workers.dev";


// =========================================
// ELEMENTS
// =========================================

const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");

const adminLoginForm = document.getElementById("adminLoginForm");
const adminPassword = document.getElementById("adminPassword");
const togglePassword = document.getElementById("togglePassword");

const loginButton = document.getElementById("loginButton");
const loginNormal = document.getElementById("loginNormal");
const loginLoading = document.getElementById("loginLoading");
const loginMessage = document.getElementById("loginMessage");

const refreshButton = document.getElementById("refreshButton");
const logoutButton = document.getElementById("logoutButton");

const pendingCount = document.getElementById("pendingCount");
const requestCount = document.getElementById("requestCount");
const lastUpdated = document.getElementById("lastUpdated");

const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const requestList = document.getElementById("requestList");


// =========================================
// PUBLISHED QUESTION BANK ELEMENTS
// =========================================

const publishedBankSection =
    document.getElementById("publishedBankSection");

const refreshPublishedButton =
    document.getElementById("refreshPublishedButton");

const publishedLoadingState =
    document.getElementById("publishedLoadingState");

const publishedEmptyState =
    document.getElementById("publishedEmptyState");

const publishedBankList =
    document.getElementById("publishedBankList");


// =========================================
// PREVIEW ELEMENTS
// =========================================

const previewModal = document.getElementById("previewModal");
const closePreview = document.getElementById("closePreview");
const pdfFrame = document.getElementById("pdfFrame");
const previewTitle = document.getElementById("previewTitle");
const previewInfo = document.getElementById("previewInfo");


// =========================================
// CONFIRM MODAL
// =========================================

const confirmModal = document.getElementById("confirmModal");
const confirmIcon = document.getElementById("confirmIcon");
const confirmTitle = document.getElementById("confirmTitle");
const confirmText = document.getElementById("confirmText");
const cancelAction = document.getElementById("cancelAction");
const confirmAction = document.getElementById("confirmAction");


// =========================================
// TOAST
// =========================================

const toast = document.getElementById("toast");
const toastIcon = document.getElementById("toastIcon");
const toastText = document.getElementById("toastText");


// =========================================
// STATE
// =========================================

let requests = [];

let publishedSemesters = [];

let pendingAction = null;

let toastTimer = null;


// =========================================
// HELPERS
// =========================================

function getAdminToken() {

    return sessionStorage.getItem("admin_token");

}


function showLoginMessage(message, type = "error") {

    loginMessage.textContent = message;

    loginMessage.className =
        `login-message ${type}`;

    loginMessage.classList.remove("hidden");

}


function hideLoginMessage() {

    loginMessage.classList.add("hidden");

}


function setLoginLoading(loading) {

    loginButton.disabled = loading;

    if (loading) {

        loginNormal.classList.add("hidden");

        loginLoading.classList.remove("hidden");

    } else {

        loginNormal.classList.remove("hidden");

        loginLoading.classList.add("hidden");

    }

}


function showToast(message, type = "success") {

    clearTimeout(toastTimer);

    toastText.textContent = message;

    toastIcon.className =
        type === "success"
            ? "fa-solid fa-circle-check"
            : "fa-solid fa-circle-exclamation";

    toastIcon.style.color =
        type === "success"
            ? "var(--success)"
            : "var(--danger)";

    toast.classList.remove("hidden");

    toast.style.animation = "none";

    void toast.offsetWidth;

    toast.style.animation =
        "toastIn 0.35s ease, toastOut 0.35s ease 3.2s forwards";

    toastTimer = setTimeout(() => {

        toast.classList.add("hidden");

    }, 3600);

}


async function apiFetch(endpoint, options = {}) {

    const token =
        getAdminToken();

    const headers = {
        ...(options.headers || {})
    };

    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }

    const response =
        await fetch(
            `${API_BASE}${endpoint}`,
            {
                ...options,
                headers
            }
        );

    let data = null;

    try {

        data = await response.json();

    } catch {

        data = null;

    }

    if (!response.ok) {

        const message =
            data?.error ||
            data?.message ||
            `Request failed (${response.status})`;

        throw new Error(message);

    }

    return data;

}


// =========================================
// PASSWORD TOGGLE
// =========================================

togglePassword.addEventListener(
    "click",
    () => {

        const isPassword =
            adminPassword.type === "password";

        adminPassword.type =
            isPassword
                ? "text"
                : "password";

        const icon =
            togglePassword.querySelector("i");

        icon.className =
            isPassword
                ? "fa-solid fa-eye-slash"
                : "fa-solid fa-eye";

    }
);


// =========================================
// ADMIN LOGIN
// =========================================

adminLoginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        hideLoginMessage();

        const password =
            adminPassword.value.trim();

        if (!password) {

            showLoginMessage(
                "Please enter the admin pass key."
            );

            return;

        }

        setLoginLoading(true);

        try {

            const response =
                await fetch(
                    `${API_BASE}/auth/admin`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            password
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data?.error ||
                    "Invalid admin pass key."
                );

            }

            if (!data.token) {

                throw new Error(
                    "Admin token was not returned by server."
                );

            }

            sessionStorage.setItem(
                "admin_token",
                data.token
            );

            sessionStorage.setItem(
                "admin_authenticated",
                "true"
            );

            adminPassword.value = "";

            showDashboard();

        } catch (error) {

            showLoginMessage(
                error.message ||
                "Admin verification failed."
            );

        } finally {

            setLoginLoading(false);

        }

    }
);


// =========================================
// SHOW DASHBOARD
// =========================================

function showDashboard() {

    loginScreen.classList.add("hidden");

    dashboard.classList.remove("hidden");

    loadDashboard();

}


// =========================================
// LOAD COMPLETE DASHBOARD
// =========================================

async function loadDashboard() {

    await Promise.allSettled([
        loadRequests(),
        loadPublishedBank()
    ]);

}


// =========================================
// LOAD REQUESTS
// =========================================

async function loadRequests() {

    loadingState.classList.remove("hidden");

    emptyState.classList.add("hidden");

    requestList.classList.add("hidden");

    requestList.innerHTML = "";

    try {

        const data =
            await apiFetch(
                "/admin/uploads"
            );

        requests =
            Array.isArray(data)
                ? data
                : (
                    Array.isArray(data?.uploads)
                        ? data.uploads
                        : (
                            Array.isArray(data?.requests)
                                ? data.requests
                                : []
                        )
                );

        updateStats();

        renderRequests();

        updateLastUpdated();

    } catch (error) {

        console.error(error);

        requests = [];

        pendingCount.textContent = "—";

        requestCount.textContent = "—";

        loadingState.innerHTML = `

            <div class="loading-spinner">

                <i class="fa-solid fa-triangle-exclamation"></i>

            </div>

            <h3>
                Failed to load requests
            </h3>

            <p>
                ${escapeHtml(error.message)}
            </p>

        `;

        showToast(
            error.message ||
            "Could not load requests.",
            "error"
        );

        return;

    } finally {

        loadingState.classList.add("hidden");

    }

}


// =========================================
// UPDATE STATS
// =========================================

function updateStats() {

    const count =
        requests.length;

    pendingCount.textContent =
        count;

    requestCount.textContent =
        count;

}


// =========================================
// RENDER REQUESTS
// =========================================

function renderRequests() {

    requestList.innerHTML = "";

    if (!requests.length) {

        emptyState.classList.remove("hidden");

        return;

    }

    emptyState.classList.add("hidden");

    requestList.classList.remove("hidden");

    requests.forEach(
        (request, index) => {

            const card =
                createRequestCard(
                    request,
                    index
                );

            requestList.appendChild(card);

        }
    );

}


// =========================================
// CREATE REQUEST CARD
// =========================================

function createRequestCard(
    request,
    index
) {

    const card =
        document.createElement("article");

    card.className =
        "request-card";

    card.style.animationDelay =
        `${index * 45}ms`;

    const id =
        request.id ??
        request.request_id ??
        request.request_uuid ??
        "";

    const crId =
        request.cr_id ??
        request.crId ??
        "Unknown";

    const crName =
        request.cr_name ??
        request.crName ??
        "Unknown";


    // =========================================
    // WHATSAPP / CONTACT NUMBER
    // =========================================

    const rawContact =
        request.whatsapp_number ??
        request.whatsappNumber ??
        request.contact_number ??
        request.contactNumber ??
        request.whatsapp ??
        request.phone ??
        request.cr_phone ??
        request.contactNo ??
        request.phone_number ??
        "";

    const contactNumber =
        String(rawContact).trim();

    const displayContact =
        contactNumber ||
        "No contact provided";


    // =========================================
    // WHATSAPP URL
    // =========================================

    const cleanPhone =
        contactNumber.replace(/\D/g, "");

    const whatsappPhone =
        cleanPhone.startsWith("01")
            ? `88${cleanPhone}`
            : cleanPhone;


    const semester =
        request.semester ??
        "Unknown";

    const exam =
        request.exam ??
        "Unknown";

    const filename =
        request.filename ??
        "Question Paper.pdf";

    const fileSize =
        request.file_size ??
        request.fileSize ??
        null;

    const createdAt =
        request.created_at ??
        request.createdAt ??
        null;

    const sizeText =
        formatFileSize(fileSize);

    const timeText =
        formatDate(createdAt);


    card.innerHTML = `

        <div class="request-main">

            <div class="request-title">

                <span class="pdf-badge">
                    PDF
                </span>

                <strong title="${escapeHtml(filename)}">
                    ${escapeHtml(filename)}
                </strong>

            </div>


            <div class="request-meta">

                <span class="meta-item">

                    <i class="fa-solid fa-id-card"></i>

                    CR ID:
                    ${escapeHtml(crId)}

                </span>


                <span class="meta-item">

                    <i class="fa-solid fa-user"></i>

                    ${escapeHtml(crName)}

                </span>


                <span class="meta-item">

                    <i class="fa-brands fa-whatsapp"></i>

                    ${
                        whatsappPhone
                            ? `
                                <a
                                    href="https://wa.me/${whatsappPhone}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style="color: inherit; text-decoration: underline;"
                                    title="Open WhatsApp"
                                >
                                    ${escapeHtml(displayContact)}
                                </a>
                              `
                            : escapeHtml(displayContact)
                    }

                </span>


                <span class="meta-item">

                    <i class="fa-solid fa-layer-group"></i>

                    ${escapeHtml(
                        formatSemester(semester)
                    )}

                </span>


                <span class="meta-item">

                    <i class="fa-solid fa-file-lines"></i>

                    ${escapeHtml(exam)}

                </span>


                ${
                    sizeText
                        ? `
                            <span class="meta-item">

                                <i class="fa-solid fa-weight-hanging"></i>

                                ${sizeText}

                            </span>
                        `
                        : ""
                }

            </div>


            <div class="request-time">

                <i class="fa-regular fa-clock"></i>

                Submitted:
                ${escapeHtml(timeText)}

            </div>

        </div>


        <div class="request-actions">

            <button
                class="action-button preview-button"
                data-action="preview"
            >

                <i class="fa-solid fa-eye"></i>

                Preview

            </button>


            <button
                class="action-button approve-button"
                data-action="approve"
            >

                <i class="fa-solid fa-check"></i>

                Approve

            </button>


            <button
                class="action-button reject-button"
                data-action="reject"
            >

                <i class="fa-solid fa-xmark"></i>

                Reject

            </button>

        </div>

    `;


    const previewBtn =
        card.querySelector(
            '[data-action="preview"]'
        );

    const approveBtn =
        card.querySelector(
            '[data-action="approve"]'
        );

    const rejectBtn =
        card.querySelector(
            '[data-action="reject"]'
        );


    previewBtn.addEventListener(
        "click",
        () => {

            openPreview(request);

        }
    );


    approveBtn.addEventListener(
        "click",
        () => {

            askAction(
                "approve",
                request
            );

        }
    );


    rejectBtn.addEventListener(
        "click",
        () => {

            askAction(
                "reject",
                request
            );

        }
    );


    return card;

}


// =========================================
// PREVIEW
// =========================================

async function openPreview(request) {

    const id =
        request.id ??
        request.request_id ??
        request.request_uuid;

    if (!id) {

        showToast(
            "Request ID is missing.",
            "error"
        );

        return;

    }

    const title =
        request.filename ||
        "Question Paper";

    const viewerUrl =
        `viewer.html?id=${encodeURIComponent(id)}&title=${encodeURIComponent(title)}`;

    window.location.href =
        viewerUrl;

}


// =========================================
// CLOSE PREVIEW
// =========================================

closePreview.addEventListener(
    "click",
    closePreviewModal
);


previewModal
    .querySelector(".modal-overlay")
    .addEventListener(
        "click",
        closePreviewModal
    );


function closePreviewModal() {

    previewModal.classList.add("hidden");

    pdfFrame.src = "about:blank";

}


// =========================================
// CONFIRM ACTION
// =========================================

function askAction(
    action,
    item
) {

    pendingAction = {
        action,
        item
    };


    // =========================================
    // APPROVE
    // =========================================

    if (action === "approve") {

        const filename =
            item.filename ||
            "this question paper";

        confirmIcon.innerHTML =
            `<i class="fa-solid fa-check"></i>`;

        confirmIcon.style.color =
            "var(--success)";

        confirmIcon.style.background =
            "rgba(52, 211, 153, 0.09)";

        confirmTitle.textContent =
            "Approve Paper";

        confirmText.textContent =
            `Approve "${filename}" and publish it to the question bank?`;

        confirmAction.textContent =
            "Approve & Publish";

        confirmAction.style.background =
            "linear-gradient(135deg, #10b981, #059669)";

    }


    // =========================================
    // REJECT
    // =========================================

    else if (action === "reject") {

        const filename =
            item.filename ||
            "this question paper";

        confirmIcon.innerHTML =
            `<i class="fa-solid fa-xmark"></i>`;

        confirmIcon.style.color =
            "var(--danger)";

        confirmIcon.style.background =
            "rgba(244, 63, 94, 0.09)";

        confirmTitle.textContent =
            "Reject Paper";

        confirmText.textContent =
            `Reject "${filename}" and remove it from the pending queue?`;

        confirmAction.textContent =
            "Reject Paper";

        confirmAction.style.background =
            "linear-gradient(135deg, #f43f5e, #e11d48)";

    }


    // =========================================
    // DELETE PUBLISHED PAPER
    // =========================================

    else if (action === "delete") {

        const filename =
            item.name ||
            getFilenameFromPath(item.path) ||
            "this question paper";

        confirmIcon.innerHTML =
            `<i class="fa-solid fa-trash"></i>`;

        confirmIcon.style.color =
            "var(--danger)";

        confirmIcon.style.background =
            "rgba(244, 63, 94, 0.09)";

        confirmTitle.textContent =
            "Delete Published Paper";

        confirmText.textContent =
            `Delete "${filename}" permanently from the Question Bank? This will remove the PDF from GitHub and its entry from questionbank.json.`;

        confirmAction.textContent =
            "Delete Permanently";

        confirmAction.style.background =
            "linear-gradient(135deg, #f43f5e, #be123c)";

    }


    confirmModal.classList.remove("hidden");

}


// =========================================
// CLOSE CONFIRM MODAL
// =========================================

cancelAction.addEventListener(
    "click",
    closeConfirmModal
);


confirmModal
    .querySelector(".modal-overlay")
    .addEventListener(
        "click",
        closeConfirmModal
    );


function closeConfirmModal() {

    confirmModal.classList.add("hidden");

    pendingAction = null;

}


// =========================================
// EXECUTE CONFIRM ACTION
// =========================================

confirmAction.addEventListener(
    "click",
    async () => {

        if (!pendingAction) {

            return;

        }


        const {
            action,
            item
        } = pendingAction;


        confirmAction.disabled = true;


        const originalText =
            confirmAction.textContent;


        confirmAction.innerHTML =
            `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;


        try {


            // =========================================
            // APPROVE
            // =========================================

            if (action === "approve") {

                const id =
                    item.id ??
                    item.request_id ??
                    item.request_uuid;

                if (!id) {

                    throw new Error(
                        "Request ID is missing."
                    );

                }


                await apiFetch(
                    "/admin/approve",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            id
                        })
                    }
                );


                showToast(
                    "Question paper approved and published."
                );

            }


            // =========================================
            // REJECT
            // =========================================

            else if (action === "reject") {

                const id =
                    item.id ??
                    item.request_id ??
                    item.request_uuid;

                if (!id) {

                    throw new Error(
                        "Request ID is missing."
                    );

                }


                await apiFetch(
                    "/admin/reject",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            id
                        })
                    }
                );


                showToast(
                    "Question paper rejected."
                );

            }


            // =========================================
            // DELETE PUBLISHED PAPER
            // =========================================

            else if (action === "delete") {

                const path =
                    item.path;

                if (!path) {

                    throw new Error(
                        "Published file path is missing."
                    );

                }


                await apiFetch(
                    "/admin/delete",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            path
                        })
                    }
                );


                showToast(
                    "Published question paper deleted successfully."
                );

            }


            closeConfirmModal();


            // =========================================
            // REFRESH APPROPRIATE DATA
            // =========================================

            if (
                action === "approve" ||
                action === "reject"
            ) {

                await Promise.allSettled([
                    loadRequests(),
                    action === "approve"
                        ? loadPublishedBank()
                        : Promise.resolve()
                ]);

            }


            else if (action === "delete") {

                await loadPublishedBank();

            }


        } catch (error) {

            console.error(error);

            showToast(
                error.message ||
                "Action failed.",
                "error"
            );

        } finally {

            confirmAction.disabled = false;

            confirmAction.textContent =
                originalText;

        }

    }
);


// =========================================
// LOAD PUBLISHED QUESTION BANK
// =========================================

async function loadPublishedBank() {

    if (!publishedBankSection) {

        return;

    }


    publishedLoadingState.classList.remove("hidden");

    publishedEmptyState.classList.add("hidden");

    publishedBankList.classList.add("hidden");

    publishedBankList.innerHTML = "";


    try {

        const data =
            await apiFetch(
                "/admin/published"
            );


        publishedSemesters =
            Array.isArray(data?.semesters)
                ? data.semesters
                : [];


        renderPublishedBank(
            publishedSemesters
        );


    } catch (error) {

        console.error(
            "Published bank loading failed:",
            error
        );


        publishedSemesters = [];


        publishedBankList.innerHTML = `

            <div class="loading-state">

                <div class="loading-spinner">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                </div>

                <h3>
                    Failed to load published papers
                </h3>

                <p>
                    ${escapeHtml(error.message)}
                </p>

            </div>

        `;


        publishedBankList.classList.remove("hidden");


        showToast(
            error.message ||
            "Could not load published question papers.",
            "error"
        );


    } finally {

        publishedLoadingState.classList.add("hidden");

    }

}


// =========================================
// RENDER PUBLISHED QUESTION BANK
// =========================================

function renderPublishedBank(semesters) {

    publishedBankList.innerHTML = "";


    if (
        !Array.isArray(semesters) ||
        !semesters.length
    ) {

        publishedEmptyState.classList.remove("hidden");

        publishedBankList.classList.add("hidden");

        return;

    }


    const validSemesters =
        semesters
            .filter(
                semester =>
                    semester &&
                    Array.isArray(semester.files) &&
                    semester.files.length
            )
            .sort(
                (a, b) =>
                    getSemesterNumber(a.name) -
                    getSemesterNumber(b.name)
            );


    if (!validSemesters.length) {

        publishedEmptyState.classList.remove("hidden");

        publishedBankList.classList.add("hidden");

        return;

    }


    publishedEmptyState.classList.add("hidden");

    publishedBankList.classList.remove("hidden");


    validSemesters.forEach(
        (semester, semesterIndex) => {

            const semesterBlock =
                document.createElement("section");

            semesterBlock.className =
                "published-semester-block";

            semesterBlock.style.animationDelay =
                `${semesterIndex * 60}ms`;


            const semesterName =
                formatSemester(
                    semester.name
                );


            const files =
                [...semester.files].sort(
                    (a, b) =>
                        String(a.name || "")
                            .localeCompare(
                                String(b.name || ""),
                                undefined,
                                {
                                    numeric: true,
                                    sensitivity: "base"
                                }
                            )
                );


            semesterBlock.innerHTML = `

                <div class="published-semester-header">

                    <div class="published-semester-title">

                        <div class="published-semester-icon">

                            <i class="fa-solid fa-layer-group"></i>

                        </div>

                        <div>

                            <h3>
                                ${escapeHtml(semesterName)}
                            </h3>

                            <span>
                                ${files.length}
                                ${
                                    files.length === 1
                                        ? "paper"
                                        : "papers"
                                }
                            </span>

                        </div>

                    </div>

                </div>


                <div class="published-paper-list"></div>

            `;


            const paperList =
                semesterBlock.querySelector(
                    ".published-paper-list"
                );


            files.forEach(
                (file, fileIndex) => {

                    const paperCard =
                        createPublishedPaperCard(
                            file,
                            semester.name,
                            fileIndex
                        );

                    paperList.appendChild(
                        paperCard
                    );

                }
            );


            publishedBankList.appendChild(
                semesterBlock
            );

        }
    );

}


// =========================================
// CREATE PUBLISHED PAPER CARD
// =========================================

function createPublishedPaperCard(
    file,
    semester,
    index
) {

    const card =
        document.createElement("article");

    card.className =
        "published-paper-card";

    card.style.animationDelay =
        `${index * 35}ms`;


    const filename =
        file.name ||
        getFilenameFromPath(file.path) ||
        "Question Paper.pdf";


    const path =
        file.path ||
        `${semester}/${filename}`;


    const exam =
        detectExam(filename);


    card.innerHTML = `

        <div class="published-paper-main">

            <div class="published-pdf-icon">

                <i class="fa-solid fa-file-pdf"></i>

            </div>


            <div class="published-paper-info">

                <strong
                    title="${escapeHtml(filename)}"
                >
                    ${escapeHtml(filename)}
                </strong>


                <div class="published-paper-meta">

                    <span>

                        <i class="fa-solid fa-folder"></i>

                        ${escapeHtml(
                            formatSemester(semester)
                        )}

                    </span>


                    ${
                        exam
                            ? `
                                <span>

                                    <i class="fa-solid fa-file-lines"></i>

                                    ${escapeHtml(exam)}

                                </span>
                              `
                            : ""
                    }

                </div>


                <small
                    title="${escapeHtml(path)}"
                >
                    ${escapeHtml(path)}
                </small>

            </div>

        </div>


        <div class="published-paper-actions">

            <button
                type="button"
                class="action-button published-delete-button"
                data-action="delete-published"
                title="Delete published paper"
            >

                <i class="fa-solid fa-trash"></i>

                Delete

            </button>

        </div>

    `;


    const deleteButton =
        card.querySelector(
            '[data-action="delete-published"]'
        );


    deleteButton.addEventListener(
        "click",
        () => {

            askAction(
                "delete",
                {
                    name: filename,
                    path
                }
            );

        }
    );


    return card;

}


// =========================================
// PUBLISHED REFRESH BUTTON
// =========================================

if (refreshPublishedButton) {

    refreshPublishedButton.addEventListener(
        "click",
        async () => {

            const icon =
                refreshPublishedButton.querySelector("i");


            if (icon) {

                icon.classList.add("fa-spin");

            }


            refreshPublishedButton.disabled =
                true;


            try {

                await loadPublishedBank();

                showToast(
                    "Published question bank refreshed."
                );

            } finally {

                setTimeout(
                    () => {

                        if (icon) {

                            icon.classList.remove(
                                "fa-spin"
                            );

                        }

                        refreshPublishedButton.disabled =
                            false;

                    },
                    400
                );

            }

        }
    );

}


// =========================================
// MAIN REFRESH BUTTON
// =========================================

refreshButton.addEventListener(
    "click",
    async () => {

        const icon =
            refreshButton.querySelector("i");


        if (icon) {

            icon.classList.add("fa-spin");

        }


        refreshButton.disabled =
            true;


        try {

            await loadDashboard();

            showToast(
                "Dashboard refreshed."
            );

        } finally {

            setTimeout(
                () => {

                    if (icon) {

                        icon.classList.remove(
                            "fa-spin"
                        );

                    }

                    refreshButton.disabled =
                        false;

                },
                400
            );

        }

    }
);


// =========================================
// LOGOUT
// =========================================

logoutButton.addEventListener(
    "click",
    () => {

        // Clear stored admin authentication
        sessionStorage.removeItem(
            "admin_token"
        );

        sessionStorage.removeItem(
            "admin_authenticated"
        );


        // Clear local state
        requests = [];

        publishedSemesters = [];


        // Reset password field
        if (adminPassword) {

            adminPassword.value = "";

        }


        // IMPORTANT:
        // Redirect to admin_access.html
        // so the password verification page
        // is loaded from the correct location.

        window.location.href =
            "admin_access.html";

    }
);


// =========================================
// LAST UPDATED
// =========================================

function updateLastUpdated() {

    const now =
        new Date();

    lastUpdated.textContent =
        `Updated ${now.toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        )}`;

}


// =========================================
// FORMAT SEMESTER
// =========================================

function formatSemester(value) {

    if (!value) {

        return "Unknown Semester";

    }


    const match =
        String(value).match(
            /(\d+)/
        );


    if (match) {

        return `Semester ${String(
            match[1]
        ).padStart(2, "0")}`;

    }


    return String(value);

}


// =========================================
// GET SEMESTER NUMBER
// =========================================

function getSemesterNumber(value) {

    const match =
        String(value || "").match(
            /(\d+)/
        );


    return match
        ? Number(match[1])
        : 999;

}


// =========================================
// GET FILENAME FROM PATH
// =========================================

function getFilenameFromPath(path) {

    if (!path) {

        return "";

    }


    const parts =
        String(path)
            .split("/");


    return parts[
        parts.length - 1
    ] || "";

}


// =========================================
// DETECT EXAM
// =========================================

function detectExam(filename) {

    if (!filename) {

        return "";

    }


    const value =
        String(filename).toLowerCase();


    if (
        value.includes("mid") ||
        value.includes("midterm")
    ) {

        return "Mid";

    }


    if (
        value.includes("final")
    ) {

        return "Final";

    }


    return "";

}


// =========================================
// FORMAT FILE SIZE
// =========================================

function formatFileSize(bytes) {

    if (
        bytes === null ||
        bytes === undefined ||
        bytes === ""
    ) {

        return "";

    }


    const size =
        Number(bytes);


    if (!Number.isFinite(size)) {

        return "";

    }


    if (size < 1024) {

        return `${size} B`;

    }


    if (size < 1024 * 1024) {

        return `${(
            size / 1024
        ).toFixed(1)} KB`;

    }


    return `${(
        size / (1024 * 1024)
    ).toFixed(2)} MB`;

}


// =========================================
// FORMAT DATE
// =========================================

function formatDate(value) {

    if (!value) {

        return "Unknown time";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    return date.toLocaleString(
        [],
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


// =========================================
// AUTO LOGIN
// =========================================

(async function initAdmin() {

    const token =
        getAdminToken();


    if (!token) {

        return;

    }


    loginScreen.classList.add(
        "hidden"
    );

    dashboard.classList.remove(
        "hidden"
    );


    await loadDashboard();

})();