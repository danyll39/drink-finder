// Saved drinks live in this browser (localStorage). Every access is wrapped,
// because storage can be blocked, for example in private windows.
const KEY = 'cocktail-time:favorites';

export function loadFavorites() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function save(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage blocked: favorites just won't persist */
  }
  return list;
}

export const isFavorite = (id) => loadFavorites().some((d) => d.id === id);

// Adds the drink if it isn't saved, removes it if it is. Returns true when it's now saved.
export function toggleFavorite(drink) {
  const list = loadFavorites();
  if (list.some((d) => d.id === drink.id)) {
    save(list.filter((d) => d.id !== drink.id));
    return false;
  }
  save([drink, ...list]);
  return true;
}
