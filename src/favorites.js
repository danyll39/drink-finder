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

export function saveFavorites(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage blocked: favorites just won't persist */
  }
}
