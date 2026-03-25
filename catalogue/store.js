import { CATEGORIES, ITEMS, STYLES } from "./catalogue-data.js";
import { CONTACT } from "./config.js";

function slugify(name) {
  return (name || "")
    .toString()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['ΓÇÖ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const els = {
  themeToggle: $("#themeToggle"),
  contactBtn: $("#contactBtn"),
  openContactLink: $("#openContactLink"),

  searchInput: $("#searchInput"),
  categorySelect: $("#categorySelect"),
  sortSelect: $("#sortSelect"),
  styleChips: $("#styleChips"),

  resultsCount: $("#resultsCount"),
  resultsHint: $("#resultsHint"),

  categoryNav: $("#categoryNav"),
  catalogueRoot: $("#catalogueRoot"),
  emptyState: $("#emptyState"),
  resetBtn: $("#resetBtn"),

  productDialog: $("#productDialog"),
  contactDialog: $("#contactDialog"),

  dlgTitle: $("#dlgTitle"),
  dlgSubtitle: $("#dlgSubtitle"),
  dlgPrice: $("#dlgPrice"),
  dlgPitch: $("#dlgPitch"),
  dlgIncludes: $("#dlgIncludes"),
  dlgPages: $("#dlgPages"),
  dlgBestFor: $("#dlgBestFor"),
  dlgTags: $("#dlgTags"),
  dlgSku: $("#dlgSku"),
  dlgPreview: $("#dlgPreview"),
  previewFrame: $("#previewFrame"),

  buyBtn: $("#buyBtn"),
  openPreviewBtn: null,
  copySkuBtn: $("#copySkuBtn"),
  copyContactBtn: $("#copyContactBtn"),
};

const state = {
  q: "",
  categoryId: "all",
  styles: new Set(),
  sort: "featured",
  theme: null,
  availableTemplateSlugs: null,
};

function getThemePref() {
  const saved = localStorage.getItem("hwc-theme");
  if (saved === "light" || saved === "dark") return saved;
  return null;
}

function setTheme(theme) {
  state.theme = theme;
  if (!theme) {
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem("hwc-theme");
    return;
  }
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("hwc-theme", theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || getThemePref();
  if (current === "light") setTheme("dark");
  else setTheme("light");
}

function formatPrice(n) {
  return `$${n}`;
}

function byId(list, id) {
  return list.find((x) => x.id === id);
}

function normalize(s) {
  return (s || "").toString().toLowerCase().trim();
}

function itemMatches(item) {
  const q = normalize(state.q);
  if (state.categoryId !== "all" && item.categoryId !== state.categoryId) return false;

  if (state.styles.size > 0) {
    const hasAny = item.style.some((s) => state.styles.has(s));
    if (!hasAny) return false;
  }

  if (!q) return true;

  const hay = normalize(
    [item.name, item.sku, item.categoryId, item.short, item.pitch, ...(item.tags || []), ...(item.style || [])].join(
      " "
    )
  );
  return hay.includes(q);
}

function sortItems(items) {
  const sorted = [...items];
  switch (state.sort) {
    case "price-asc":
      sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      break;
    case "price-desc":
      sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      break;
    case "newest":
      sorted.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
      break;
    case "featured":
    default:
      sorted.sort((a, b) => (a.featuredRank ?? 999) - (b.featuredRank ?? 999));
      break;
  }
  return sorted;
}

function computeVisibleItems() {
  return sortItems(ITEMS.filter(itemMatches));
}

function groupByCategory(items) {
  const map = new Map();
  for (const cat of CATEGORIES) map.set(cat.id, []);
  for (const item of items) {
    if (!map.has(item.categoryId)) map.set(item.categoryId, []);
    map.get(item.categoryId).push(item);
  }
  return map;
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) node.setAttribute(k, String(v));
  }
  for (const child of children) node.append(child);
  return node;
}

