const form = document.getElementById("messageForm");
const statusEl = document.getElementById("status");
const tabHintEl = document.getElementById("tabHint");
const outputEl = document.getElementById("output");
const tinyUrlCheckbox = document.getElementById("useTinyUrl");

const STORAGE_KEY = "linkedinMessageDraft";
const hasChromeStorageApi = typeof chrome !== "undefined" && !!chrome.storage?.local;

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
  const draft = `Hi ${name}, I’m interested in the ${role} role at ${company} (Job ID: ${jobId}). Could you please refer me or share the referral link? Resume: ${resume}. Thanks!`;
  return fitToCharacterLimit(draft, 300);
}

function getFormData() {
  return {
    name: document.getElementById("name").value.trim(),
    role: document.getElementById("role").value.trim(),
    jobId: document.getElementById("jobId").value.trim(),
    company: document.getElementById("company").value.trim(),
    resume: document.getElementById("resume").value.trim(),
    useTinyUrl: tinyUrlCheckbox.checked,
    output: outputEl.value
  };
}

function setFormData(data = {}) {
  document.getElementById("name").value = data.name || "";
  document.getElementById("role").value = data.role || "";
  document.getElementById("jobId").value = data.jobId || "";
  document.getElementById("company").value = data.company || "";
  document.getElementById("resume").value = data.resume || "";
  tinyUrlCheckbox.checked = data.useTinyUrl ?? true;
  outputEl.value = data.output || "";
}

function getStoredFormData() {
  if (hasChromeStorageApi) {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        resolve(result[STORAGE_KEY] || {});
      });
    });
  }

  try {
    return Promise.resolve(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
  } catch {
    return Promise.resolve({});
  }
}

function saveStoredFormData(data) {
  if (hasChromeStorageApi) {
    chrome.storage.local.set({ [STORAGE_KEY]: data });
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function persistDraft() {
  const currentData = getFormData();
  saveStoredFormData(currentData);
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
  tabHintEl.textContent = "Works on any tab. Your latest draft stays saved when you switch tabs.";

  const savedData = await getStoredFormData();
  setFormData(savedData);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Generating message...");

  const data = getFormData();
  if (Object.entries(data).some(([key, value]) => key !== "useTinyUrl" && key !== "output" && !value)) {
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

  persistDraft();
});

form.addEventListener("input", persistDraft);
form.addEventListener("change", persistDraft);

bootstrap();
