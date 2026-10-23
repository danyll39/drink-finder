import { searchByName, searchByIngredient, lookup, random, ingredientsOf, stepsOf, summary } from './js/api.js';
import { loadFavorites, isFavorite, toggleFavorite } from './js/favorites.js';

const $ = (id) => document.getElementById(id);
const form = $('search-form');
const query = $('query');
const results = $('results');
const title = $('results-title');
const status = $('status');
const dialog = $('drink-dialog');
const body = $('drink-body');
const savedBtn = $('show-saved');

const STARTERS = ['Margarita', 'Mojito', 'Negroni', 'Old Fashioned', 'Paloma', 'Daiquiri', 'Moscow Mule', 'Whiskey Sour'];
let lastSearch = null; // so "Try again" and closing Saved can return to it
let currentDrink = null;
let toastTimer;

// ---------- small helpers ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mode = () => form.querySelector('input[name="mode"]:checked').value;

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function setHash(value) {
  // Shareable links: #drink=11007, #name=margarita, #ingredient=gin
  history.replaceState(null, '', value ? `#${value}` : location.pathname + location.search);
}

function updateSavedCount() {
  $('saved-count').textContent = loadFavorites().length;
}

const heart = (on) => `<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path d="M12 20.5s-7.5-4.6-9.3-9.4C1.4 7.6 3.6 4.5 7 4.5c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.4 0 5.6 3.1 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4z" fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;

// ---------- results grid ----------
function renderCards(drinks) {
  results.innerHTML = drinks.map((d) => {
    const saved = isFavorite(d.id);
    return `
      <li class="card">
        <button class="card-open" type="button" data-id="${esc(d.id)}">
          <img src="${esc(d.thumb)}" alt="" loading="lazy" width="250" height="250">
          <span class="card-name">${esc(d.name)}</span>
        </button>
        <button class="fav${saved ? ' on' : ''}" type="button" data-fav="${esc(d.id)}"
          aria-pressed="${saved}" aria-label="${saved ? 'Remove' : 'Save'} ${esc(d.name)}">${heart(saved)}</button>
      </li>`;
  }).join('');
  // Keep the data handy for the save buttons.
  results._drinks = new Map(drinks.map((d) => [d.id, d]));
}

function showSkeleton() {
  status.textContent = '';
  results.innerHTML = Array.from({ length: 8 }, () => '<li class="card skeleton" aria-hidden="true"><span></span></li>').join('');
}

function showMessage(html) {
  results.innerHTML = '';
  status.innerHTML = html;
}

async function runSearch(kind, term, { updateUrl = true } = {}) {
  term = term.trim();
  if (!term) return;
  lastSearch = { kind, term };
  savedBtn.setAttribute('aria-pressed', 'false');
  title.textContent = kind === 'name' ? `Drinks matching “${term}”` : `Drinks with ${term}`;
  if (updateUrl) setHash(`${kind}=${encodeURIComponent(term)}`);
  showSkeleton();
  try {
    const drinks = (kind === 'name' ? await searchByName(term) : await searchByIngredient(term)).map(summary);
    if (!drinks.length) {
      const other = kind === 'name' ? 'ingredient' : 'drink name';
      showMessage(`No drinks found for “${esc(term)}”. Check the spelling, or try searching by ${other}.`);
      return;
    }
    status.textContent = `${drinks.length} ${drinks.length === 1 ? 'drink' : 'drinks'}`;
    renderCards(drinks);
  } catch (err) {
    showMessage(`${esc(err.message)} <button class="link-btn" type="button" id="retry">Try again</button>`);
  }
}

async function showStarters() {
  title.textContent = 'Popular right now';
  showSkeleton();
  try {
    const found = await Promise.all(STARTERS.map((n) => searchByName(n).then((list) => list.find((d) => d.strDrink.toLowerCase() === n.toLowerCase()) || list[0])));
    const drinks = found.filter(Boolean).map(summary);
    status.textContent = '';
    if (drinks.length) renderCards(drinks);
    else showMessage('Search for a drink to get started.');
  } catch (err) {
    showMessage(`${esc(err.message)} <button class="link-btn" type="button" id="retry">Try again</button>`);
  }
}

function showSaved() {
  const list = loadFavorites();
  savedBtn.setAttribute('aria-pressed', 'true');
  title.textContent = 'Your saved drinks';
  setHash('');
  if (!list.length) {
    showMessage('Nothing saved yet. Tap the heart on any drink to keep it here.');
    return;
  }
  status.textContent = `${list.length} saved`;
  renderCards(list);
}

// ---------- drink details ----------
function renderDrink(drink) {
  const s = summary(drink);
  const saved = isFavorite(s.id);
  const tags = [drink.strCategory, drink.strAlcoholic, drink.strGlass].filter(Boolean);
  const ingredients = ingredientsOf(drink);
  const steps = stepsOf(drink);

  body.innerHTML = `
    <button class="close" type="button" id="close-dialog" aria-label="Close">×</button>
    <img class="drink-photo" src="${esc(s.thumb)}" alt="${esc(s.name)}" width="400" height="400">
    <div class="drink-text">
      <h2 id="drink-name">${esc(s.name)}</h2>
      ${tags.length ? `<ul class="tags">${tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      <h3>You'll need</h3>
      <ul class="ingredients">
        ${ingredients.map((i) => `<li><span class="amt">${esc(i.measure) || '&nbsp;'}</span><span>${esc(i.name)}</span></li>`).join('')}
      </ul>
      <h3>How to make it</h3>
      <ol class="steps">${steps.map((st) => `<li>${esc(st)}</li>`).join('')}</ol>
      <div class="drink-actions">
        <button class="btn${saved ? ' primary' : ''}" type="button" id="dialog-fav" aria-pressed="${saved}">${heart(saved)} ${saved ? 'Saved' : 'Save'}</button>
        <button class="btn" type="button" id="copy-link">Copy link</button>
        <button class="btn" type="button" id="another">Another random drink</button>
      </div>
    </div>`;
}