function makeThumbStyle(accent) {
  const a = accent?.a || "#7c3aed";
  const b = accent?.b || "#06b6d4";
  const c = accent?.c || "#22c55e";
  return `
    background:
      radial-gradient(240px 140px at 18% 35%, ${a}66, transparent 60%),
      radial-gradient(240px 160px at 78% 45%, ${b}55, transparent 62%),
      radial-gradient(220px 160px at 55% 105%, ${c}40, transparent 60%),
      linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.00));
  `;
}

function getTemplateSlug(item) {
  return slugify(item?.name || "");
}

function getTemplateUrl(item) {
  const slug = getTemplateSlug(item);
  return `./catalogue/${slug}/${slug}.html`;
}

function canRenderTemplatePreview(item) {
  if (!state.availableTemplateSlugs) return false;
  return state.availableTemplateSlugs.has(getTemplateSlug(item));
}

async function loadAvailableTemplates() {
  try {
    const res = await fetch("/api/templates/");
    if (!res.ok) return;
    const payload = await res.json();
    const records = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.templates)
      ? payload.templates
      : [];

    const slugs = records
      .map((t) => (typeof t === "string" ? t : t?.slug))
      .filter(Boolean);

    state.availableTemplateSlugs = new Set(slugs);
  } catch {
    // Keep catalogue resilient if template API is unavailable.
    state.availableTemplateSlugs = new Set();
  }
}

function buildThumbNode(item) {
  const thumb = el("div", { class: "card__thumb" });
  const frame = el("iframe", {
    class: "card__iframe",
    title: `${item.name} preview`,
    loading: "lazy",
    tabindex: "-1",
    "aria-hidden": "true",
    sandbox: "allow-same-origin allow-scripts",
  });

  if (canRenderTemplatePreview(item)) {
    frame.src = getTemplateUrl(item);
  } else {
    frame.srcdoc = buildFallbackPreviewDoc(item);
  }

  thumb.append(frame);

  return thumb;
}

function buildFallbackPreviewDoc(item) {
  const accentA = item?.accent?.a || "#f97316";
  const accentB = item?.accent?.b || "#06b6d4";
  const accentC = item?.accent?.c || "#facc15";
  const category = byId(CATEGORIES, item.categoryId)?.name || item.categoryId;
  const tags = [...(item.style || []), ...(item.tags || [])].slice(0, 3);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Segoe UI, Arial, sans-serif;
      color: #221b17;
      background:
        radial-gradient(320px 220px at 15% 20%, ${accentA}33, transparent 55%),
        radial-gradient(360px 240px at 80% 20%, ${accentB}2e, transparent 60%),
        radial-gradient(280px 220px at 50% 95%, ${accentC}2a, transparent 58%),
        #fff8f2;
    }
    .shell {
      min-height: 100vh;
      padding: 26px;
    }
    .nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }
    .brand {
      font-weight: 700;
      font-size: 24px;
      letter-spacing: .2px;
    }
    .cta {
      border: 0;
      border-radius: 999px;
      padding: 10px 16px;
      background: linear-gradient(120deg, ${accentA}, ${accentC});
      color: #241912;
      font-weight: 700;
    }
    h1 {
      margin: 0;
      font-size: 42px;
      line-height: 1.08;
      max-width: 720px;
      letter-spacing: -.5px;
    }
    p {
      margin: 14px 0 20px;
      font-size: 17px;
      line-height: 1.55;
      max-width: 760px;
      color: #5a4c44;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 26px;
    }
    .chip {
      border: 1px solid #dfcfc4;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      color: #65564c;
      background: #fffaf6;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      margin-top: 14px;
    }
    .card {
      border: 1px solid #e6d8ce;
      border-radius: 14px;
      background: #fff;
      padding: 14px;
      min-height: 128px;
    }
    .line {
      height: 10px;
      border-radius: 999px;
      background: #efe6e0;
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="shell">
    <div class="nav">
      <div class="brand">${item.name}</div>
      <button class="cta">Contact</button>
    </div>
    <h1>${item.short}</h1>
    <p>${item.pitch}</p>
    <div class="chips">
      <span class="chip">${category}</span>
      ${tags.map((tag) => `<span class="chip">${tag}</span>`).join("")}
      <span class="chip">${item.sku}</span>
    </div>
    <div class="grid">
      <div class="card"><div class="line"></div><div class="line"></div><div class="line" style="width:55%"></div></div>
      <div class="card"><div class="line"></div><div class="line" style="width:70%"></div><div class="line" style="width:40%"></div></div>
      <div class="card"><div class="line"></div><div class="line"></div><div class="line" style="width:62%"></div></div>
    </div>
  </div>
</body>
</html>`;
}

function renderCategorySelect() {
  els.categorySelect.innerHTML = "";
  els.categorySelect.append(
    el("option", { value: "all", text: "All categories" }),
    ...CATEGORIES.map((c) => el("option", { value: c.id, text: c.name }))
  );
}

function renderStyleChips() {
  els.styleChips.innerHTML = "";
  for (const style of STYLES) {
    const chip = el("button", {
      class: "chip",
      type: "button",
      role: "listitem",
      "aria-pressed": "false",
      text: style,
      onclick: () => {
        if (state.styles.has(style)) state.styles.delete(style);
        else state.styles.add(style);
        render();
      },
    });
    els.styleChips.append(chip);
  }
}

function renderCategoryNav() {
  els.categoryNav.innerHTML = "";
  for (const cat of CATEGORIES) {
    els.categoryNav.append(
      el("a", {
        class: "categoryLink",
        href: `#cat-${cat.id}`,
        text: cat.name,
      })
    );
  }
}

