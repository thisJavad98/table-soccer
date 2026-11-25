import { useEffect, useState } from 'react';
import LangSwitch from '../components/LangSwitch.jsx';
import Logo from '../components/Logo.jsx';
import { GOALS_TO_WIN } from '../game/constants.js';
import { FORMATION_IDS, STADIUMS } from '../game/formations.js';
import { BOT_TEAM_ID, TEAMS } from '../game/teams.js';
import { useI18n } from '../i18n/index.jsx';

export default function Welcome({ onStart }) {
  const { t, lang, f } = useI18n();
  const [name, setName] = useState('');
  const [teamId, setTeamId] = useState('iran');
  const [attackFormation, setAttackFormation] = useState('standard');
  const [defenseFormation, setDefenseFormation] = useState('wall');
  const [stadiumId, setStadiumId] = useState('standard');
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function submit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onStart({
      playerName: trimmed.slice(0, 18),
      humanTeamId: teamId,
      botTeamId: teamId === BOT_TEAM_ID ? 'argentina' : BOT_TEAM_ID,
      attackFormation,
      defenseFormation,
      stadiumId,
    });
  }

  const selectedTeam = TEAMS.find((x) => x.id === teamId) || TEAMS[0];

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
          <LangSwitch />
        </header>

        <div className="welcome__body">
          <div className="welcome__intro">
            <p className="eyebrow">{t.tagline}</p>
            <h1>{t.brand}</h1>
            <p className="lead">{f('firstTo', { n: GOALS_TO_WIN })}</p>
          </div>

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
                  onChange={(e) => setAttackFormation(e.target.value)}
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
                  onChange={(e) => setDefenseFormation(e.target.value)}
                >
                  {FORMATION_IDS.map((id) => (
                    <option key={id} value={id}>
                      {t.formationNames[id]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <fieldset className="field">
              <legend>{t.chooseStadium}</legend>
              <div className="stadium-pills">
                {Object.keys(STADIUMS).map((id) => (
                  <label key={id} className={`stadium-pill ${stadiumId === id ? 'is-on' : ''}`}>
                    <input
                      type="radio"
                      name="stadium"
                      value={id}
                      checked={stadiumId === id}
                      onChange={() => setStadiumId(id)}
                    />
                    {t.stadiumNames[id]}
                  </label>
                ))}
              </div>
            </fieldset>

            <button type="submit" className="btn btn--primary" disabled={!name.trim()}>
              {t.playMatch}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
