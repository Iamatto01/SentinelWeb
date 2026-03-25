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

  reloadTemplatesBtn: $("#reloadTemplatesBtn"),
  templateSearchInput: $("#templateSearchInput"),
  templateList: $("#templateList"),
  templateCountBadge: $("#templateCountBadge"),
  templateTargetBadge: $("#templateTargetBadge"),
  activeTemplateName: $("#activeTemplateName"),
  openPreviewLink: $("#openPreviewLink"),
  editorHint: $("#editorHint"),
  editorFrame: $("#editorFrame"),

  addHeroBoxBtn: $("#addHeroBoxBtn"),
  addFeatureBoxBtn: $("#addFeatureBoxBtn"),
  addCardsBoxBtn: $("#addCardsBoxBtn"),
  imageUrlInput: $("#imageUrlInput"),
  insertImageBtn: $("#insertImageBtn"),
  saveTemplateBtn: $("#saveTemplateBtn"),
};

const state = {
  templates: [],
  filteredTemplates: [],
  activeTemplate: null,
  frameDoc: null,
  selectedNode: null,
};

function apiBase() {
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

function showMessage(text, isError = false) {
  els.authMsg.textContent = text;
  els.authMsg.style.color = isError ? "#c62828" : "inherit";
}

function setCoreEnabled(enabled) {
  els.reloadBtn.disabled = !enabled;
  els.saveBtn.disabled = !enabled;
  els.catalogueJson.disabled = !enabled;
  els.reloadCfgBtn.disabled = !enabled;
  els.saveCfgBtn.disabled = !enabled;
  els.configJson.disabled = !enabled;

  els.reloadTemplatesBtn.disabled = !enabled;
  els.templateSearchInput.disabled = !enabled;

  els.logoutBtn.hidden = !enabled;
  els.meBox.hidden = !enabled;
}

function setEditorEnabled(enabled) {
  els.addHeroBoxBtn.disabled = !enabled;
  els.addFeatureBoxBtn.disabled = !enabled;
  els.addCardsBoxBtn.disabled = !enabled;
  els.imageUrlInput.disabled = !enabled;
  els.insertImageBtn.disabled = !enabled;
  els.saveTemplateBtn.disabled = !enabled;
}

function renderTemplateList() {
  const search = els.templateSearchInput.value.trim().toLowerCase();
  state.filteredTemplates = state.templates.filter((tpl) => {
    if (!search) return true;
    return tpl.name.toLowerCase().includes(search) || tpl.slug.includes(search);
  });

  els.templateList.innerHTML = "";

  if (state.filteredTemplates.length === 0) {
    const empty = document.createElement("div");
    empty.className = "template-empty";
    empty.textContent = "No templates match this search.";
    els.templateList.append(empty);
    return;
  }

  for (const tpl of state.filteredTemplates) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "template-item";
    if (state.activeTemplate?.slug === tpl.slug) row.classList.add("active");
    row.innerHTML = `
      <span class="template-item__name">${tpl.name}</span>
      <span class="template-item__meta">${tpl.slug}</span>
    `;
    row.addEventListener("click", () => openTemplate(tpl.slug));
    els.templateList.append(row);
  }
}

async function loadTemplates() {
  const data = await api("/api/templates/");
  state.templates = data.items || [];
  els.templateCountBadge.textContent = `${data.count || 0} templates found`;
  els.templateTargetBadge.textContent = data.meetsThirtyTemplateTarget
    ? "Target met: 30+ templates"
    : "Target not met: add more templates";
  els.templateTargetBadge.classList.toggle("pill--success", Boolean(data.meetsThirtyTemplateTarget));
  renderTemplateList();
}

function createEditorStyle(doc) {
  const style = doc.createElement("style");
  style.textContent = `
    .sw-hoverable:hover { outline: 2px dashed rgba(207,132,34,0.65) !important; cursor: text !important; }
    .sw-selected { outline: 2px solid #cf8422 !important; box-shadow: 0 0 0 4px rgba(207,132,34,0.18) !important; }
    [data-sw-module] { position: relative; }
    [data-sw-module]::before {
      content: attr(data-sw-module);
      position: absolute;
      top: 6px;
      right: 8px;
      background: rgba(13,27,29,0.82);
      color: #fff;
      font: 600 11px/1 sans-serif;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 4px 6px;
      border-radius: 6px;
      pointer-events: none;
    }
  `;
  doc.head.append(style);
}

function clearSelection() {
  if (state.selectedNode) {
    state.selectedNode.classList.remove("sw-selected");
    if (state.selectedNode.hasAttribute("contenteditable")) {
      state.selectedNode.removeAttribute("contenteditable");
    }
  }
  state.selectedNode = null;
}

function selectEditableNode(node) {
  clearSelection();
  state.selectedNode = node;
  node.classList.add("sw-selected");

  if (node.tagName !== "IMG") {
    node.setAttribute("contenteditable", "true");
    node.focus();
  }
}