function renderCardsForCategory(cat, items) {
  const section = el("section", { class: "section", id: `cat-${cat.id}` });

  const head = el("div", { class: "section__head" }, [
    el("div", {}, [
      el("h3", { class: "section__title", text: cat.name }),
      el("div", { class: "section__meta", text: cat.blurb }),
    ]),
    el("div", { class: "section__meta", text: `${items.length} templates` }),
  ]);

  const grid = el("div", { class: "grid" });

  for (const item of items) {
    const thumb = buildThumbNode(item);

    const badges = el("div", { class: "badges" }, [
      ...item.style.slice(0, 2).map((s) => el("span", { class: "badge", text: s })),
      el("span", { class: "badge", text: item.sku }),
    ]);

    const card = el("article", { class: "card" }, [
      thumb,
      el("div", { class: "card__body" }, [
        el("h4", { class: "card__title", text: item.name }),
        el("p", { class: "card__desc", text: item.short }),
        el("div", { class: "card__row" }, [
          badges,
          el("div", { class: "price", text: formatPrice(item.price) }),
        ]),
        el("div", { class: "card__actions" }, [
          el("button", {
            class: "btn",
            type: "button",
            onclick: () => openProduct(item.sku),
          }, [
            el("span", { class: "btn__label", text: "View details" }),
            el("span", { class: "btn__icon", "aria-hidden": "true", text: ">" }),
          ]),
          el("button", {
            class: "linkBtn",
            type: "button",
            onclick: async () => {
              await copyText(item.sku);
              toast(`Copied ${item.sku}`);
            },
            "aria-label": `Copy code ${item.sku}`,
            text: "Copy code",
          }),
        ]),
      ]),
    ]);

    grid.append(card);
  }

  section.append(head, grid);
  return section;
}

