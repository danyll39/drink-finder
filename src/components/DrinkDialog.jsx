import { useEffect, useRef } from 'react';
import { ingredientsOf, stepsOf, summary } from '../api.js';
import Heart from './Heart.jsx';

// state is null (closed), or { status: 'loading' | 'ready' | 'missing' | 'error', drink, error }
export default function DrinkDialog({ state, isSaved, onClose, onToggleFavorite, onCopyLink, onAnother }) {
  const ref = useRef(null);

  // The native <dialog> gives focus trapping, Esc to close, and the backdrop for free.
  useEffect(() => {
    const dialog = ref.current;
    if (state && !dialog.open) dialog.showModal();
    if (!state && dialog.open) dialog.close();
  }, [state]);

  const close = () => ref.current.close();

  return (
    <dialog
      ref={ref}
      aria-labelledby="drink-name"
      onClose={onClose}
      // Click outside the panel closes it.
      onClick={(e) => e.target === ref.current && close()}
    >
      <div className="dialog-body">
        {state && <Body state={state} isSaved={isSaved} close={close} onToggleFavorite={onToggleFavorite} onCopyLink={onCopyLink} onAnother={onAnother} />}
      </div>
    </dialog>
  );
}

function Body({ state, isSaved, close, onToggleFavorite, onCopyLink, onAnother }) {
  if (state.status === 'loading') {
    return <p className="dialog-loading" role="status">Mixing…</p>;
  }
  if (state.status !== 'ready') {
    return (
      <p className="dialog-loading">
        {state.status === 'missing' ? 'That drink could not be found.' : state.error}{' '}
        <button className="link-btn" type="button" onClick={close}>Close</button>
      </p>
    );
  }

  const { drink } = state;
  const s = summary(drink);
  const saved = isSaved(s.id);
  const tags = [drink.strCategory, drink.strAlcoholic, drink.strGlass].filter(Boolean);

  return (
    <>
      <button className="close" type="button" aria-label="Close" onClick={close}>×</button>
      <img className="drink-photo" src={s.thumb} alt={s.name} width="400" height="400" />
      <div className="drink-text">
        <h2 id="drink-name">{s.name}</h2>
        {tags.length > 0 && (
          <ul className="tags">{tags.map((t) => <li key={t}>{t}</li>)}</ul>
        )}
        <h3>You'll need</h3>
        <ul className="ingredients">
          {ingredientsOf(drink).map((i, n) => (
            <li key={`${n}-${i.name}`}>
              <span className="amt">{i.measure || ' '}</span>
              <span>{i.name}</span>
            </li>
          ))}
        </ul>
        <h3>How to make it</h3>
        <ol className="steps">
          {stepsOf(drink).map((step, i) => <li key={i}>{step}</li>)}
        </ol>
        <div className="drink-actions">
          <button className={`btn${saved ? ' primary' : ''}`} type="button" aria-pressed={saved} onClick={() => onToggleFavorite(s)}>
            <Heart on={saved} /> {saved ? 'Saved' : 'Save'}
          </button>
          <button className="btn" type="button" onClick={onCopyLink}>Copy link</button>
          <button className="btn" type="button" onClick={onAnother}>Another random drink</button>
        </div>
      </div>
    </>
  );
}