function initFrameEditor() {
  const doc = els.editorFrame.contentDocument;
  if (!doc) return;
  state.frameDoc = doc;
  clearSelection();

  createEditorStyle(doc);

  const selectors = "h1,h2,h3,h4,h5,h6,p,span,li,a,button,label,small,strong,em,blockquote,img";
  doc.querySelectorAll(selectors).forEach((node) => node.classList.add("sw-hoverable"));

  doc.addEventListener(
    "click",
    (event) => {
      const t = event.target;
      const editable = t.closest(selectors);
      const anchor = t.closest("a");
      if (anchor) event.preventDefault();
      if (!editable) {
        clearSelection();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      selectEditableNode(editable);
      els.editorHint.textContent = `Selected: <${editable.tagName.toLowerCase()}>. Type to edit text.`;
    },
    true
  );
}

function editorContainerNode() {
  if (!state.frameDoc) return null;
  return state.frameDoc.querySelector("main") || state.frameDoc.body;
}

function appendModule(html) {
  const container = editorContainerNode();
  if (!container) return;
  container.insertAdjacentHTML("beforeend", html);
  initFrameEditor();
}

function addHeroModule() {
  appendModule(`
    <section data-sw-module="Hero Box" style="margin:24px auto;max-width:1100px;padding:56px 24px;border-radius:24px;background:linear-gradient(130deg,#18303a,#2f5c63);color:#fff;text-align:center;">
      <p style="margin:0 0 10px;letter-spacing:2px;text-transform:uppercase;font:600 12px/1.5 sans-serif;opacity:.9;">New Collection</p>
      <h1 style="margin:0 0 12px;font:700 clamp(36px,7vw,62px)/1.05 serif;">Crafted Template Headline</h1>
      <p style="margin:0 auto 20px;max-width:62ch;font:400 16px/1.7 sans-serif;opacity:.94;">Click this text and replace it with your own premium hero copy. Keep it short and conversion-focused.</p>
      <a href="#" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#fff;color:#17303a;text-decoration:none;font:600 12px/1 sans-serif;letter-spacing:1px;text-transform:uppercase;">Primary Action</a>
    </section>
  `);
}

function addFeatureModule() {
  appendModule(`
    <section data-sw-module="Feature Box" style="margin:24px auto;max-width:1100px;padding:28px;border:1px solid rgba(0,0,0,.12);border-radius:18px;background:#fff;">
      <h2 style="margin:0 0 8px;font:700 32px/1.15 serif;color:#1a2028;">Feature Section Title</h2>
      <p style="margin:0 0 16px;font:400 15px/1.7 sans-serif;color:#334155;">Explain one strong value proposition here. This block is meant for trust, proof, or process messaging.</p>
      <ul style="margin:0;padding-left:20px;color:#334155;font:400 15px/1.8 sans-serif;">
        <li>Click any bullet and edit it directly.</li>
        <li>You can insert images after selecting a container.</li>
        <li>Save to overwrite the current template file.</li>
      </ul>
    </section>
  `);
}

function addCardsModule() {
  appendModule(`
    <section data-sw-module="Cards Box" style="margin:24px auto;max-width:1100px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;">
      <article style="padding:18px;border:1px solid rgba(0,0,0,.12);border-radius:14px;background:#fff;">
        <h3 style="margin:0 0 8px;font:700 24px/1.2 serif;color:#1a2028;">Card One</h3>
        <p style="margin:0;font:400 14px/1.7 sans-serif;color:#334155;">Editable card body copy.</p>
      </article>
      <article style="padding:18px;border:1px solid rgba(0,0,0,.12);border-radius:14px;background:#fff;">
        <h3 style="margin:0 0 8px;font:700 24px/1.2 serif;color:#1a2028;">Card Two</h3>
        <p style="margin:0;font:400 14px/1.7 sans-serif;color:#334155;">Editable card body copy.</p>
      </article>
      <article style="padding:18px;border:1px solid rgba(0,0,0,.12);border-radius:14px;background:#fff;">
        <h3 style="margin:0 0 8px;font:700 24px/1.2 serif;color:#1a2028;">Card Three</h3>
        <p style="margin:0;font:400 14px/1.7 sans-serif;color:#334155;">Editable card body copy.</p>
      </article>
    </section>
  `);
}

function insertImageByUrl() {
  if (!state.frameDoc) return;
  const url = els.imageUrlInput.value.trim();
  if (!url) {
    showMessage("Enter an image URL first.", true);
    return;
  }
  if (!state.selectedNode) {
    showMessage("Select an element inside preview first.", true);
    return;
  }

  if (state.selectedNode.tagName === "IMG") {
    state.selectedNode.setAttribute("src", url);
    state.selectedNode.setAttribute("alt", "Inserted image");
  } else {
    const img = state.frameDoc.createElement("img");
    img.src = url;
    img.alt = "Inserted image";
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.style.display = "block";
    img.style.margin = "12px 0";
    state.selectedNode.append(img);
  }

  initFrameEditor();
  showMessage("Image inserted into template preview.");
}

async function openTemplate(slug) {
  try {
    showMessage(`Loading template ${slug}...`);
    const payload = await api(`/api/templates/${encodeURIComponent(slug)}`);
    state.activeTemplate = payload;

    els.activeTemplateName.textContent = `${payload.name} (${payload.slug})`;
    els.openPreviewLink.href = payload.url;
    els.openPreviewLink.setAttribute("aria-disabled", "false");
    els.editorFrame.srcdoc = payload.html;
    els.editorHint.textContent = "Click any text in the preview to edit. Use module buttons to insert layout blocks.";
    setEditorEnabled(true);
    renderTemplateList();

    els.editorFrame.onload = () => {
      initFrameEditor();
    };

    showMessage(`Template ready: ${payload.name}`);
  } catch (e) {
    showMessage(`Failed to open template: ${e.message}`, true);
  }
}

async function saveActiveTemplate() {
  if (!state.activeTemplate || !state.frameDoc) {
    showMessage("Open a template before saving.", true);
    return;
  }
  try {
    clearSelection();
    const html = `<!DOCTYPE html>\n${state.frameDoc.documentElement.outerHTML}`;
    await api(`/api/templates/${encodeURIComponent(state.activeTemplate.slug)}`, {
      method: "PUT",
      body: JSON.stringify({ html }),
    });
    showMessage(`Saved template: ${state.activeTemplate.slug}`);
    await loadTemplates();
  } catch (e) {
    showMessage(`Template save failed: ${e.message}`, true);
  }
}

async function loadAllJson() {
  const [cat, cfg] = await Promise.all([api("/api/catalogue/"), api("/api/config/")]);
  els.catalogueJson.value = JSON.stringify(cat, null, 2);
  els.configJson.value = JSON.stringify(cfg, null, 2);
}

async function saveCatalogueJson() {
  const parsed = JSON.parse(els.catalogueJson.value);
  await api("/api/catalogue/", { method: "PUT", body: JSON.stringify(parsed) });
}

async function saveConfigJson() {
  const parsed = JSON.parse(els.configJson.value);
  await api("/api/config/", { method: "PUT", body: JSON.stringify(parsed) });
}

async function checkMe() {
  try {
    const me = await api("/api/auth/me");
    els.meEmail.textContent = me.email;
    setCoreEnabled(true);
    await Promise.all([loadAllJson(), loadTemplates()]);
    showMessage("Dashboard ready.");
  } catch {
    setCoreEnabled(false);
    setEditorEnabled(false);
    showMessage("Login required to edit data.");
  }
}

els.loginBtn.addEventListener("click", async () => {
  const email = els.emailInput.value.trim();
  if (!email) {
    showMessage("Please enter an email address.", true);
    return;
  }
  try {
    showMessage("Sending login link...");
    await api("/api/auth/request-link", { method: "POST", body: JSON.stringify({ email }) });
    showMessage("Login link sent. Check your inbox or backend console in dev mode.");
  } catch (e) {
    showMessage(`Auth request failed: ${e.message}`, true);
  }
});

els.logoutBtn.addEventListener("click", async () => {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } finally {
    window.location.reload();
  }
});