function render() {
  // controls state
  const chips = $$(".chip", els.styleChips);
  for (const chip of chips) {
    const label = chip.textContent;
    chip.setAttribute("aria-pressed", state.styles.has(label) ? "true" : "false");
  }

  const visible = computeVisibleItems();
  els.resultsCount.textContent = String(visible.length);

  const hintBits = [];
  if (state.categoryId !== "all") hintBits.push(byId(CATEGORIES, state.categoryId)?.name || state.categoryId);
  if (state.styles.size > 0) hintBits.push([...state.styles].join(", "));
  if (state.q) hintBits.push(`"${state.q}"`);
  els.resultsHint.textContent = hintBits.length ? hintBits.join(" - ") : "All templates";

  const grouped = groupByCategory(visible);

  els.catalogueRoot.innerHTML = "";
  let renderedSections = 0;

  for (const cat of CATEGORIES) {
    const items = grouped.get(cat.id) || [];
    if (items.length === 0) continue;
    els.catalogueRoot.append(renderCardsForCategory(cat, items));
    renderedSections++;
  }

  const isEmpty = visible.length === 0;
  els.emptyState.hidden = !isEmpty;

  if (!isEmpty && renderedSections > 0) {
    // keep jump links useful
    els.categoryNav.style.display = "flex";
  } else {
    els.categoryNav.style.display = "none";
  }
}

function openDialog(dialogEl) {
  if (typeof dialogEl.showModal === "function") dialogEl.showModal();
  else dialogEl.setAttribute("open", "");
}

function closeDialog(dialogEl) {
  if (typeof dialogEl.close === "function") dialogEl.close();
  else dialogEl.removeAttribute("open");
}

function openProduct(sku) {
  const item = ITEMS.find((x) => x.sku === sku);
  if (!item) return;

  const cat = byId(CATEGORIES, item.categoryId);

  els.dlgTitle.textContent = item.name;
  els.dlgSubtitle.textContent = `${cat?.name ?? item.categoryId} - ${item.style.join(" / ")} - ${item.sku}`;
  els.dlgPrice.textContent = formatPrice(item.price);
  els.dlgPitch.textContent = item.pitch;
  els.dlgSku.value = item.sku;

  els.dlgIncludes.innerHTML = "";
  for (const line of item.includes || []) {
    els.dlgIncludes.append(el("li", { text: line }));
  }

  els.dlgPages.innerHTML = "";
  for (const p of item.pages || []) {
    els.dlgPages.append(el("li", { text: p }));
  }

  els.dlgBestFor.innerHTML = "";
  for (const p of item.bestFor || []) {
    els.dlgBestFor.append(el("li", { text: p }));
  }

  els.dlgTags.innerHTML = "";
  for (const t of [...item.style, ...(item.tags || [])].slice(0, 12)) {
    els.dlgTags.append(el("span", { class: "badge", text: t }));
  }

  const previewUrl = getTemplateUrl(item);
  const hasLivePreview = canRenderTemplatePreview(item);

  let frame = els.previewFrame;
  if (!frame && els.dlgPreview) {
    frame = el("iframe", {
      id: "previewFrame",
      class: "dialog__iframe",
      title: "Template full preview",
      loading: "eager",
      sandbox: "allow-same-origin allow-scripts",
    });
    els.dlgPreview.append(frame);
    els.previewFrame = frame;
  }

  if (hasLivePreview && frame) {
    els.dlgPreview.style.cssText = "";
    frame.removeAttribute("srcdoc");
    frame.src = previewUrl;
  } else {
    if (frame) {
      frame.removeAttribute("src");
      frame.srcdoc = buildFallbackPreviewDoc(item);
    }
    els.dlgPreview.style.cssText = "";
  }

  // Lazily inject a preview button next to Buy/Copy
  if (!els.openPreviewBtn) {
    const actions = document.querySelector(".priceRow__actions");
    if (actions) {
      const btn = document.createElement("button");
      btn.className = "btn btn--ghost";
      btn.type = "button";
      btn.id = "openPreviewBtn";
      btn.innerHTML = '<span class="btn__label">Open preview</span><span class="btn__icon" aria-hidden="true">></span>';
      actions.insertBefore(btn, els.copySkuBtn);
      els.openPreviewBtn = btn;
    }
  }

  if (els.openPreviewBtn) {
    // Store the URL on the button to avoid closure issues
    els.openPreviewBtn.dataset.previewUrl = previewUrl;
    els.openPreviewBtn.disabled = !hasLivePreview;
    els.openPreviewBtn.title = hasLivePreview ? "Open template page" : "No dedicated template file for this item yet";
    els.openPreviewBtn.onclick = () => {
      if (!hasLivePreview) {
        toast("This item uses generated preview only.");
        return;
      }
      window.open(els.openPreviewBtn.dataset.previewUrl, "_blank", "noopener,noreferrer");
    };
  }

  openDialog(els.productDialog);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = el("textarea", { class: "sr" });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

let toastTimer = null;
function toast(message) {
  let t = $("#toast");
  if (!t) {
    t = el("div", { id: "toast" });
    t.style.cssText = `
      position: fixed;
      left: 50%;
      bottom: 18px;
      transform: translateX(-50%);
      padding: 10px 12px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(0,0,0,0.55);
      color: rgba(255,255,255,0.92);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      z-index: 1000;
      font-size: 13px;
      box-shadow: 0 18px 55px rgba(0,0,0,0.35);
      max-width: min(560px, calc(100vw - 24px));
      text-align:center;
    `;
    document.body.append(t);
  }

  t.textContent = message;
  t.style.opacity = "1";

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.style.opacity = "0";
  }, 1400);
}

