const $ = (s, r = document) => r.querySelector(s);

const els = {
  emailInput: $("#emailInput"),
  loginBtn: $("#loginBtn"),
  authMsg: $("#authMsg"),

  logoutBtn: $("#logoutBtn"),

  meBox: $("#meBox"),
  meEmail: $("#meEmail"),

  reloadBtn: $("#reloadBtn"),
  saveBtn: $("#saveBtn"),
  catalogueJson: $("#catalogueJson"),

  reloadCfgBtn: $("#reloadCfgBtn"),
  saveCfgBtn: $("#saveCfgBtn"),
  configJson: $("#configJson"),
};

function apiBase() {
  // Admin page is served as static; backend is expected to run on 5174 in dev.
  // If you host on same origin, this still works.
  return window.location.origin.includes(":5174") ? window.location.origin : "http://localhost:5174";
}

async function api(path, options = {}) {
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = typeof body === "string" ? body : body?.error || "Request failed";
    throw new Error(msg);
  }
  return body;
}

function setEnabled(enabled) {
  els.reloadBtn.disabled = !enabled;
  els.saveBtn.disabled = !enabled;
  els.catalogueJson.disabled = !enabled;

  els.reloadCfgBtn.disabled = !enabled;
  els.saveCfgBtn.disabled = !enabled;
  els.configJson.disabled = !enabled;

  els.logoutBtn.hidden = !enabled;
  els.meBox.hidden = !enabled;
}

function showMessage(text, isError = false) {
  els.authMsg.textContent = text;
  els.authMsg.style.color = isError ? "#ef4444" : "inherit";
  els.authMsg.style.animation = "none";
  setTimeout(() => {
    els.authMsg.style.animation = "fadeIn 300ms ease";
  }, 10);
}

async function loadAll() {
  try {
    showMessage("Loading data...");
    const cat = await api("/api/catalogue/");
    els.catalogueJson.value = JSON.stringify(cat, null, 2);

    const cfg = await api("/api/config/");
    els.configJson.value = JSON.stringify(cfg, null, 2);
    showMessage("✓ Data loaded successfully");
  } catch (e) {
    showMessage(`✗ Failed to load: ${e.message}`, true);
  }
}

async function checkMe() {
  try {
    const me = await api("/api/auth/me");
    els.meEmail.textContent = me.email;
    setEnabled(true);
    await loadAll();
  } catch {
    setEnabled(false);
  }
}

els.loginBtn.addEventListener("click", async () => {
  const email = els.emailInput.value.trim();
  if (!email) {
    showMessage("Please enter an email address", true);
    return;
  }
  
  showMessage("Sending link…");
  try {
    await api("/api/auth/request-link", { method: "POST", body: JSON.stringify({ email }) });
    showMessage("✓ Login link sent! Check your email. (Dev mode: check backend console)");
  } catch (e) {
    showMessage(`✗ Error: ${e.message}`, true);
  }
});

els.logoutBtn.addEventListener("click", async () => {
  if (!confirm("Are you sure you want to logout?")) return;
  try {
    await api("/api/auth/logout", { method: "POST" });
  } finally {
    window.location.reload();
  }
});

els.reloadBtn.addEventListener("click", async () => {
  await loadAll();
});

els.saveBtn.addEventListener("click", async () => {
  try {
    showMessage("Validating JSON…");
    const parsed = JSON.parse(els.catalogueJson.value);
    showMessage("Saving catalogue…");
    await api("/api/catalogue/", { method: "PUT", body: JSON.stringify(parsed) });
    showMessage("✓ Catalogue saved successfully!");
  } catch (e) {
    showMessage(`✗ Save failed: ${e.message}`, true);
  }
});

els.reloadCfgBtn.addEventListener("click", async () => {
  await loadAll();
});

els.saveCfgBtn.addEventListener("click", async () => {
  try {
    showMessage("Validating JSON…");
    const parsed = JSON.parse(els.configJson.value);
    showMessage("Saving config…");
    await api("/api/config/", { method: "PUT", body: JSON.stringify(parsed) });
    showMessage("✓ Config saved successfully!");
  } catch (e) {
    showMessage(`✗ Save failed: ${e.message}`, true);
  }
});

// Add keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Ctrl+S or Cmd+S to save
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    if (!els.saveBtn.disabled) els.saveBtn.click();
  }
});

// Add fade-in animation
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;
document.head.appendChild(style);

checkMe();
