import { useCallback, useEffect, useRef, useState } from 'react';
import { searchByName, searchByIngredient, lookup, random, summary } from './api.js';
import { loadFavorites, saveFavorites } from './favorites.js';
import useToast from './useToast.js';
import SearchForm from './components/SearchForm.jsx';
import DrinkGrid from './components/DrinkGrid.jsx';
import DrinkDialog from './components/DrinkDialog.jsx';

const STARTERS = ['Margarita', 'Mojito', 'Negroni', 'Old Fashioned', 'Paloma', 'Daiquiri', 'Moscow Mule', 'Whiskey Sour'];

// Shareable links: #drink=11007, #name=margarita, #ingredient=gin
function setHash(value) {
  history.replaceState(null, '', value ? `#${value}` : location.pathname + location.search);
}

function readHash() {
  const [key, raw] = location.hash.slice(1).split('=');
  return { key, value: decodeURIComponent(raw || '') };
}

async function loadStarters() {
  const found = await Promise.all(STARTERS.map((n) => searchByName(n).then((list) => list.find((d) => d.strDrink.toLowerCase() === n.toLowerCase()) || list[0])));
  return found.filter(Boolean).map(summary);
}

function titleFor(view) {
  if (view.kind === 'name') return `Drinks matching “${view.term}”`;
  if (view.kind === 'ingredient') return `Drinks with ${view.term}`;
  if (view.kind === 'saved') return 'Your saved drinks';
  return 'Popular right now';
}

