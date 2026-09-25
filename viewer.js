import * as pdfjsLib from
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";


// =====================================================
// PDF.JS WORKER
// =====================================================

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";


// =====================================================
// URL PARAMETERS
// =====================================================

const params =
  new URLSearchParams(window.location.search);

const pdfURL =
  params.get("pdf");

const previewId =
  params.get("id");

const title =
  params.get("title");


// =====================================================
// DOM ELEMENTS
// =====================================================

const container =
  document.getElementById("pdf-container");

const loading =
  document.getElementById("loading");

const viewerTitle =
  document.getElementById("viewer-title");

const backBtn =
  document.getElementById("backBtn");


// =====================================================
// TITLE
// =====================================================

if (title) {

  let decodedTitle = title;

  try {
    decodedTitle =
      decodeURIComponent(title);
  } catch {
    decodedTitle = title;
  }

  viewerTitle.textContent =
    decodedTitle;

  document.title =
    `${decodedTitle} - HUB CSE Question Bank`;

}


// =====================================================
// BACK TO HOME
// =====================================================

function goHome() {

  if (previewId) {

    // Admin preview থেকে এসেছে
    window.location.href =
      "admin.html";

  } else {

    // Normal student question view
    window.location.href =
      "index.html";

  }

}

backBtn.addEventListener(
  "click",
  goHome
);

window.goHome =
  goHome;


// =====================================================
// DEVICE CHECK
// =====================================================

function isMobile() {

  return (
    window.innerWidth <= 600 ||
    /Android|iPhone|iPad|iPod/i.test(
      navigator.userAgent
    )
  );

}


// =====================================================
// GET PDF URL SAFELY
// =====================================================

async function getPDFURL() {

  /*
   * Normal PDF URL
   */
  if (pdfURL) {

    let url;

    try {

      url =
        decodeURIComponent(pdfURL);

    } catch {

      url =
        pdfURL;

    }

    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("data:application/pdf")
    ) {

      return url;

    }

  }


  /*
   * Admin preview PDF
   */
 
