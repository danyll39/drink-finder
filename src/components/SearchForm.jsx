const SPIRITS = ['Gin', 'Tequila', 'Rum', 'Vodka', 'Bourbon'];

export default function SearchForm({ mode, query, onModeChange, onQueryChange, onSearch, onRandom }) {
  function handleSubmit(e) {
    e.preventDefault();
    onSearch(mode, query);
  }

  function startWith(spirit) {
    onModeChange('ingredient');
    onQueryChange(spirit);
    onSearch('ingredient', spirit);
  }

  return (
    <>
      <form className="search" role="search" onSubmit={handleSubmit}>
        <div className="mode" role="radiogroup" aria-label="Search by">
          <label>
            <input type="radio" name="mode" value="name" checked={mode === 'name'} onChange={() => onModeChange('name')} /> Drink name
          </label>
          <label>
            <input type="radio" name="mode" value="ingredient" checked={mode === 'ingredient'} onChange={() => onModeChange('ingredient')} /> Ingredient
          </label>
        </div>
        <div className="search-row">
          <label htmlFor="query" className="visually-hidden">Search</label>
          <input
            id="query"
            type="search"
            autoComplete="off"
            placeholder={mode === 'name' ? 'Try margarita' : 'Try lime or gin'}
            required
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
          <button className="btn primary" type="submit">Search</button>
          <button className="btn" type="button" onClick={onRandom}>Surprise me</button>
        </div>
      </form>

      <div className="quick" aria-label="Popular spirits">
        <span>Or start with</span>
        {SPIRITS.map((spirit) => (
          <button key={spirit} type="button" onClick={() => startWith(spirit)}>{spirit}</button>
        ))}
      </div>
    </>
  );
}
