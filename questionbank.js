const app = document.getElementById("app");
const statusBox = document.getElementById("status");
const searchInput = document.getElementById("search");

let semesters = [];
let currentSemesterPDFs = null;
let currentSemesterName = null;
let currentExamType = "all";

// Carousel States
let currentSemesterIndex = 0;
let autoSlideTimer = null;
let touchStartX = 0;
let touchEndX = 0;

/* ==================== UTILITY FUNCTIONS ==================== */

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStatus(message, loading = false) {
  if (!statusBox) return;

  if (!message) {
    statusBox.style.display = "none";
    statusBox.innerHTML = "";
    return;
  }

  statusBox.style.display = "flex";
  statusBox.innerHTML = loading
    ? `<div class="spinner"></div><span>${escapeHTML(message)}</span>`
    : `<span>${escapeHTML(message)}</span>`;
}

/* ==================== AUTOMATED SLIDER & TOUCH SLIDE ==================== */

function startAutoSlide() {
  stopAutoSlide();
  autoSlideTimer = setInterval(() => {
    if (currentSemesterPDFs === null && semesters.length > 0) {
      nextSemesterCard();
    }
  }, 4000);
}

function stopAutoSlide() {
  if (autoSlideTimer) {
    clearInterval(autoSlideTimer);
    autoSlideTimer = null;
  }
}

function initCarouselEvents() {
  const viewport = document.querySelector('.carousel-viewport');
  if (!viewport) return;

  viewport.addEventListener('mouseenter', stopAutoSlide);
  viewport.addEventListener('mouseleave', startAutoSlide);

  viewport.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoSlide();
  }, { passive: true });

  viewport.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    if (touchStartX - touchEndX > 40) nextSemesterCard();
    else if (touchEndX - touchStartX > 40) prevSemesterCard();
    startAutoSlide();
  }, { passive: true });
}

/* ==================== FETCH DATA ==================== */

