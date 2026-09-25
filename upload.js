document.addEventListener("DOMContentLoaded", () => {

    const API_URL =
        "https://cse-question-bank-api.fardin83832006.workers.dev";

    const MAX_FILE_SIZE =
        15 * 1024 * 1024; // 15 MB


    // =========================================
    // ELEMENTS
    // =========================================

    const form =
        document.getElementById("uploadForm");

    const crIdInput =
        document.getElementById("crId");

    const crNameInput =
        document.getElementById("crName");

    const whatsappInput =
        document.getElementById("whatsappNumber");

    const batchInput =
        document.getElementById("batchNo");

    const sessionInput =
        document.getElementById("sessionName");

    const yearInput =
        document.getElementById("yearNo");

    const examInput =
        document.getElementById("examName");

    const semesterInput =
        document.getElementById("semesterNo");

    const fileUploadButton =
        document.getElementById("fileUploadButton");

    const pdfFileInput =
        document.getElementById("pdfFileInput");

    const pdfPreview =
        document.getElementById("pdfPreview");

    const pdfInfo =
        document.getElementById("pdfInfo");

    const submitButton =
        document.getElementById("uploadButton");

    const generatedPathPreview =
        document.getElementById(
            "generatedPathPreview"
        );

    const generatedFilename =
        document.getElementById(
            "generatedFilename"
        );

    const generatedPath =
        document.getElementById(
            "generatedPath"
        );


    // =========================================
    // STATE
    // =========================================

    let selectedPDF = null;


    // =========================================
    // INITIAL STATE
    // =========================================

    if (submitButton) {

        submitButton.disabled = true;

    }


    // =========================================
    // FILE SELECT BUTTON
    // =========================================

    if (
        fileUploadButton &&
        pdfFileInput
    ) {

        fileUploadButton.addEventListener(
            "click",
            () => {

                pdfFileInput.click();

            }
        );

    }


    // =========================================
    // PDF SELECTED
    // =========================================

    if (pdfFileInput) {

        pdfFileInput.addEventListener(
            "change",
            async () => {

                const file =
                    pdfFileInput.files[0];

                if (!file) {

                    return;

                }


                // -----------------------------
                // MIME TYPE
                // -----------------------------

                if (
                    file.type !==
                    "application/pdf"
                ) {

                    showMessage(
                        "Please select a valid PDF file.",
                        "error"
                    );

                    resetPDF();

                    return;

                }


                // -----------------------------
                // SIZE
                // -----------------------------

                if (
                    file.size >
                    MAX_FILE_SIZE
                ) {

                    showMessage(
                        "PDF size must be 15 MB or less.",
                        "error"
                    );

                    resetPDF();

                    return;

                }


                // -----------------------------
                // SIGNATURE
                // -----------------------------

                const isPDF =
                    await checkPDFSignature(
                        file
                    );


                if (!isPDF) {

                    showMessage(
                        "This file is not a valid PDF.",
                        "error"
                    );

                    resetPDF();

                    return;

                }


                selectedPDF = file;


                showPDFPreview(
                    file
                );


                showMessage(
                    "PDF selected successfully.",
                    "success"
                );


                updateSubmitState();

            }
        );

    }


    // =========================================
    // LIVE PATH GENERATION
    // =========================================

    const academicInputs = [
        batchInput,
        sessionInput,
        yearInput,
        examInput,
        semesterInput
    ];


    academicInputs.forEach(
        input => {

            if (!input) {

                return;

            }


            input.addEventListener(
                "input",
                updateGeneratedPath
            );

        }
    );


    // =========================================
    // GENERATE FILENAME + PATH
    // =========================================

    function getGeneratedFileData() {

        const batch =
            normalizeBatch(
                batchInput?.value
            );

        const session =
            normalizeSession(
                sessionInput?.value
            );

        const year =
            normalizeYear(
                yearInput?.value
            );

        const exam =
            normalizeExam(
                examInput?.value
            );

        const semester =
            normalizeSemester(
                semesterInput?.value
            );


        if (
            !batch ||
            !session ||
            !year ||
            !exam ||
            !semester
        ) {

            return null;

        }


        const filename =
            `Batch-${batch}_${session}-${year}_${exam}.pdf`;


        const path =
            `Semester_${semester}/${filename}`;


        return {
            batch,
            session,
            year,
            exam,
            semester,
            filename,
            path
        };

    }


    // =========================================
    // UPDATE GENERATED PATH PREVIEW
    // =========================================

    function updateGeneratedPath() {

        const data =
            getGeneratedFileData();


        if (!data) {

            if (generatedPathPreview) {

                generatedPathPreview.classList.add(
                    "hidden"
                );

            }

            updateSubmitState();

            return;

        }


        if (generatedFilename) {

            generatedFilename.textContent =
                data.filename;

        }


        if (generatedPath) {

            generatedPath.textContent =
                data.path;

        }


        if (generatedPathPreview) {

            generatedPathPreview.classList.remove(
                "hidden"
            );

        }


        updateSubmitState();

    }


    // =========================================
    // SUBMIT STATE
    // =========================================

    function updateSubmitState() {

        if (!submitButton) {

            return;

        }


        const academicData =
            getGeneratedFileData();


        submitButton.disabled =
            !selectedPDF ||
            !academicData;

    }


    // =========================================
    // NORMALIZE BATCH
    // =========================================

    function normalizeBatch(value) {

        const raw =
            String(value || "")
                .trim();


        if (!/^\d+$/.test(raw)) {

            return "";

        }


        const number =
            Number(raw);


        if (
            !Number.isInteger(number) ||
            number <= 0 ||
            number > 999
        ) {

            return "";

        }


        return String(number);

    }


    // =========================================
    // NORMALIZE SESSION
    // =========================================

    function normalizeSession(value) {

        const raw =
            String(value || "")
                .trim()
                .replace(/\s+/g, " ");


        if (!raw) {

            return "";

        }


        const normalized =
            raw.toLowerCase();


        if (
            normalized === "spring"
        ) {

            return "Spring";

        }


        if (
            normalized === "fall"
        ) {

            return "Fall";

        }


        return "";

    }


    // =========================================
    // NORMALIZE YEAR
    // =========================================

    function normalizeYear(value) {

        const raw =
            String(value || "")
                .trim();


        if (!/^\d{4}$/.test(raw)) {

            return "";

        }


        const year =
            Number(raw);


        if (
            year < 2000 ||
            year > 2100
        ) {

            return "";

        }


        return String(year);

    }


    // =========================================
    // NORMALIZE EXAM
    // =========================================

    function normalizeExam(value) {

        const raw =
            String(value || "")
                .trim()
                .toLowerCase();


        if (
            raw === "mid" ||
            raw === "midterm"
        ) {

            return "Mid";

        }


        if (
            raw === "final"
        ) {

            return "Final";

        }


        return "";

    }


    // =========================================
    // NORMALIZE SEMESTER
    // =========================================

    function normalizeSemester(value) {

        const raw =
            String(value || "")
                .trim();


        if (!/^\d{1,2}$/.test(raw)) {

            return "";

        }


        const number =
            Number(raw);


        if (
            number < 1 ||
            number > 8
        ) {

            return "";

        }


        return String(number)
            .padStart(2, "0");

    }


    // =========================================
    // PDF SIGNATURE CHECK
    // =========================================

    async function checkPDFSignature(file) {

        try {

            const buffer =
                await file
                    .slice(0, 5)
                    .arrayBuffer();


            const bytes =
                new Uint8Array(buffer);


            const signature =
                String.fromCharCode(
                    ...bytes
                );


            return signature === "%PDF-";

        } catch (error) {

            console.error(
                "PDF signature error:",
                error
            );

            return false;

        }

    }


    // =========================================
    // SHOW PDF PREVIEW
    // =========================================

    function showPDFPreview(file) {

        if (!pdfPreview) {

            return;

        }


        const sizeMB =
            (
                file.size /
                (1024 * 1024)
            ).toFixed(2);


        if (pdfInfo) {

            pdfInfo.textContent =
                `${file.name} • ${sizeMB} MB`;

        }


        pdfPreview.classList.remove(
            "hidden"
        );

    }


    // =========================================
    // HIDE PDF PREVIEW
    // =========================================

    function hidePDFPreview() {

        if (pdfPreview) {

            pdfPreview.classList.add(
                "hidden"
            );

        }

    }


    // =========================================
    // RESET PDF
    // =========================================

    function resetPDF() {

        selectedPDF = null;


        if (pdfFileInput) {

            pdfFileInput.value = "";

        }


        hidePDFPreview();

        updateSubmitState();

    }


    // =========================================
    // FORM SUBMIT
    // =========================================

    if (form) {

        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                // =================================
                // BASIC INFORMATION
                // =================================

                const crId =
                    crIdInput.value.trim();


                const crName =
                    crNameInput.value.trim();


                const whatsappNumber =
                    whatsappInput
                        ? whatsappInput.value.trim()
                        : "";


                // =================================
                // ACADEMIC INFORMATION
                // =================================

                const batch =
                    normalizeBatch(
                        batchInput.value
                    );


                const session =
                    normalizeSession(
                        sessionInput.value
                    );


                const year =
                    normalizeYear(
                        yearInput.value
                    );


                const exam =
                    normalizeExam(
                        examInput.value
                    );


                const semester =
                    normalizeSemester(
                        semesterInput.value
                    );


                // =================================
                // CR ID
                // =================================

                if (!crId) {

                    showMessage(
                        "Please enter your CR ID.",
                        "error"
                    );

                    crIdInput.focus();

                    return;

                }


                // =================================
                // CR NAME
                // =================================

                if (!crName) {

                    showMessage(
                        "Please enter your name.",
                        "error"
                    );

                    crNameInput.focus();

                    return;

                }


                // =================================
                // WHATSAPP
                // =================================

                if (!whatsappNumber) {

                    showMessage(
                        "Please enter your WhatsApp number.",
                        "error"
                    );

                    if (whatsappInput) {

                        whatsappInput.focus();

                    }

                    return;

                }


                const normalizedWhatsApp =
                    whatsappNumber.replace(
                        /[\s\-()]/g,
                        ""
                    );


                const validBangladeshNumber =
                    /^(\+8801|8801|01)\d{9}$/
                        .test(
                            normalizedWhatsApp
                        );


                if (!validBangladeshNumber) {

                    showMessage(
                        "Please enter a valid Bangladesh WhatsApp number.",
                        "error"
                    );

                    whatsappInput.focus();

                    return;

                }


                // =================================
                // BATCH
                // =================================

                if (!batch) {

                    showMessage(
                        "Batch number must contain numbers only.",
                        "error"
                    );

                    batchInput.focus();

                    return;

                }


                // =================================
                // SESSION
                // =================================

                if (!session) {

                    showMessage(
                        "Session must be Spring or Fall.",
                        "error"
                    );

                    sessionInput.focus();

                    return;

                }


                // =================================
                // YEAR
                // =================================

                if (!year) {

                    showMessage(
                        "Academic year must be a valid 4-digit year.",
                        "error"
                    );

                    yearInput.focus();

                    return;

                }


                // =================================
                // EXAM
                // =================================

                if (!exam) {

                    showMessage(
                        "Examination must be Mid or Final.",
                        "error"
                    );

                    examInput.focus();

                    return;

                }


                // =================================
                // SEMESTER
                // =================================

                if (!semester) {

                    showMessage(
                        "Semester must be between 01 and 08.",
                        "error"
                    );

                    semesterInput.focus();

                    return;

                }


                // =================================
                // PDF
                // =================================

                if (!selectedPDF) {

                    showMessage(
                        "Please choose a PDF question paper.",
                        "error"
                    );

                    return;

                }


                // =================================
                // CR SESSION
                // =================================

                const crToken =
                    sessionStorage.getItem(
                        "cr_token"
                    );


                if (!crToken) {

                    showMessage(
                        "Your CR session has expired. Please login again.",
                        "error"
                    );

                    return;

                }


                // =================================
                // GENERATE SYSTEM FILE DATA
                // =================================

                const fileData =
                    getGeneratedFileData();


                if (!fileData) {

                    showMessage(
                        "Could not generate the question paper path.",
                        "error"
                    );

                    return;

                }


                /*
                    IMPORTANT:

                    Original uploaded PDF filename
                    is NOT used here.

                    System-generated filename:
                    Batch-26_Fall-2024_Mid.pdf

                    System-generated path:
                    Semester_02/Batch-26_Fall-2024_Mid.pdf
                */


                // =================================
                // FORMDATA
                // =================================

                const formData =
                    new FormData();


                formData.append(
                    "cr_id",
                    crId
                );


                formData.append(
                    "cr_name",
                    crName
                );


                formData.append(
                    "whatsapp_number",
                    normalizedWhatsApp
                );


                formData.append(
                    "batch_no",
                    fileData.batch
                );


                formData.append(
                    "session",
                    fileData.session
                );


                formData.append(
                    "year",
                    fileData.year
                );


                formData.append(
                    "exam",
                    fileData.exam
                );


                formData.append(
                    "semester_no",
                    fileData.semester
                );


                /*
                    These are generated by the frontend
                    for preview/compatibility.

                    The Worker MUST independently
                    regenerate them from the academic
                    fields instead of trusting them.
                */

                formData.append(
                    "filename",
                    fileData.filename
                );


                formData.append(
                    "github_path",
                    fileData.path
                );


                formData.append(
                    "file",
                    selectedPDF
                );


                // =================================
                // SUBMIT BUTTON
                // =================================

                const originalText =
                    submitButton
                        ? submitButton.textContent
                        : "Submit for Review";


                if (submitButton) {

                    submitButton.disabled = true;

                    submitButton.innerHTML =
                        `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;

                }


                // =================================
                // UPLOAD REQUEST
                // =================================

                try {

                    const response =
                        await fetch(
                            `${API_URL}/upload-request`,
                            {
                                method: "POST",

                                headers: {
                                    "Authorization":
                                        `Bearer ${crToken}`
                                },

                                body: formData
                            }
                        );


                    const data =
                        await response
                            .json()
                            .catch(
                                () => ({})
                            );


                    if (!response.ok) {

                        throw new Error(
                            data.error ||
                            data.message ||
                            "Upload failed."
                        );

                    }


                    // =================================
                    // SUCCESS
                    // =================================

                    showMessage(
                        `Question paper submitted successfully. Generated file: ${fileData.filename}`,
                        "success"
                    );


                    form.reset();

                    selectedPDF = null;


                    if (pdfFileInput) {

                        pdfFileInput.value = "";

                    }


                    hidePDFPreview();


                    if (generatedPathPreview) {

                        generatedPathPreview.classList.add(
                            "hidden"
                        );

                    }


                    updateSubmitState();


                } catch (error) {

                    console.error(
                        "Upload error:",
                        error
                    );


                    showMessage(
                        error.message ||
                        "Something went wrong while uploading.",
                        "error"
                    );


                } finally {

                    if (submitButton) {

                        submitButton.innerHTML =
                            originalText ||
                            "Submit for Review";

                        updateSubmitState();

                    }

                }

            }
        );

    }


    // =========================================
    // MESSAGE
    // =========================================

    function showMessage(
        message,
        type = "info"
    ) {

        let messageBox =
            document.getElementById(
                "message"
            );


        if (!messageBox) {

            messageBox =
                document.createElement(
                    "div"
                );

            messageBox.id =
                "message";


            form.parentNode.insertBefore(
                messageBox,
                form
            );

        }


        messageBox.textContent =
            message;


        messageBox.className =
            `message ${type}`;


        messageBox.classList.remove(
            "hidden"
        );


        messageBox.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


        clearTimeout(
            messageBox.hideTimer
        );


        messageBox.hideTimer =
            setTimeout(
                () => {

                    messageBox.classList.add(
                        "hidden"
                    );

                },
                6000
            );

    }

});