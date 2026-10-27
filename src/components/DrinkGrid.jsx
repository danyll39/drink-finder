import Heart from './Heart.jsx';

function DrinkCard({ drink, saved, onOpen, onToggleFavorite }) {
  return (
    <li className="card">
      <button className="card-open" type="button" onClick={() => onOpen(drink.id)}>
        <img src={drink.thumb} alt="" loading="lazy" width="250" height="250" />
        <span className="card-name">{drink.name}</span>
      </button>
      <button
        className={`fav${saved ? ' on' : ''}`}
        type="button"
        aria-pressed={saved}
        aria-label={`${saved ? 'Remove' : 'Save'} ${drink.name}`}
        onClick={() => onToggleFavorite(drink)}
      >
        <Heart on={saved} />
      </button>
    </li>
  );
}

export default function DrinkGrid({ drinks, loading, isSaved, onOpen, onToggleFavorite }) {
  if (loading) {
    return (
      <ul className="grid" aria-labelledby="results-title">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} className="card skeleton" aria-hidden="true"><span /></li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="grid" aria-labelledby="results-title">
      {drinks.map((drink) => (
        <DrinkCard
          key={drink.id}
          drink={drink}
          saved={isSaved(drink.id)}
          onOpen={onOpen}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </ul>
  );
}
