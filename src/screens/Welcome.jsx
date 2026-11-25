import { useEffect, useState } from 'react';
import FormationPreview from '../components/FormationPreview.jsx';
import LangSwitch from '../components/LangSwitch.jsx';
import Logo from '../components/Logo.jsx';
import { GOALS_TO_WIN } from '../game/constants.js';
import { FORMATION_IDS } from '../game/formations.js';
import { BOT_TEAM_ID, TEAMS } from '../game/teams.js';
import { useI18n } from '../i18n/index.jsx';
import { DISC_UNLOCKS, STADIUM_UNLOCKS } from '../progress/catalog.js';
import {
  ensurePlayer,
  getLastName,
  selectDisc,
  selectStadium,
  unlockDisc,
  unlockStadium,
} from '../progress/store.js';

export default function Welcome({ onStart, onLeaderboard }) {
  const { t, lang, f } = useI18n();
  const [name, setName] = useState(() => getLastName());
  const [player, setPlayer] = useState(() => ensurePlayer(getLastName()));
  const [teamId, setTeamId] = useState('iran');
  const [attackFormation, setAttackFormation] = useState('standard');
  const [defenseFormation, setDefenseFormation] = useState('wall');
  const [previewMode, setPreviewMode] = useState('attack');
  const [stadiumId, setStadiumId] = useState(() => ensurePlayer(getLastName()).selectedStadium);
  const [discId, setDiscId] = useState(() => ensurePlayer(getLastName()).selectedDisc);
  const [hint, setHint] = useState('');
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const trimmed = name.trim().slice(0, 18);
    if (!trimmed) {
      setPlayer(ensurePlayer(''));
      return;
    }
    const next = ensurePlayer(trimmed);
    setPlayer(next);
    setStadiumId(next.selectedStadium);
    setDiscId(next.selectedDisc);
    setHint('');
  }, [name]);

  const stadiumOwned = player.unlockedStadiums.includes(stadiumId);
  const discOwned = player.unlockedDiscs.includes(discId);
  const playStadium = stadiumOwned ? stadiumId : player.selectedStadium || 'standard';
  const playDisc = discOwned ? discId : player.selectedDisc || 'classic';

  function pickStadium(id) {
    setStadiumId(id);
    const trimmed = name.trim();
    if (!trimmed) {
      setHint(t.enterNameFirst);
      return;
    }
    const unlocked = player.unlockedStadiums.includes(id);
    if (unlocked) {
      const res = selectStadium(trimmed, id);
      if (res.ok) {
        setPlayer(res.player);
        setHint('');
      }
      return;
    }
    const res = unlockStadium(trimmed, id);
    if (res.ok) {
      setPlayer(res.player);
      setHint(f('unlockedItem', { name: t.stadiumNames[id] }));
      return;
    }
    if (res.reason === 'points') {
      setHint(`${f('needPoints', { n: res.need - player.points })} · ${t.buyToUse}`);
    }
  }

  function pickDisc(id) {
    setDiscId(id);
    const trimmed = name.trim();
    if (!trimmed) {
      setHint(t.enterNameFirst);
      return;
    }
    const unlocked = player.unlockedDiscs.includes(id);
    if (unlocked) {
      const res = selectDisc(trimmed, id);
      if (res.ok) {
        setPlayer(res.player);
        setHint('');
      }
      return;
    }
    const res = unlockDisc(trimmed, id);
    if (res.ok) {
      setPlayer(res.player);
      setHint(f('unlockedItem', { name: t.discNames[id] }));
      return;
    }
    if (res.reason === 'points') {
      setHint(`${f('needPoints', { n: res.need - player.points })} · ${t.buyToUse}`);
    }
  }

  function submit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!stadiumOwned || !discOwned) {
      setHint(t.buyToUse);
      return;
    }
    const saved = ensurePlayer(trimmed);
    onStart({
      playerName: trimmed.slice(0, 18),
      humanTeamId: teamId,
      botTeamId: teamId === BOT_TEAM_ID ? 'argentina' : BOT_TEAM_ID,
      attackFormation,
      defenseFormation,
      stadiumId: playStadium,
      discSkinId: playDisc,
    });
  }

  const selectedTeam = TEAMS.find((x) => x.id === teamId) || TEAMS[0];
  const hasName = Boolean(name.trim());
  const previewFormation = previewMode === 'attack' ? attackFormation : defenseFormation;
  const previewLabel =
    previewMode === 'attack'
      ? `${t.previewAttack} · ${t.formationNames[attackFormation]}`
      : `${t.previewDefense} · ${t.formationNames[defenseFormation]}`;

  return (
    <div className={`screen welcome ${entered ? 'is-in' : ''}`}>
      <div className="welcome__visual" aria-hidden="true">
        <img
          className="welcome__photo"
          src="/img/photo-f55265356.jpg"
          srcSet="/img/photo-f55265356-500.jpg 500w, /img/photo-f55265356-960.jpg 960w, /img/photo-f55265356-1280.jpg 1280w, /img/photo-f55265356.jpg 1920w"
          sizes="(min-width: 960px) 48vw, 100vw"
          width="1920"
          height="1280"
          alt=""
          fetchPriority="high"
          decoding="async"
        />
        <div className="welcome__veil" />
        <div className="welcome__visual-mark">
          <Logo size={56} title={t.brand} />
          <p>{t.brand}</p>
        </div>
      </div>

      <div className="welcome__panel">
        <header className="welcome__head">
          <div className="welcome__brand">
            <Logo size={28} title={t.brand} />
            <span>{t.brand}</span>
          </div>
          <div className="welcome__head-actions">
            <button type="button" className="btn btn--ghost btn--compact" onClick={onLeaderboard}>
              {t.leaderboard}
            </button>
            <LangSwitch />
          </div>
        </header>

        <div className="welcome__body">
          <div className="welcome__intro">
            <p className="eyebrow">{t.tagline}</p>
            <h1>{t.brand}</h1>
            <p className="lead">{f('firstTo', { n: GOALS_TO_WIN })}</p>
          </div>

          {hasName && (
            <div className="points-bar" aria-live="polite">
              <span className="points-bar__label">{t.yourPoints}</span>
              <strong className="points-bar__n">{player.points}</strong>
              <span className="points-bar__meta">
                {f('recordLine', { w: player.wins, l: player.losses })}
              </span>
            </div>
          )}

          <form className="setup-form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="player-name">{t.yourName}</label>
              <input
                id="player-name"
                value={name}
                maxLength={18}
                autoComplete="nickname"
                placeholder={t.namePlaceholder}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <fieldset className="field">
              <legend>
                {t.chooseTeam}
                <span className="field__value">{selectedTeam.name[lang]}</span>
              </legend>
              <div className="team-dots" role="radiogroup" aria-label={t.chooseTeam}>
                {TEAMS.map((team) => (
                  <label
                    key={team.id}
                    className={`team-dot team-dot--${team.style} ${teamId === team.id ? 'is-on' : ''}`}
                    title={team.name[lang]}
                    style={{
                      '--team-a': team.bands[0],
                      '--team-b': team.bands[1],
                      '--team-c': team.bands[2],
                    }}
                  >
                    <input
                      type="radio"
                      name="team"
                      value={team.id}
                      checked={teamId === team.id}
                      onChange={() => setTeamId(team.id)}
                    />
                    <span className="team-dot__swatch" aria-hidden="true" />
                    <span className="visually-hidden">{team.name[lang]}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="setup-row">
              <div className="field">
                <label htmlFor="attack-f">{t.attackingFormation}</label>
                <select
                  id="attack-f"
                  value={attackFormation}
                  onChange={(e) => {
                    setAttackFormation(e.target.value);
                    setPreviewMode('attack');
                  }}
                >
                  {FORMATION_IDS.map((id) => (
                    <option key={id} value={id}>
                      {t.formationNames[id]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="defense-f">{t.defendingFormation}</label>
                <select
                  id="defense-f"
                  value={defenseFormation}
                  onChange={(e) => {
                    setDefenseFormation(e.target.value);
                    setPreviewMode('defense');
                  }}
                >
                  {FORMATION_IDS.map((id) => (
                    <option key={id} value={id}>
                      {t.formationNames[id]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field formation-preview-block">
              <div className="formation-preview-block__head">
                <span className="field__legend-like">{t.formationPreview}</span>
                <div className="preview-tabs" role="tablist" aria-label={t.formationPreview}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={previewMode === 'attack'}
                    className={`preview-tabs__btn ${previewMode === 'attack' ? 'is-on' : ''}`}
                    onClick={() => setPreviewMode('attack')}
                  >
                    {t.previewAttack}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={previewMode === 'defense'}
                    className={`preview-tabs__btn ${previewMode === 'defense' ? 'is-on' : ''}`}
                    onClick={() => setPreviewMode('defense')}
                  >
                    {t.previewDefense}
                  </button>
                </div>
              </div>
              <FormationPreview
                formationId={previewFormation}
                stadiumId={stadiumId}
                team={selectedTeam}
                discSkinId={discId}
                modeLabel={previewLabel}
              />
            </div>

            <fieldset className="field">
              <legend>{t.chooseStadium}</legend>
              <div className="unlock-grid unlock-grid--stadium">
                {STADIUM_UNLOCKS.map((item) => {
                  const unlocked = player.unlockedStadiums.includes(item.id);
                  const selected = stadiumId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`unlock-tile ${selected ? 'is-on' : ''} ${unlocked ? '' : 'is-locked'}`}
                      onClick={() => pickStadium(item.id)}
                      aria-pressed={selected}
                      aria-label={
                        unlocked
                          ? t.stadiumNames[item.id]
                          : f('lockedCost', { name: t.stadiumNames[item.id], n: item.cost })
                      }
                    >
                      <span
                        className="unlock-tile__swatch"
                        style={{
                          background: `linear-gradient(135deg, ${item.grass[0]}, ${item.grass[2]})`,
                        }}
                        aria-hidden="true"
                      />
                      <span className="unlock-tile__name">{t.stadiumNames[item.id]}</span>
                      {!unlocked && (
                        <span className="unlock-tile__lock">
                          <span className="unlock-tile__padlock" aria-hidden="true" />
                          <span>{item.cost}</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="field">
              <legend>{t.chooseDisc}</legend>
              <div className="unlock-grid unlock-grid--disc">
                {DISC_UNLOCKS.map((item) => {
                  const unlocked = player.unlockedDiscs.includes(item.id);
                  const selected = discId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`unlock-tile unlock-tile--disc ${selected ? 'is-on' : ''} ${unlocked ? '' : 'is-locked'}`}
                      onClick={() => pickDisc(item.id)}
                      aria-pressed={selected}
                      aria-label={
                        unlocked
                          ? t.discNames[item.id]
                          : f('lockedCost', { name: t.discNames[item.id], n: item.cost })
                      }
                    >
                      <span
                        className={`unlock-tile__disc unlock-tile__disc--${item.motion || item.id}`}
                        style={{
                          borderColor: item.rim,
                          background: item.tint || 'rgba(255,255,255,0.12)',
                        }}
                        aria-hidden="true"
                      />
                      <span className="unlock-tile__name">{t.discNames[item.id]}</span>
                      {!unlocked && (
                        <span className="unlock-tile__lock">
                          <span className="unlock-tile__padlock" aria-hidden="true" />
                          <span>{item.cost}</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {hint && (
              <p className="setup-hint" role="status">
                {hint}
              </p>
            )}

            <button
              type="submit"
              className="btn btn--primary"
              disabled={!hasName || !stadiumOwned || !discOwned}
            >
              {t.playMatch}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