async function openDrink(id, preloaded) {
  currentDrink = null;
  body.innerHTML = '<p class="dialog-loading" role="status">Mixing…</p>';
  if (!dialog.open) dialog.showModal();
  try {
    const drink = preloaded || (await lookup(id));
    if (!drink) {
      body.innerHTML = '<p class="dialog-loading">That drink could not be found. <button class="link-btn" type="button" id="close-dialog">Close</button></p>';
      return;
    }
    currentDrink = drink;
    renderDrink(drink);
    setHash(`drink=${drink.idDrink}`);
  } catch (err) {
    body.innerHTML = `<p class="dialog-loading">${esc(err.message)} <button class="link-btn" type="button" id="close-dialog">Close</button></p>`;
  }
}

async function openRandom() {
  body.innerHTML = '<p class="dialog-loading" role="status">Mixing…</p>';
  if (!dialog.open) dialog.showModal();
  try {
    const drink = await random();
    if (drink) await openDrink(drink.idDrink, drink);
  } catch (err) {
    body.innerHTML = `<p class="dialog-loading">${esc(err.message)} <button class="link-btn" type="button" id="close-dialog">Close</button></p>`;
  }
}

function setFavoriteUI(id, saved) {
  const cardBtn = results.querySelector(`[data-fav="${CSS.escape(id)}"]`);
  if (cardBtn) {
    cardBtn.classList.toggle('on', saved);
    cardBtn.setAttribute('aria-pressed', saved);
    cardBtn.innerHTML = heart(saved);
  }
  updateSavedCount();
  if (savedBtn.getAttribute('aria-pressed') === 'true') showSaved();
}

// ---------- events ----------
form.addEventListener('submit', (e) => {
  e.preventDefault();
  runSearch(mode(), query.value);
});

form.addEventListener('change', () => {
  query.placeholder = mode() === 'name' ? 'Try margarita' : 'Try lime or gin';
});

document.querySelector('.quick').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-ingredient]');
  if (!btn) return;
  form.querySelector('input[value="ingredient"]').checked = true;
  query.value = btn.dataset.ingredient;
  runSearch('ingredient', btn.dataset.ingredient);
});

$('random').addEventListener('click', openRandom);

savedBtn.addEventListener('click', () => {
  if (savedBtn.getAttribute('aria-pressed') === 'true') {
    savedBtn.setAttribute('aria-pressed', 'false');
    lastSearch ? runSearch(lastSearch.kind, lastSearch.term) : showStarters();
  } else {
    showSaved();
  }
});

results.addEventListener('click', (e) => {
  const fav = e.target.closest('[data-fav]');
  if (fav) {
    const drink = results._drinks.get(fav.dataset.fav);
    const saved = toggleFavorite(drink);
    toast(saved ? `Saved ${drink.name}` : `Removed ${drink.name}`);
    setFavoriteUI(drink.id, saved);
    return;
  }
  const open = e.target.closest('[data-id]');
  if (open) openDrink(open.dataset.id);
});

status.addEventListener('click', (e) => {
  if (e.target.id !== 'retry') return;
  lastSearch ? runSearch(lastSearch.kind, lastSearch.term) : showStarters();
});

body.addEventListener('click', async (e) => {
  const id = e.target.closest('button')?.id;
  if (id === 'close-dialog') dialog.close();
  if (id === 'another') openRandom();
  if (id === 'dialog-fav' && currentDrink) {
    const s = summary(currentDrink);
    const saved = toggleFavorite(s);
    renderDrink(currentDrink);
    setFavoriteUI(s.id, saved);
    toast(saved ? `Saved ${s.name}` : `Removed ${s.name}`);
  }
  if (id === 'copy-link') {
    try {
      await navigator.clipboard.writeText(location.href);
      toast('Link copied');
    } catch {
      toast('Copy the address from your browser bar to share this drink');
    }
  }
});

// Click outside the panel closes it.
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) dialog.close();
});

dialog.addEventListener('close', () => {
  if (location.hash.startsWith('#drink=')) {
    setHash(lastSearch ? `${lastSearch.kind}=${encodeURIComponent(lastSearch.term)}` : '');
  }
});

// ---------- start ----------
// Reads the address (#name=..., #ingredient=..., #drink=...) so shared links open the right view.
function followUrl({ firstLoad = false } = {}) {
  const [key, raw] = location.hash.slice(1).split('=');
  const value = decodeURIComponent(raw || '');
  if ((key === 'name' || key === 'ingredient') && value) {
    form.querySelector(`input[value="${key}"]`).checked = true;
    query.value = value;
    runSearch(key, value, { updateUrl: false });
    return;
  }
  if (firstLoad) showStarters();
  if (key === 'drink' && value) openDrink(value);
}

// Links clicked or typed while the page is open.
window.addEventListener('hashchange', () => followUrl());

updateSavedCount();
followUrl({ firstLoad: true });
