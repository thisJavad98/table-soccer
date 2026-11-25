import { useState } from 'react';
import LangSwitch from '../components/LangSwitch.jsx';
import Logo from '../components/Logo.jsx';
import { useI18n } from '../i18n/index.jsx';
import { getLeaderboard } from '../progress/store.js';

export default function Leaderboard({ onBack }) {
  const { t, f } = useI18n();
  const [rows] = useState(() => getLeaderboard(20));

  return (
    <div className="screen leaderboard is-in">
      <header className="leaderboard__head">
        <div className="welcome__brand">
          <Logo size={28} title={t.brand} />
          <span>{t.brand}</span>
        </div>
        <div className="welcome__head-actions">
          <LangSwitch />
          <button type="button" className="btn btn--ghost btn--compact" onClick={onBack}>
            {t.back}
          </button>
        </div>
      </header>

      <div className="leaderboard__body">
        <p className="eyebrow">{t.leaderboard}</p>
        <h1>{t.leaderboardTitle}</h1>
        <p className="lead">{t.leaderboardLead}</p>

        {rows.length === 0 ? (
          <p className="leaderboard__empty">{t.leaderboardEmpty}</p>
        ) : (
          <ol className="board">
            {rows.map((row, i) => (
              <li key={row.name} className={`board__row ${i === 0 ? 'is-top' : ''}`}>
                <span className="board__rank">{i + 1}</span>
                <div className="board__who">
                  <strong>{row.name}</strong>
                  <span>{f('recordLine', { w: row.wins, l: row.losses })}</span>
                </div>
                <span className="board__pts">{row.points}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
