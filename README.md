# Cocktail Time

Find a cocktail by name, or by an ingredient you already have, and get the full recipe.

**Live site:** https://danyll39.github.io/drink-finder/

## Features

- **Search two ways:** by drink name (margarita) or by ingredient (gin, lime)
- **Quick starts** for popular spirits, plus a **Surprise me** random drink
- **Recipe view:** ingredients with measures, numbered steps, glass and category
- **Save favorites** with the heart button (kept in your browser)
- **Shareable links:** every search and drink has its own address, like `#drink=11007`
- Loading, empty, and error states, keyboard and screen-reader friendly, light and dark mode, works on phones

## Built with

HTML, CSS, and JavaScript modules, with no frameworks or build step. Data comes from [TheCocktailDB](https://www.thecocktaildb.com) free API, whose test key is meant for learning and development projects.

```
index.html        Page layout
style.css         Design, light and dark themes, phone layout
script.js         Search, results, recipe dialog, favorites, shareable links
js/api.js         Requests to TheCocktailDB and recipe formatting
js/favorites.js   Saved drinks in localStorage
```

## Run it locally

Browsers block JavaScript modules opened straight from a file, so use a small local server:

```bash
npx serve .
```

Then open the address it prints.

## What changed in the 2026 update

The original 2021 version stopped opening drinks in current browsers because it relied on the removed `event.path` property. The rewrite fixes that and adds ingredient search, favorites, shareable links, step-by-step recipes, safer HTML handling, and a new responsive design.