export default function App() {
  const [mode, setMode] = useState('name');
  const [query, setQuery] = useState('');
  // What the grid shows: { kind: 'starters' | 'name' | 'ingredient' | 'saved', term }
  const [view, setView] = useState(null);
  const [lastSearch, setLastSearch] = useState(null); // so "Try again" and closing Saved can return to it
  const [results, setResults] = useState({ status: 'loading', drinks: [], error: '' });
  const [attempt, setAttempt] = useState(0); // bumped by "Try again"
  const [favorites, setFavorites] = useState(loadFavorites);
  const [dialog, setDialog] = useState(null);
  const dialogRequest = useRef(0); // ignores answers for a drink the user already moved on from
  const [toast, showToast] = useToast();

  const isSaved = (id) => favorites.some((d) => d.id === id);

  const runSearch = useCallback((kind, term, { updateUrl = true } = {}) => {
    term = term.trim();
    if (!term) return;
    setLastSearch({ kind, term });
    setView({ kind, term });
    if (updateUrl) setHash(`${kind}=${encodeURIComponent(term)}`);
  }, []);

  // Fetch whenever the view changes (Saved comes straight from favorites, no request needed).
  useEffect(() => {
    if (!view || view.kind === 'saved') return;
    let cancelled = false;
    setResults({ status: 'loading', drinks: [], error: '' });
    const request = view.kind === 'starters'
      ? loadStarters()
      : (view.kind === 'name' ? searchByName(view.term) : searchByIngredient(view.term)).then((list) => list.map(summary));
    request
      .then((drinks) => !cancelled && setResults({ status: 'ready', drinks, error: '' }))
      .catch((err) => !cancelled && setResults({ status: 'error', drinks: [], error: err.message }));
    return () => { cancelled = true; };
  }, [view, attempt]);

  const openDrink = useCallback(async (id, preloaded) => {
    const req = ++dialogRequest.current;
    setDialog({ status: 'loading' });
    try {
      const drink = preloaded || (await lookup(id));
      if (req !== dialogRequest.current) return;
      if (!drink) return setDialog({ status: 'missing' });
      setDialog({ status: 'ready', drink });
      setHash(`drink=${drink.idDrink}`);
    } catch (err) {
      if (req === dialogRequest.current) setDialog({ status: 'error', error: err.message });
    }
  }, []);

  async function openRandom() {
    const req = ++dialogRequest.current;
    setDialog({ status: 'loading' });
    try {
      const drink = await random();
      if (req !== dialogRequest.current) return;
      drink ? openDrink(drink.idDrink, drink) : setDialog({ status: 'missing' });
    } catch (err) {
      if (req === dialogRequest.current) setDialog({ status: 'error', error: err.message });
    }
  }

  function closeDrink() {
    dialogRequest.current++;
    setDialog(null);
    if (location.hash.startsWith('#drink=')) {
      setHash(lastSearch ? `${lastSearch.kind}=${encodeURIComponent(lastSearch.term)}` : '');
    }
  }

  function toggleFavorite(drink) {
    const wasSaved = isSaved(drink.id);
    const next = wasSaved ? favorites.filter((d) => d.id !== drink.id) : [drink, ...favorites];
    setFavorites(next);
    saveFavorites(next);
    showToast(wasSaved ? `Removed ${drink.name}` : `Saved ${drink.name}`);
  }

  function toggleSaved() {
    if (view?.kind === 'saved') {
      lastSearch ? runSearch(lastSearch.kind, lastSearch.term) : setView({ kind: 'starters' });
    } else {
      setView({ kind: 'saved' });
      setHash('');
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(location.href);
      showToast('Link copied');
    } catch {
      showToast('Copy the address from your browser bar to share this drink');
    }
  }

  // Reads the address (#name=..., #ingredient=..., #drink=...) so shared links open the right view.
  useEffect(() => {
    function followUrl({ firstLoad = false } = {}) {
      const { key, value } = readHash();
      if ((key === 'name' || key === 'ingredient') && value) {
        setMode(key);
        setQuery(value);
        runSearch(key, value, { updateUrl: false });
        return;
      }
      if (firstLoad) setView({ kind: 'starters' });
      if (key === 'drink' && value) openDrink(value);
    }
    followUrl({ firstLoad: true });
    // Links clicked or typed while the page is open.
    const onHashChange = () => followUrl();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [runSearch, openDrink]);

  const showingSaved = view?.kind === 'saved';
  const drinks = showingSaved ? favorites : results.drinks;
  const loading = !view || (!showingSaved && results.status === 'loading');

  let status = '';
  if (showingSaved) {
    status = favorites.length ? `${favorites.length} saved` : 'Nothing saved yet. Tap the heart on any drink to keep it here.';
  } else if (results.status === 'error') {
    status = (
      <>
        {results.error}{' '}
        <button className="link-btn" type="button" onClick={() => setAttempt((n) => n + 1)}>Try again</button>
      </>
    );
  } else if (results.status === 'ready' && view) {
    if (view.kind === 'starters') {
      if (!drinks.length) status = 'Search for a drink to get started.';
    } else if (!drinks.length) {
      const other = view.kind === 'name' ? 'ingredient' : 'drink name';
      status = `No drinks found for “${view.term}”. Check the spelling, or try searching by ${other}.`;
    } else {
      status = `${drinks.length} ${drinks.length === 1 ? 'drink' : 'drinks'}`;
    }
  }

  return (
    <>
      <header className="top">
        <div className="wrap">
          <h1>Cocktail Time</h1>
          <p className="lede">Find a drink by name, or by what's already on your shelf.</p>
          <SearchForm
            mode={mode}
            query={query}
            onModeChange={setMode}
            onQueryChange={setQuery}
            onSearch={runSearch}
            onRandom={openRandom}
          />
        </div>
      </header>

      <main className="wrap">
        <div className="results-head">
          <h2 id="results-title" aria-live="polite">{titleFor(view || { kind: 'starters' })}</h2>
          <button className="btn small" type="button" aria-pressed={showingSaved} onClick={toggleSaved}>
            Saved <span>{favorites.length}</span>
          </button>
        </div>
        <p className="status" role="status">{status}</p>
        {(loading || drinks.length > 0) && (
          <DrinkGrid
            drinks={drinks}
            loading={loading}
            isSaved={isSaved}
            onOpen={openDrink}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </main>

      <DrinkDialog
        state={dialog}
        isSaved={isSaved}
        onClose={closeDrink}
        onToggleFavorite={toggleFavorite}
        onCopyLink={copyLink}
        onAnother={openRandom}
      />

      <footer className="wrap foot">
        <p>
          Built by <a href="https://github.com/danyll39">Ursala Lindsey</a> with React and{' '}
          <a href="https://www.thecocktaildb.com">TheCocktailDB</a>. Please drink responsibly.
        </p>
      </footer>

      <div className={`toast${toast.visible ? ' show' : ''}`} role="status" aria-live="polite">{toast.message}</div>
    </>
  );
}
