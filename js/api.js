// TheCocktailDB API (free test key "1", meant for development and learning projects).
const BASE = 'https://www.thecocktaildb.com/api/json/v1/1';

async function get(path) {
  let res;
  try {
    res = await fetch(`${BASE}/${path}`);
  } catch {
    throw new Error("Couldn't reach TheCocktailDB. Check your connection and try again.");
  }
  if (!res.ok) throw new Error(`TheCocktailDB answered with an error (${res.status}). Try again in a minute.`);
  // Some endpoints return an empty body or plain text when nothing matches.
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    return Array.isArray(data?.drinks) ? data.drinks : [];
  } catch {
    return [];
  }
}

// Turn the API's numbered fields (strIngredient1, strMeasure1, ...) into a clean list.
export function ingredientsOf(drink) {
  const list = [];
  for (let i = 1; i <= 15; i++) {
    const name = drink[`strIngredient${i}`]?.trim();
    if (!name) continue;
    list.push({ name, measure: drink[`strMeasure${i}`]?.trim() || '' });
  }
  return list;
}

// Split the instructions into steps so they read like a recipe.
export function stepsOf(drink) {
  return (drink.strInstructions || '')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function summary(drink) {
  return { id: drink.idDrink, name: drink.strDrink, thumb: drink.strDrinkThumb };
}

export const searchByName = (name) => get(`search.php?s=${encodeURIComponent(name)}`);
export const searchByIngredient = (ingredient) => get(`filter.php?i=${encodeURIComponent(ingredient)}`);
export async function lookup(id) {
  const [drink] = await get(`lookup.php?i=${encodeURIComponent(id)}`);
  return drink || null;
}
export async function random() {
  const [drink] = await get('random.php');
  return drink || null;
}
