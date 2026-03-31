import { CATEGORIES, ITEMS } from "../../catalogue/catalogue-data.js";

const state = {
  q: "",
  category: "all",
  searchOpen: false,
};

const els = {
  themeToggle: document.querySelector("#themeToggle"),
  searchToggle: document.querySelector("#searchToggle"),
  searchWrap: document.querySelector("#searchWrap"),
  searchInput: document.querySelector("#searchInput"),
  categoryChips: document.querySelector("#categoryChips"),
  resultCount: document.querySelector("#resultCount"),
  resultHint: document.querySelector("#resultHint"),
  cardGrid: document.querySelector("#cardGrid"),
};

function slugify(name) {
  return (name || "")
    .toString()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[\u2019']/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getTemplateUrl(item) {
  const slug = slugify(item.name);
  return `../../catalogue/${slug}/${slug}.html`;
}

function getThemePref() {
  const saved = localStorage.getItem("sentinel-minimal-theme");
  if (saved === "light" || saved === "dark") return saved;
  return null;
}

function setTheme(theme) {
  if (!theme) {
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem("sentinel-minimal-theme");
    return;
  }
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("sentinel-minimal-theme", theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || getThemePref() || "light";
  setTheme(current === "light" ? "dark" : "light");
}

function normalize(s) {
  return (s || "").toString().toLowerCase().trim();
}

function filterItems() {
  const q = normalize(state.q);
  const filtered = ITEMS.filter((item) => {
    if (state.category !== "all" && item.categoryId !== state.category) return false;
    if (!q) return true;

    const haystack = normalize(
      [item.name, item.short, item.pitch, item.sku, item.categoryId, ...(item.style || []), ...(item.tags || [])].join(" ")
    );

    return haystack.includes(q);
  });

  return filtered.sort((a, b) => (a.featuredRank || 999) - (b.featuredRank || 999));
}

function updateActiveChipUI() {
  const chips = Array.from(document.querySelectorAll(".chip[data-category]"));
  for (const chip of chips) {
    const isActive = chip.getAttribute("data-category") === state.category;
    chip.classList.toggle("is-active", isActive);
  }
}

function renderCategoryChips() {
  const frag = document.createDocumentFragment();

  for (const cat of CATEGORIES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.setAttribute("data-category", cat.id);
    btn.textContent = cat.name;
    btn.addEventListener("click", () => {
      state.category = cat.id;
      render();
    });
    frag.append(btn);
  }

  els.categoryChips.innerHTML = "";
  els.categoryChips.append(frag);

  const allChip = document.querySelector('.chip[data-category="all"]');
  allChip?.addEventListener("click", () => {
    state.category = "all";
    render();
  });
}

function makeCard(item) {
  const article = document.createElement("article");
  article.className = "card";

  const styleText = (item.style || []).join(" • ");

  article.innerHTML = `
    <div class="card__meta">
      <span class="card__sku">${item.sku}</span>
      <span class="card__price">$${item.price}</span>
    </div>
    <h3 class="card__title">${item.name}</h3>
    <p class="card__desc">${item.short}</p>
    <p class="card__style">${styleText}</p>
    <a class="card__link" href="${getTemplateUrl(item)}" target="_blank" rel="noopener noreferrer">Open Template</a>
  `;

  return article;
}

function renderSummary(items) {
  els.resultCount.textContent = `${items.length} templates`;

  if (state.category === "all") {
    els.resultHint.textContent = "All categories";
    return;
  }

  const category = CATEGORIES.find((cat) => cat.id === state.category);
  els.resultHint.textContent = category ? category.name : state.category;
}

function renderCards(items) {
  els.cardGrid.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("article");
    empty.className = "card";
    empty.innerHTML = `
      <h3 class="card__title">No templates found</h3>
      <p class="card__desc">Try another keyword or switch category.</p>
    `;
    els.cardGrid.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const item of items) fragment.append(makeCard(item));
  els.cardGrid.append(fragment);
}

function render() {
  const items = filterItems();
  updateActiveChipUI();
  renderSummary(items);
  renderCards(items);
}

function bindEvents() {
  els.themeToggle.addEventListener("click", toggleTheme);

  els.searchToggle.addEventListener("click", () => {
    state.searchOpen = !state.searchOpen;
    els.searchWrap.hidden = !state.searchOpen;
    if (state.searchOpen) els.searchInput.focus();
  });

  els.searchInput.addEventListener("input", (event) => {
    state.q = event.target.value;
    render();
  });
}

function init() {
  setTheme(getThemePref() || "light");
  renderCategoryChips();
  bindEvents();
  render();
}

init();
