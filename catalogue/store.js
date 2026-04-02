import { CATEGORIES, ITEMS } from "./catalogue-data.js";
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
  searchToggle: $("#searchToggle"),
  searchWrap: $("#searchWrap"),
  favoritesToggle: $("#favoritesToggle"),
  compareToggle: $("#compareToggle"),
  contactBtn: $("#contactBtn"),
  openContactLink: $("#openContactLink"),

  searchInput: $("#searchInput"),

  resultsCount: $("#resultsCount"),
  resultsHint: $("#resultsHint"),

  categoryNav: $("#categoryNav"),
  catalogueRoot: $("#catalogueRoot"),
  comparePanel: $("#comparePanel"),
  compareList: $("#compareList"),
  clearCompareBtn: $("#clearCompareBtn"),
  closeCompareBtn: $("#closeCompareBtn"),
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
  openPreviewBtn: $("#openPreviewBtn"),
  copyUrlBtn: $("#copyUrlBtn"),
  downloadQrBtn: $("#downloadQrBtn"),
  contactFromProductBtn: $("#contactFromProductBtn"),
  copyContactBtn: $("#copyContactBtn"),
};

const state = {
  q: "",
  theme: null,
  isSearchOpen: false,
  focusedCategoryId: null,
  lastFocusedCategoryId: null,
  showFavoritesOnly: false,
  showComparePanel: false,
  favorites: new Set(),
  compare: new Set(),
  availableTemplateSlugs: null,
};

function loadSet(key) {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveSet(key, setRef) {
  localStorage.setItem(key, JSON.stringify([...setRef]));
}

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
  return `RM${n}`;
}

function byId(list, id) {
  return list.find((x) => x.id === id);
}

function normalize(s) {
  return (s || "").toString().toLowerCase().trim();
}

function itemMatches(item) {
  const q = normalize(state.q);

  if (state.showFavoritesOnly && !state.favorites.has(item.sku)) return false;

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
  sorted.sort((a, b) => (a.featuredRank ?? 999) - (b.featuredRank ?? 999));
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

function getLocalTemplateSlugSet() {
  return new Set(ITEMS.map((item) => getTemplateSlug(item)).filter(Boolean));
}

function canRenderTemplatePreview(item) {
  if (!state.availableTemplateSlugs) return false;
  return state.availableTemplateSlugs.has(getTemplateSlug(item));
}

async function loadAvailableTemplates() {
  try {
    const res = await fetch("/api/templates/");
    if (!res.ok) {
      state.availableTemplateSlugs = getLocalTemplateSlugSet();
      return;
    }
    const payload = await res.json();
    const records = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.templates)
      ? payload.templates
      : [];

    const slugs = records
      .map((t) => (typeof t === "string" ? t : t?.slug))
      .filter(Boolean);

    state.availableTemplateSlugs = slugs.length ? new Set(slugs) : getLocalTemplateSlugSet();
  } catch {
    // Static hosts (e.g. Cloudflare Pages) don't have /api/templates.
    state.availableTemplateSlugs = getLocalTemplateSlugSet();
  }
}