function makePurchaseUrl(sku) {
  const msg = encodeURIComponent(CONTACT.defaultMessage(sku));

  if (CONTACT.whatsappNumberInternational) {
    return `https://wa.me/${CONTACT.whatsappNumberInternational}?text=${msg}`;
  }
  if (CONTACT.email) {
    return `mailto:${encodeURIComponent(CONTACT.email)}?subject=${encodeURIComponent(
      `Template purchase: ${sku}`
    )}&body=${msg}`;
  }
  return "#";
}

function wireEvents() {
  els.searchInput.addEventListener("input", (e) => {
    state.q = e.target.value;
    render();
  });

  els.categorySelect.addEventListener("change", (e) => {
    state.categoryId = e.target.value;
    render();
  });

  els.sortSelect.addEventListener("change", (e) => {
    state.sort = e.target.value;
    render();
  });

  els.resetBtn.addEventListener("click", () => {
    state.q = "";
    state.categoryId = "all";
    state.styles = new Set();
    state.sort = "featured";

    els.searchInput.value = "";
    els.categorySelect.value = "all";
    els.sortSelect.value = "featured";

    render();
  });

  els.themeToggle.addEventListener("click", toggleTheme);

  const openContact = () => openDialog(els.contactDialog);
  els.contactBtn.addEventListener("click", openContact);
  els.openContactLink.addEventListener("click", (e) => {
    e.preventDefault();
    openContact();
  });

  els.buyBtn.addEventListener("click", async () => {
    const sku = els.dlgSku.value;
    const url = makePurchaseUrl(sku);
    if (url === "#") {
      toast("Set CONTACT info in app.js first");
      openDialog(els.contactDialog);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  });

  els.copySkuBtn.addEventListener("click", async () => {
    const sku = els.dlgSku.value;
    await copyText(sku);
    toast(`Copied ${sku}`);
  });

  els.copyContactBtn.addEventListener("click", async () => {
    const text = CONTACT.defaultMessage("<SKU>");
    await copyText(text);
    toast("Copied contact message");
  });

  // close on backdrop click
  for (const dlg of [els.productDialog, els.contactDialog]) {
    dlg.addEventListener("click", (e) => {
      const rect = dlg.getBoundingClientRect();
      const inDialog =
        rect.top <= e.clientY && e.clientY <= rect.top + rect.height && rect.left <= e.clientX && e.clientX <= rect.left + rect.width;
      if (!inDialog) closeDialog(dlg);
    });
  }
}

function init() {
  setTheme(getThemePref());
  renderCategorySelect();
  renderStyleChips();
  renderCategoryNav();
  wireEvents();
  render();

  loadAvailableTemplates().then(() => {
    render();
  });
}

init();