async function loadQuestionBankJSON() {
  try {
    setStatus("Loading question bank...", true);

    const QUESTION_BANK_JSON_URL =
  "https://raw.githubusercontent.com/Fardin-Prodhan/HUB_CSE_Question_Bank_V2/main/questionbank.json";

    const response = await fetch(
      `${QUESTION_BANK_JSON_URL}?ts=${Date.now()}`,
      {
        method: "GET",
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        `GitHub questionbank.json fetch failed: ${response.status}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data.semesters)) {
      throw new Error(
        "Invalid questionbank.json format"
      );
    }

    semesters = data.semesters;

    setStatus("");
    renderSemesters(semesters);

  } catch (error) {
    console.error(
      "Question Bank Error:",
      error
    );

    setStatus("");

    if (app) {
      app.innerHTML = `
        <div style="
          text-align:center;
          padding:20px;
          color:#ff4b5c;
        ">
          <i
            class="fa-solid fa-triangle-exclamation"
            style="
              font-size:32px;
              margin-bottom:10px;
            "
          ></i>

          <p>
            Unable to load question bank data.
          </p>
        </div>
      `;
    }
  }
}

/* ==================== RENDER HOMEPAGE (CAROUSEL VIEW) ==================== */

function renderSemesters(list) {
  stopAutoSlide();

  if (!list || list.length === 0) {
    app.innerHTML = `
      <div style="text-align:center; padding: 30px; color: var(--text-muted);">
        <i class="fa-regular fa-folder-open" style="font-size: 36px; margin-bottom: 10px;"></i>
        <p>No matching semesters found.</p>
      </div>
    `;
    return;
  }

  if (currentSemesterIndex >= list.length) currentSemesterIndex = 0;

  const semester = list[currentSemesterIndex];
  const number = semester.name.match(/\d+/)?.[0] || (currentSemesterIndex + 1);

  app.innerHTML = `
    <div class="carousel-container">
      <button class="nav-arrow" type="button" onclick="prevSemesterCard()">
        <i class="fa-solid fa-chevron-left"></i>
      </button>

      <div class="carousel-viewport">
        <div class="semester-card" onclick="openSemester('${encodeURIComponent(semester.name)}')">
          <div class="semester-number">
            ${escapeHTML(String(number).padStart(2, '0'))}
          </div>
          <h3>${escapeHTML(semester.name.replace("_", " "))}</h3>
          <p><i class="fa-regular fa-folder"></i> Click to view question papers</p>
        </div>
      </div>

      <button class="nav-arrow" type="button" onclick="nextSemesterCard()">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    </div>

    <div class="dots-container">
      ${list.map((_, idx) => `
        <span class="dot ${idx === currentSemesterIndex ? 'active' : ''}" onclick="goToSemesterCard(${idx})"></span>
      `).join('')}
    </div>
  `;

  initCarouselEvents();
  startAutoSlide();
}

function prevSemesterCard() {
  if (semesters.length === 0) return;
  currentSemesterIndex = (currentSemesterIndex - 1 + semesters.length) % semesters.length;
  renderSemesters(semesters);
}

function nextSemesterCard() {
  if (semesters.length === 0) return;
  currentSemesterIndex = (currentSemesterIndex + 1) % semesters.length;
  renderSemesters(semesters);
}

function goToSemesterCard(index) {
  currentSemesterIndex = index;
  renderSemesters(semesters);
}

/* ==================== OPEN SEMESTER VIEW ==================== */

function openSemester(encodedName) {
  stopAutoSlide();
  const semesterName = decodeURIComponent(encodedName);
  const semester = semesters.find(item => item.name === semesterName);

  if (!semester) return;

  currentSemesterName = semesterName;
  currentExamType = "all";

  if (searchInput) searchInput.value = "";

  currentSemesterPDFs = Array.isArray(semester.files)
    ? semester.files.filter(file => file && file.name && /\.pdf$/i.test(file.name))
    : [];

  currentSemesterPDFs.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
  );

  renderFiles(currentSemesterName, currentSemesterPDFs);
}

function getExamType(fileName) {
  const name = fileName.toLowerCase();
  const hasMid = /_mid(?:_|\.|&)/i.test(name);
  const hasFinal = /_final(?:_|\.|&)/i.test(name);

  if (hasMid && hasFinal) return "both";
  if (hasMid) return "mid";
  if (hasFinal) return "final";
  return "other";
}

function setExamFilter(type) {
  currentExamType = (currentExamType === type) ? "all" : type;
  renderFiles(currentSemesterName, currentSemesterPDFs);
}

/* ==================== RENDER PDF LIST VIEW ==================== */

function renderFiles(semesterName, pdfs) {
  stopAutoSlide();
  if (!app) return;

  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const filtered = pdfs.filter(file => {
    const fileName = file.name || "";
    const type = getExamType(fileName);

    if (currentExamType === "mid" && type !== "mid" && type !== "both") return false;
    if (currentExamType === "final" && type !== "final" && type !== "both") return false;

    return !query || fileName.toLowerCase().includes(query);
  });

  const controls = `
    <div class="semester-controls">
      <button class="back-btn-action" type="button" onclick="goHome()">
        <i class="fa-solid fa-arrow-left"></i> Back to Semesters
      </button>

      <div style="display:flex; gap:8px;">
        <button class="exam-filter-btn ${currentExamType === 'mid' ? 'active' : ''}" type="button" onclick="setExamFilter('mid')">
          Midterm
        </button>
        <button class="exam-filter-btn ${currentExamType === 'final' ? 'active' : ''}" type="button" onclick="setExamFilter('final')">
          Final
        </button>
      </div>
    </div>
  `;

  if (filtered.length === 0) {
    app.innerHTML = `
      ${controls}
      <h2 style="font-size:20px; margin-bottom:12px;">${escapeHTML(semesterName.replace("_", " "))}</h2>
      <div style="text-align:center; padding: 20px; color: var(--text-muted);">
        No question papers found.
      </div>
    `;
    return;
  }

  app.innerHTML = `
    ${controls}
    <h2 style="font-size:20px; margin-bottom:12px; color: var(--cyan-glow);">${escapeHTML(semesterName.replace("_", " "))}</h2>

    <div class="file-list-container">
      ${filtered.map(file => {
        const rawURL =`https://raw.githubusercontent.com/Fardin-Prodhan/HUB_CSE_Question_Bank_V2/main/${file.path.split("/").map(encodeURIComponent).join("/")}`;
        const viewerURL = `viewer.html?pdf=${encodeURIComponent(rawURL)}&title=${encodeURIComponent(file.name)}`;

        return `
          <div class="pdf-item-row">
            <div class="pdf-info-group">
              <i class="fa-solid fa-file-pdf pdf-icon-badge"></i>
              <div class="pdf-meta-text">
                <span class="pdf-title-text">${escapeHTML(file.name)}</span>
                <span class="pdf-subtitle-text">${escapeHTML(file.path)}</span>
              </div>
            </div>

            <div class="pdf-actions-group">
              <a class="btn-action-view" href="${viewerURL}">
                <i class="fa-regular fa-eye"></i> View
              </a>
              <a class="btn-action-download" href="${rawURL}" download>
                <i class="fa-solid fa-download"></i> Download
              </a>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

/* ==================== GO HOME & SEARCH HANDLERS ==================== */

function goHome() {
  currentSemesterPDFs = null;
  currentSemesterName = null;
  currentExamType = "all";

  if (searchInput) searchInput.value = "";
  renderSemesters(semesters);
}

if (searchInput) {
  searchInput.addEventListener("input", function () {
    const query = this.value.trim().toLowerCase();

    if (currentSemesterPDFs !== null) {
      renderFiles(currentSemesterName, currentSemesterPDFs);
      return;
    }

    const filtered = semesters.filter(semester => {
      const name = semester.name.toLowerCase();
      const number = semester.name.match(/\d+/)?.[0] || "";
      return name.includes(query) || number === query;
    });

    renderSemesters(filtered);
  });
}

loadQuestionBankJSON();