function buildThumbNode(item) {
  const thumb = el("div", { class: "card-bg" });
  const frame = el("iframe", {
    class: "card-bg__iframe",
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

function bindCardTilt(cardWrap) {
  const card = $(".card", cardWrap);
  if (!card) return;

  let mouseLeaveDelay = null;

  cardWrap.addEventListener("mousemove", (e) => {
    const rect = cardWrap.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;

    const px = mouseX / (rect.width / 2);
    const py = mouseY / (rect.height / 2);

    const rY = px * 16;
    const rX = py * -16;
    card.style.setProperty("--card-rotate-x", `${rX}deg`);
    card.style.setProperty("--card-rotate-y", `${rY}deg`);
  });

  cardWrap.addEventListener("mouseenter", () => {
    if (mouseLeaveDelay) clearTimeout(mouseLeaveDelay);
  });

  cardWrap.addEventListener("mouseleave", () => {
    mouseLeaveDelay = setTimeout(() => {
      card.style.setProperty("--card-rotate-x", "0deg");
      card.style.setProperty("--card-rotate-y", "0deg");
    }, 300);
  });
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

function renderCategoryNav() {
  els.categoryNav.innerHTML = "";

  const allBtn = el("button", {
    class: `categoryLink${state.focusedCategoryId === null ? " is-active" : ""}`,
    type: "button",
    text: "All",
    onclick: () => {
      state.focusedCategoryId = null;
      render();
    },
  });
  els.categoryNav.append(allBtn);

  for (const cat of CATEGORIES) {
    const btn = el("button", {
      class: `categoryLink${state.focusedCategoryId === cat.id ? " is-active" : ""}`,
      type: "button",
      text: cat.name,
      onclick: () => {
        state.focusedCategoryId = state.focusedCategoryId === cat.id ? null : cat.id;
        render();
      },
    });
    els.categoryNav.append(btn);
  }
}

function renderCardsForCategory(cat, items) {
  const section = el("section", { class: "section", id: `cat-${cat.id}`, "data-category": cat.id });

  const head = el("div", { class: "section__head" }, [
    el("div", {}, [
      el("h3", { class: "section__title", text: cat.name }),
      el("div", { class: "section__meta", text: cat.blurb }),
    ]),
    el("div", { class: "section__meta", text: `${items.length} templates` }),
  ]);

  const grid = el("div", { class: "grid" });

  for (const item of items) {
    grid.append(buildTemplateCard(item));
  }

  section.append(head, grid);
  return section;
}

function toggleFavorite(sku) {
  if (state.favorites.has(sku)) state.favorites.delete(sku);
  else state.favorites.add(sku);
  saveSet("hwc-favorites", state.favorites);
}

function toggleCompare(sku) {
  if (state.compare.has(sku)) state.compare.delete(sku);
  else {
    if (state.compare.size >= 3) {
      toast("You can compare up to 3 templates");
      return false;
    }
    state.compare.add(sku);
  }
  saveSet("hwc-compare", state.compare);
  return true;
}

function buildTemplateCard(item, { fromCompare = false } = {}) {
  const thumb = buildThumbNode(item);

  const badges = el("div", { class: "badges" }, [
    ...item.style.slice(0, 2).map((s) => el("span", { class: "badge", text: s })),
    el("span", { class: "badge", text: item.sku }),
  ]);

  const favoriteBtn = el("button", {
    class: `favoriteBtn${state.favorites.has(item.sku) ? " is-active" : ""}`,
    type: "button",
    "aria-label": state.favorites.has(item.sku) ? "Remove from favorites" : "Add to favorites",
    onclick: () => {
      toggleFavorite(item.sku);
      render();
    },
  }, [el("span", { text: "❤" })]);

  const compareBtn = el("button", {
    class: `linkBtn cardActionToggle${state.compare.has(item.sku) ? " is-active" : ""}`,
    type: "button",
    text: state.compare.has(item.sku) ? "Compared" : "Compare",
    onclick: () => {
      const changed = toggleCompare(item.sku);
      if (!changed) return;
      state.showComparePanel = state.compare.size > 0;
      renderComparePanel();
      render();
    },
  });

  const card = el("article", { class: "card" }, [
    thumb,
    el("div", { class: "card-info" }, [
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
        compareBtn,
        favoriteBtn,
      ]),
    ]),
  ]);

  const wrapClass = fromCompare ? "card-wrap card-wrap--compare" : "card-wrap";
  const cardWrap = el("div", { class: wrapClass }, [card]);
  bindCardTilt(cardWrap);
  return cardWrap;
}

function renderComparePanel() {
  if (!els.compareToggle || !els.comparePanel || !els.compareList) return;

  const count = state.compare.size;
  els.compareToggle.textContent = `Compare (${count})`;

  if (count === 0) {
    els.comparePanel.hidden = true;
    els.compareList.innerHTML = "";
    return;
  }

  els.comparePanel.hidden = !state.showComparePanel;
  if (!state.showComparePanel) return;

  const items = [...state.compare]
    .map((sku) => ITEMS.find((item) => item.sku === sku))
    .filter(Boolean);

  els.compareList.innerHTML = "";
  const grid = el("div", { class: "comparePanel__grid" });
  for (const item of items) {
    grid.append(buildTemplateCard(item, { fromCompare: true }));
  }
  els.compareList.append(grid);
}

function render() {
  const visible = computeVisibleItems();
  els.resultsCount.textContent = String(visible.length);

  const hintBits = [];
  if (state.focusedCategoryId) hintBits.push(byId(CATEGORIES, state.focusedCategoryId)?.name || state.focusedCategoryId);
  if (state.q) hintBits.push(`"${state.q}"`);
  els.resultsHint.textContent = hintBits.length ? hintBits.join(" - ") : "Showing all";

  const grouped = groupByCategory(visible);

  els.catalogueRoot.innerHTML = "";
  let renderedSections = 0;

  for (const cat of CATEGORIES) {
    if (state.focusedCategoryId && cat.id !== state.focusedCategoryId) continue;
    const items = grouped.get(cat.id) || [];
    if (items.length === 0) continue;
    els.catalogueRoot.append(renderCardsForCategory(cat, items));
    renderedSections++;
  }

  renderCategoryNav();

  // Smooth collapse/restore transition for focused sections.
  const sections = $$(".section", els.catalogueRoot);
  if (state.focusedCategoryId) {
    for (const section of sections) {
      const isFocused = section.getAttribute("data-category") === state.focusedCategoryId;
      section.classList.toggle("section--focused", isFocused);
      if (!isFocused) {
        section.classList.add("section--minimized-pre");
      }
    }
    requestAnimationFrame(() => {
      for (const section of sections) {
        const isFocused = section.getAttribute("data-category") === state.focusedCategoryId;
        if (!isFocused) {
          section.classList.remove("section--minimized-pre");
          section.classList.add("section--minimized");
        }
      }
    });
  } else if (state.lastFocusedCategoryId) {
    for (const section of sections) {
      section.classList.remove("section--focused");
      section.classList.add("section--restore");
    }
    requestAnimationFrame(() => {
      for (const section of sections) {
        section.classList.remove("section--minimized");
        section.classList.remove("section--restore");
      }
    });
  }

  state.lastFocusedCategoryId = state.focusedCategoryId;
  renderComparePanel();

  if (els.favoritesToggle) {
    els.favoritesToggle.setAttribute("aria-pressed", state.showFavoritesOnly ? "true" : "false");
    els.favoritesToggle.textContent = state.showFavoritesOnly ? "Favorites on" : "Favorites";
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

  // Store preview URL for copy/QR buttons
  els.productDialog.dataset.previewUrl = previewUrl;
  els.productDialog.dataset.templateName = item.name;
  els.productDialog.dataset.templateSku = item.sku;

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

function generateAndDownloadQR(url, filename) {
  const container = el("div", { style: "display:none" });
  const qrElement = el("div");
  container.append(qrElement);
  document.body.append(container);

  try {
    const qr = new QRCode(qrElement, {
      text: url,
      width: 300,
      height: 300,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });

    setTimeout(() => {
      const canvas = qrElement.querySelector("canvas");
      if (canvas) {
        canvas.toBlob((blob) => {
          const link = el("a", {
            href: URL.createObjectURL(blob),
            download: filename || "qr-code.png"
          });
          link.click();
          URL.revokeObjectURL(link.href);
          container.remove();
        });
      } else {
        container.remove();
        toast("Failed to generate QR code");
      }
    }, 100);
  } catch (err) {
    container.remove();
    toast("Error generating QR code");
    console.error(err);
  }
}

function wireEvents() {
  els.searchInput.addEventListener("input", (e) => {
    state.q = e.target.value;
    render();
  });

  els.searchToggle?.addEventListener("click", () => {
    state.isSearchOpen = !state.isSearchOpen;
    if (els.searchWrap) els.searchWrap.hidden = !state.isSearchOpen;
    if (state.isSearchOpen) els.searchInput?.focus();
    if (!state.isSearchOpen && els.searchInput?.value) {
      els.searchInput.value = "";
      state.q = "";
      render();
    }
  });

  els.resetBtn.addEventListener("click", () => {
    state.q = "";

    els.searchInput.value = "";

    render();
  });

  els.themeToggle.addEventListener("click", toggleTheme);

  const openContact = () => openDialog(els.contactDialog);
  els.contactBtn.addEventListener("click", openContact);
  els.contactFromProductBtn?.addEventListener("click", openContact);
  els.openContactLink?.addEventListener("click", (e) => {
    e.preventDefault();
    openContact();
  });

  els.favoritesToggle?.addEventListener("click", () => {
    state.showFavoritesOnly = !state.showFavoritesOnly;
    render();
  });

  els.compareToggle?.addEventListener("click", () => {
    if (state.compare.size === 0) {
      toast("Add templates to compare first");
      return;
    }
    state.showComparePanel = !state.showComparePanel;
    renderComparePanel();
  });

  els.clearCompareBtn?.addEventListener("click", () => {
    state.compare = new Set();
    saveSet("hwc-compare", state.compare);
    state.showComparePanel = false;
    renderComparePanel();
    render();
  });

  els.closeCompareBtn?.addEventListener("click", () => {
    state.showComparePanel = false;
    renderComparePanel();
  });

  els.buyBtn.addEventListener("click", async () => {
    const sku = els.dlgSku.value;
    const url = makePurchaseUrl(sku);
    if (url === "#") {
      toast("Set CONTACT info in catalogue/config.js first");
      openDialog(els.contactDialog);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  });

  els.copyUrlBtn?.addEventListener("click", async () => {
    const url = els.productDialog.dataset.previewUrl;
    if (!url) {
      toast("No preview URL available");
      return;
    }
    await copyText(url);
    toast("Preview URL copied to clipboard");
  });

  els.downloadQrBtn?.addEventListener("click", () => {
    const url = els.productDialog.dataset.previewUrl;
    const templateName = els.productDialog.dataset.templateName || "template";
    if (!url) {
      toast("No preview URL available for QR");
      return;
    }
    const filename = `${slugify(templateName)}-qr.png`;
    generateAndDownloadQR(url, filename);
    toast("QR code downloading...");
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
  state.favorites = loadSet("hwc-favorites");
  state.compare = loadSet("hwc-compare");
  setTheme(getThemePref());
  renderCategoryNav();
  wireEvents();
  render();

  loadAvailableTemplates().then(() => {
    render();
  });
}

init();