els.reloadBtn.addEventListener("click", async () => {
  try {
    await loadAllJson();
    showMessage("Catalogue and config reloaded.");
  } catch (e) {
    showMessage(`Reload failed: ${e.message}`, true);
  }
});

els.saveBtn.addEventListener("click", async () => {
  try {
    await saveCatalogueJson();
    showMessage("Catalogue JSON saved.");
  } catch (e) {
    showMessage(`Catalogue save failed: ${e.message}`, true);
  }
});

els.reloadCfgBtn.addEventListener("click", async () => {
  try {
    await loadAllJson();
    showMessage("Config reloaded.");
  } catch (e) {
    showMessage(`Reload failed: ${e.message}`, true);
  }
});

els.saveCfgBtn.addEventListener("click", async () => {
  try {
    await saveConfigJson();
    showMessage("Config JSON saved.");
  } catch (e) {
    showMessage(`Config save failed: ${e.message}`, true);
  }
});

els.reloadTemplatesBtn.addEventListener("click", async () => {
  try {
    await loadTemplates();
    showMessage("Template list refreshed.");
  } catch (e) {
    showMessage(`Template reload failed: ${e.message}`, true);
  }
});

els.templateSearchInput.addEventListener("input", renderTemplateList);
els.addHeroBoxBtn.addEventListener("click", addHeroModule);
els.addFeatureBoxBtn.addEventListener("click", addFeatureModule);
els.addCardsBoxBtn.addEventListener("click", addCardsModule);
els.insertImageBtn.addEventListener("click", insertImageByUrl);
els.saveTemplateBtn.addEventListener("click", saveActiveTemplate);

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    if (!els.saveTemplateBtn.disabled) {
      saveActiveTemplate();
      return;
    }
    if (!els.saveBtn.disabled) {
      els.saveBtn.click();
    }
  }
});

setEditorEnabled(false);
checkMe();
