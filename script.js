// === CONFIG ===
const API_KEY = "AIzaSyD31jjNmYQWOwOnkUHwJpucsU_HceUAJWw";       // Replace with restricted API key
const ROOT_FOLDER_ID = "19hxtBDM7U6IRepoEZiOHVG2MK_erNdrk"; // Replace with your shared folder ID

// Elements
const fileList = document.getElementById("file-list");
const modal = document.getElementById("viewer-modal");
const closeViewer = document.getElementById("close-viewer");
const viewer = document.getElementById("file-viewer");
const breadcrumb = document.getElementById("breadcrumb");

let folderStack = [{ id: ROOT_FOLDER_ID, name: "Shared Folder" }];

// Load Google API
function gapiLoaded() {
  gapi.load("client", initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  });
  listFiles(ROOT_FOLDER_ID);
}

async function listFiles(folderId) {
  fileList.innerHTML = "Loading...";

  let response;
  try {
    response = await gapi.client.drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      orderBy: "folder,name",
      pageSize: 50,
      fields: "files(id, name, mimeType, thumbnailLink, webViewLink)"
    });
  } catch (err) {
    console.error(err.message);
    fileList.innerHTML = "Error loading files.";
    return;
  }

  const files = response.result.files;
  fileList.innerHTML = "";

  if (!files || files.length === 0) {
    fileList.innerHTML = "No files here.";
    return;
  }

  files.forEach(file => {
    const div = document.createElement("div");
    div.className = "file-card";

    if (file.mimeType === "application/vnd.google-apps.folder") {
      div.innerHTML = `
        <div class="folder-icon">📁</div>
        <div class="file-name">${file.name}</div>
      `;
      div.onclick = () => enterFolder(file);
    } else {
      const icon = file.mimeType.startsWith("image/") ? "🖼️" : "📄";
      div.innerHTML = `
        <div class="file-icon">${icon}</div>
        <div class="file-name">${file.name}</div>
      `;
      div.onclick = () => openViewer(file);
    }
    fileList.appendChild(div);
  });

  updateBreadcrumb();
}

function enterFolder(folder) {
  folderStack.push({ id: folder.id, name: folder.name });
  listFiles(folder.id);
}

function updateBreadcrumb() {
  breadcrumb.innerHTML = "";
  folderStack.forEach((f, index) => {
    const span = document.createElement("span");
    span.textContent = f.name;
    span.onclick = () => {
      folderStack = folderStack.slice(0, index + 1);
      listFiles(f.id);
    };
    breadcrumb.appendChild(span);
    if (index < folderStack.length - 1) {
      breadcrumb.append(" > ");
    }
  });
}

function openViewer(file) {
  modal.classList.remove("hidden");
  if (file.mimeType === "application/pdf") {
    viewer.src = `https://drive.google.com/file/d/${file.id}/preview`;
  } else if (file.mimeType.startsWith("image/")) {
    viewer.src = file.webViewLink;
  } else {
    viewer.src = file.webViewLink;
  }
}

closeViewer.onclick = () => {
  modal.classList.add("hidden");
  viewer.src = "";
};

// Initialize GAPI
window.gapiLoaded = gapiLoaded;
