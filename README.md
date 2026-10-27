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

React and [Vite](https://vite.dev). Data comes from [TheCocktailDB](https://www.thecocktaildb.com) free API, whose test key is meant for learning and development projects.

```
index.html                      Page shell that React mounts into
src/main.jsx                    Starts the app
src/App.jsx                     App state: searches, favorites, shareable links, the open drink
src/components/SearchForm.jsx   Name/ingredient toggle, search box, spirit quick starts
src/components/DrinkGrid.jsx    Result cards with save buttons, loading skeleton
src/components/DrinkDialog.jsx  Recipe pop-up
src/components/Heart.jsx        Heart icon
src/useToast.js                 Short "Saved" / "Link copied" messages
src/api.js                      Requests to TheCocktailDB and recipe formatting
src/favorites.js                Saved drinks in localStorage
src/style.css                   Design, light and dark themes, phone layout
```

## Run it locally

```bash
npm install
npm run dev
```

Then open the address it prints. `npm run build` makes the production version in `dist/`.

## Deploying

`.github/workflows/deploy.yml` builds the app and publishes it to GitHub Pages on every push to `master`. In the repo's **Settings → Pages**, set **Source** to **GitHub Actions** once.

## History

- **2021:** First version in plain JavaScript.
- **2026:** Rewritten to fix opening drinks in current browsers (it relied on the removed `event.path`), adding ingredient search, favorites, shareable links, and a responsive design.
- **2026:** Converted to React components with Vite.
