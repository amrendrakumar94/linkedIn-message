const form = document.getElementById("messageForm");
const statusEl = document.getElementById("status");
const tabHintEl = document.getElementById("tabHint");
const outputEl = document.getElementById("output");
const tinyUrlCheckbox = document.getElementById("useTinyUrl");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const historySearchEl = document.getElementById("historySearch");
const historyListEl = document.getElementById("historyList");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageInfoEl = document.getElementById("pageInfo");

const STORAGE_KEY = "linkedinMessageForm";
const THEME_KEY = "linkedinMessageTheme";
const HISTORY_KEY = "linkedinMessageHistory";
const ITEMS_PER_PAGE = 5;

const inExtension = typeof chrome !== "undefined" && !!chrome.runtime?.id;
const hasChromeStorageApi = typeof chrome !== "undefined" && !!chrome.storage?.local;

let currentHistoryPage = 1;
let messageHistory = [];

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function fitToCharacterLimit(message, limit = 300) {
  if (message.length <= limit) return message;
  return `${message.slice(0, limit - 3).trimEnd()}...`;
}

async function shortenUrl(url) {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return "";

  try {
    const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(trimmedUrl)}`);
    if (!response.ok) throw new Error("TinyURL request failed");
    return (await response.text()).trim() || trimmedUrl;
  } catch {
    return trimmedUrl;
  }
}

function buildMessage({ name, role, jobId, company, resume }) {
  const draft = `Hi ${name},\n\nI’m interested in ${role} role at ${company} (Job ID: ${jobId}). Could you please refer me?\n\nResume: ${resumeLink}\n\nThanks!`;
  return fitToCharacterLimit(draft, 300);
}

function getFormData() {
  return {
    name: document.getElementById("name").value.trim(),
    role: document.getElementById("role").value.trim(),
    jobId: document.getElementById("jobId").value.trim(),
    company: document.getElementById("company").value.trim(),
    resume: document.getElementById("resume").value.trim(),
    useTinyUrl: tinyUrlCheckbox.checked
  };
}

function setFormData(data = {}) {
  document.getElementById("name").value = data.name || "";
  document.getElementById("role").value = data.role || "";
  document.getElementById("jobId").value = data.jobId || "";
  document.getElementById("company").value = data.company || "";
  document.getElementById("resume").value = data.resume || "";
  tinyUrlCheckbox.checked = data.useTinyUrl ?? true;
}

function getFromLocalStorage(key, fallbackValue) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallbackValue));
  } catch {
    return fallbackValue;
  }
}

function setInLocalStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getFromChromeStorage(key, fallbackValue) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] ?? fallbackValue);
    });
  });
}

function setInChromeStorage(key, value) {
  chrome.storage.local.set({ [key]: value });
}

function getStoredFormData() {
  if (hasChromeStorageApi) return getFromChromeStorage(STORAGE_KEY, {});
  return Promise.resolve(getFromLocalStorage(STORAGE_KEY, {}));
}

function saveStoredFormData(data) {
  if (hasChromeStorageApi) {
    setInChromeStorage(STORAGE_KEY, data);
    return;
  }
  setInLocalStorage(STORAGE_KEY, data);
}

function getStoredTheme() {
  if (hasChromeStorageApi) return getFromChromeStorage(THEME_KEY, "light");
  return Promise.resolve(getFromLocalStorage(THEME_KEY, "light"));
}

function saveStoredTheme(theme) {
  if (hasChromeStorageApi) {
    setInChromeStorage(THEME_KEY, theme);
    return;
  }
  setInLocalStorage(THEME_KEY, theme);
}

function getStoredHistory() {
  if (hasChromeStorageApi) return getFromChromeStorage(HISTORY_KEY, []);
  return Promise.resolve(getFromLocalStorage(HISTORY_KEY, []));
}

function saveStoredHistory(history) {
  if (hasChromeStorageApi) {
    setInChromeStorage(HISTORY_KEY, history);
    return;
  }
  setInLocalStorage(HISTORY_KEY, history);
}

function setTheme(theme) {
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", normalizedTheme);
  themeToggleBtn.textContent = normalizedTheme === "dark" ? "☀️ Light" : "🌙 Dark";
  saveStoredTheme(normalizedTheme);
}

function getFilteredHistory() {
  const query = historySearchEl.value.trim().toLowerCase();
  if (!query) return messageHistory;

  return messageHistory.filter((entry) => {
    const company = (entry.company || "").toLowerCase();
    const role = (entry.role || "").toLowerCase();
    return company.includes(query) || role.includes(query);
  });
}

function renderHistory() {
  const filtered = getFilteredHistory();
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  currentHistoryPage = Math.min(currentHistoryPage, totalPages);

  const startIndex = (currentHistoryPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  historyListEl.innerHTML = "";

  if (pageItems.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "history-empty";
    emptyItem.textContent = filtered.length === 0
      ? "No history results yet."
      : "No items on this page.";
    historyListEl.appendChild(emptyItem);
  }

  for (const entry of pageItems) {
    const li = document.createElement("li");
    li.className = "history-item";

    const meta = document.createElement("div");
    meta.className = "history-meta";
    const createdAt = new Date(entry.createdAt).toLocaleString();
    meta.textContent = `${entry.company} • ${entry.role} • ${createdAt}`;

    const text = document.createElement("p");
    text.className = "history-text";
    text.textContent = entry.message;

    li.append(meta, text);
    historyListEl.appendChild(li);
  }

  pageInfoEl.textContent = `Page ${currentHistoryPage} of ${totalPages}`;
  prevPageBtn.disabled = currentHistoryPage <= 1;
  nextPageBtn.disabled = currentHistoryPage >= totalPages;
}

function addToHistory(data, message) {
  const historyItem = {
    company: data.company,
    role: data.role,
    message,
    createdAt: new Date().toISOString()
  };

  messageHistory = [historyItem, ...messageHistory].slice(0, 100);
  saveStoredHistory(messageHistory);
  currentHistoryPage = 1;
  renderHistory();
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  outputEl.removeAttribute("readonly");
  outputEl.select();
  document.execCommand("copy");
  outputEl.setAttribute("readonly", "true");
}

async function bootstrap() {
  if (!inExtension) {
    tabHintEl.textContent = "Web mode detected (e.g., GitHub Pages). Generate and copy your message here.";
  } else {
    tabHintEl.textContent = "Extension side panel detected. It stays open while you switch tabs.";
  }

  const [savedData, savedTheme, savedHistory] = await Promise.all([
    getStoredFormData(),
    getStoredTheme(),
    getStoredHistory()
  ]);

  setFormData(savedData);
  setTheme(savedTheme);
  messageHistory = Array.isArray(savedHistory) ? savedHistory : [];
  renderHistory();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Generating message...");

  const data = getFormData();
  if (Object.entries(data).some(([key, value]) => key !== "useTinyUrl" && !value)) {
    setStatus("Please complete all fields.", "warn");
    return;
  }

  const resumeUrl = data.useTinyUrl ? await shortenUrl(data.resume) : data.resume;
  const message = buildMessage({ ...data, resume: resumeUrl });
  outputEl.value = message;

  try {
    await copyToClipboard(message);
    setStatus("Message generated and copied to clipboard.", "success");
  } catch {
    setStatus("Message generated, but copy failed. Copy manually from the text area.", "warn");
  }

  saveStoredFormData(data);
  addToHistory(data, message);
});

themeToggleBtn.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
});

historySearchEl.addEventListener("input", () => {
  currentHistoryPage = 1;
  renderHistory();
});

prevPageBtn.addEventListener("click", () => {
  if (currentHistoryPage > 1) {
    currentHistoryPage -= 1;
    renderHistory();
  }
});

nextPageBtn.addEventListener("click", () => {
  const totalPages = Math.max(1, Math.ceil(getFilteredHistory().length / ITEMS_PER_PAGE));
  if (currentHistoryPage < totalPages) {
    currentHistoryPage += 1;
    renderHistory();
  }
});

bootstrap();