if (previewId) {

  const token =
    sessionStorage.getItem("admin_token");

  console.log("Preview ID:", previewId);
  console.log(
    "Admin token exists:",
    !!token
  );

  if (!token) {
    throw new Error(
      "Admin session expired. Please login again."
    );
  }

  const response =
    await fetch(
      `https://cse-question-bank-api.fardin83832006.workers.dev/admin/preview?id=${encodeURIComponent(previewId)}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

  console.log(
    "Preview response:",
    response.status,
    response.statusText
  );

  if (!response.ok) {

    const errorText =
      await response.text();

    console.error(
      "Preview API error:",
      errorText
    );

    throw new Error(
      `Preview PDF failed (${response.status}): ${errorText}`
    );
  }

  const blob =
    await response.blob();

  console.log(
    "Preview blob:",
    blob.type,
    blob.size
  );

  if (
    blob.type &&
    blob.type !== "application/pdf"
  ) {
    throw new Error(
      `Server returned ${blob.type} instead of PDF.`
    );
  }

  return URL.createObjectURL(blob);
}

  

}


// =====================================================
// LOADING STATE
// =====================================================

function showLoading() {

  container.innerHTML = `
    <div id="loading" class="loading">

      <div class="spinner"></div>

      <div class="loading-title">
        Loading question paper...
      </div>

      <div class="loading-subtitle">
        Please wait
      </div>

    </div>
  `;

}


// =====================================================
// ERROR STATE
// =====================================================

function showError(error) {

  console.error(
    "PDF Viewer Error:",
    error
  );


  const errorMessage =
    error?.message ||
    "Unknown PDF loading error.";


  container.innerHTML = `

    <div class="error">

      <button
        id="errorBackBtn"
        class="back-btn"
        type="button"
      >

        <i class="fa-solid fa-arrow-left"></i>

        <span>
          Back to Question Bank
        </span>

      </button>


      <h3>
        ⚠️ Unable to load question paper
      </h3>


      <p>
        The PDF could not be loaded.
        Please check your internet connection
        and try again.
      </p>


      <div class="error-details">
        ${escapeHtml(errorMessage)}
      </div>

    </div>

  `;


  const errorBackBtn =
    document.getElementById(
      "errorBackBtn"
    );


  if (errorBackBtn) {

    errorBackBtn.addEventListener(
      "click",
      goHome
    );

  }

}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHtml(text) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    text;

  return div.innerHTML;

}


// =====================================================
// CALCULATE SCALE
// =====================================================

function getScale(page) {

  const pageViewport =
    page.getViewport({
      scale: 1
    });


  const availableWidth =
    Math.min(
      window.innerWidth,
      document.documentElement.clientWidth
    );


  const horizontalPadding =
    isMobile()
      ? 0
      : 16;


  const targetWidth =
    Math.max(
      280,
      availableWidth -
        horizontalPadding
    );


  let scale =
    targetWidth /
    pageViewport.width;


  /*
   * Desktop quality
   */

  if (!isMobile()) {

    scale =
      Math.min(
        Math.max(
          scale,
          1.2
        ),
        1.8
      );

  }


  /*
   * Mobile quality
   */

  if (isMobile()) {

    scale =
      Math.min(
        Math.max(
          scale,
          0.8
        ),
        1.5
      );

  }


  return scale;

}


// =====================================================
// RENDER ONE PAGE
// =====================================================

async function renderPage(
  pdf,
  pageNumber
) {

  const page =
    await pdf.getPage(
      pageNumber
    );


  const scale =
    getScale(page);


  const viewport =
    page.getViewport({
      scale
    });


  const pageBox =
    document.createElement(
      "div"
    );


  pageBox.className =
    "pdf-page";


  const canvas =
    document.createElement(
      "canvas"
    );


  const context =
    canvas.getContext(
      "2d",
      {
        alpha: false
      }
    );


  /*
   * Device pixel ratio
   */

  const devicePixelRatio =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );


  canvas.width =
    Math.floor(
      viewport.width *
        devicePixelRatio
    );


  canvas.height =
    Math.floor(
      viewport.height *
        devicePixelRatio
    );


  /*
   * CSS size remains normal
   */

  canvas.style.width =
    `${viewport.width}px`;


  canvas.style.height =
    `${viewport.height}px`;


  pageBox.appendChild(
    canvas
  );


  container.appendChild(
    pageBox
  );


  /*
   * Render with device pixel ratio
   */

  const renderContext = {

    canvasContext:
      context,

    viewport:
      viewport,

    transform:
      devicePixelRatio !== 1

        ? [
            devicePixelRatio,
            0,
            0,
            devicePixelRatio,
            0,
            0
          ]

        : null

  };


  await page
    .render(
      renderContext
    )
    .promise;


  /*
   * Release page object
   */

  page.cleanup();

}


// =====================================================
// LOAD PDF
// =====================================================

async function loadPDF() {

  let objectURL = null;


  try {

    showLoading();


    const url =
      await getPDFURL();


    /*
     * Remember Blob URL so we can
     * revoke it after rendering.
     */

    if (
      url.startsWith(
        "blob:"
      )
    ) {

      objectURL =
        url;

    }


    console.log(
      "Loading PDF:",
      url
    );


    /*
     * PDF.js loading
     */

    const loadingTask =
      pdfjsLib.getDocument({

        url: url,

        /*
         * Mobile compatibility
         */

        disableStream: true,

        disableAutoFetch: true,

        /*
         * Keep CORS enabled
         */

        withCredentials: false

      });


    /*
     * Progress feedback
     */

    loadingTask.onProgress =
      function (progress) {

        if (
          progress.total > 0
        ) {

          const percent =
            Math.round(
              (
                progress.loaded /
                progress.total
              ) * 100
            );


          const subtitle =
            document.querySelector(
              ".loading-subtitle"
            );


          if (subtitle) {

            subtitle.textContent =
              `Loading ${percent}%`;

          }

        }

      };


    /*
     * Load PDF
     */

    const pdf =
      await loadingTask.promise;


    console.log(
      "PDF loaded successfully.",
      "Pages:",
      pdf.numPages
    );


    /*
     * Remove loading screen
     */

    container.innerHTML =
      "";


    /*
     * Render pages sequentially
     *
     * Safer for mobile RAM.
     */

    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber++
    ) {

      await renderPage(
        pdf,
        pageNumber
      );

    }


    /*
     * Cleanup
     */

    await pdf.cleanup();


    console.log(
      "PDF rendering completed."
    );


  }

  catch (error) {

    showError(
      error
    );

  }

  finally {

    /*
     * Release temporary Blob URL
     */

    if (objectURL) {

      URL.revokeObjectURL(
        objectURL
      );

    }

  }

}


// =====================================================
// START
// =====================================================

loadPDF();