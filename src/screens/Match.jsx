import { useEffect, useRef, useState } from 'react';
import GoalCelebration from '../components/GoalCelebration.jsx';
import LangSwitch from '../components/LangSwitch.jsx';
import Logo from '../components/Logo.jsx';
import Pitch from '../components/Pitch.jsx';
import { GOAL_PAUSE_MS, GOALS_TO_WIN, PHYS_DT } from '../game/constants.js';
import { botThinkMs, decideBotKick } from '../game/bot.js';
import {
  afterGoalRestart,
  applyKick,
  createMatch,
  stepOrbit,
  stepPhysics,
} from '../game/engine.js';
import { getTeam } from '../game/teams.js';
import { useI18n } from '../i18n/index.jsx';
import { LOSS_POINTS, WIN_POINTS } from '../progress/catalog.js';
import { recordMatchResult } from '../progress/store.js';

export default function Match({ session, onExit, onRematch }) {
  const { t, lang, f } = useI18n();
  const [state, setState] = useState(() => createMatch(session));
  const [power, setPower] = useState(0);
  const [reward, setReward] = useState(null);
  const liveRef = useRef(null);
  const pitchRef = useRef(null);
  const botTimer = useRef(0);
  const goalTimer = useRef(0);
  const loopRaf = useRef(0);
  const scoredRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const humanTeam = getTeam(session.humanTeamId);
  const botTeam = getTeam(session.botTeamId);
  const difficulty = session.difficulty || 'medium';

  const resolveKey =
    state.phase === 'resolve'
      ? `${state.lastKickerId}:${state.passChain}:${state.score.human}-${state.score.bot}`
      : '';

  // Smooth physics: mutate + draw on canvas, commit to React only when phase changes
  useEffect(() => {
    if (!resolveKey) return undefined;

    liveRef.current = structuredClone(state);
    let alive = true;
    let acc = 0;
    let last = performance.now();
    const step = PHYS_DT * 60; // engine units: 1 ≈ one 60fps frame

    const loop = (now) => {
      if (!alive) return;
      const frameSec = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += frameSec;

      let current = liveRef.current;
      while (acc >= PHYS_DT && current.phase === 'resolve') {
        current = stepPhysics(current, step);
        acc -= PHYS_DT;
      }

      liveRef.current = current;
      pitchRef.current?.draw(current);

      if (current.phase === 'orbit') {
        setState(structuredClone(current));
        return;
      }

      if (current.phase !== 'resolve') {
        setState(structuredClone(current));
        return;
      }
      loopRaf.current = requestAnimationFrame(loop);
    };

    loopRaf.current = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(loopRaf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolveKey]);

  // Receiver walks around the ball after a pass
  useEffect(() => {
    if (state.phase !== 'orbit') return undefined;

    liveRef.current = structuredClone(state);
    let alive = true;
    let last = performance.now();

    const loop = (now) => {
      if (!alive) return;
      const dtSec = Math.min(0.05, (now - last) / 1000);
      last = now;
      let current = liveRef.current;
      current = stepOrbit(current, dtSec);
      liveRef.current = current;
      pitchRef.current?.draw(current);

      if (current.phase !== 'orbit') {
        setState(structuredClone(current));
        return;
      }
      loopRaf.current = requestAnimationFrame(loop);
    };

    loopRaf.current = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(loopRaf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase === 'orbit' ? state.lockedPlayerId : null, state.passChain]);

  useEffect(() => {
    if (state.phase !== 'aim' || state.turn !== 'bot') return undefined;
    botTimer.current = window.setTimeout(() => {
      setState((prev) => {
        if (prev.phase !== 'aim' || prev.turn !== 'bot') return prev;
        const decision = decideBotKick(prev, difficulty);
        return applyKick(prev, decision.playerId, decision.aim);
      });
    }, botThinkMs(difficulty));
    return () => clearTimeout(botTimer.current);
  }, [state.phase, state.turn, state.passChain, state.lockedPlayerId, difficulty]);

  useEffect(() => {
    if (state.phase !== 'goal') return undefined;
    goalTimer.current = window.setTimeout(() => {
      setState((prev) => afterGoalRestart(prev));
    }, GOAL_PAUSE_MS);
    return () => clearTimeout(goalTimer.current);
  }, [state.phase, state.score.human, state.score.bot]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onExit();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  useEffect(() => {
    if (state.phase !== 'over' || scoredRef.current) return;
    scoredRef.current = true;
    const won = state.winner === 'human';
    const updated = recordMatchResult(session.playerName, won);
    setReward({
      won,
      gained: won ? WIN_POINTS : LOSS_POINTS,
      points: updated.points,
    });
  }, [state.phase, state.winner, session.playerName]);

  function handleKick(playerId, aim) {
    setPower(0);
    setState((prev) => applyKick(prev, playerId, aim));
  }

  function rematch() {
    if (onRematch) {
      onRematch();
      return;
    }
    scoredRef.current = false;
    setReward(null);
    setState(createMatch(session));
  }

  const message = t[state.messageKey]
    ? f(state.messageKey, state.messageVars)
    : state.messageKey;

  const over = state.phase === 'over';
  const yourTurn = state.phase === 'aim' && state.turn === 'human';
  const orbiting = state.phase === 'orbit';

  const celebrating = state.phase === 'goal';
  const scoringTeam = state.lastGoal === 'human' ? humanTeam : botTeam;

  return (
    <div className={`screen match ${celebrating ? 'is-goal-shake' : ''}`}>
      <header className="match-bar">
        <div className="match-bar__row">
          <div className="match-brand">
            <Logo size={26} title={t.brand} />
            <span>{t.brand}</span>
          </div>
          <div className="match-bar__actions">
            <LangSwitch />
            <button type="button" className="btn btn--ghost" onClick={onExit}>
              {t.leaveTable}
            </button>
          </div>
        </div>

        <div className="scoreboard" aria-live="polite">
          <div className="scoreboard__side">
            <span
              className="scoreboard__badge"
              style={{ background: humanTeam.primary, color: humanTeam.secondary }}
            />
            <div>
              <span className="scoreboard__name">{session.playerName}</span>
              <span className="scoreboard__team">{humanTeam.name[lang]}</span>
            </div>
            <span
              className={`scoreboard__n ${celebrating && state.lastGoal === 'human' ? 'is-score-pop' : ''}`}
            >
              {state.score.human}
            </span>
          </div>
          <div className="scoreboard__mid">
            <span className="scoreboard__to">{f('firstTo', { n: GOALS_TO_WIN })}</span>
            <span className="scoreboard__vs">{t.vs}</span>
          </div>
          <div className="scoreboard__side scoreboard__side--bot">
            <span
              className={`scoreboard__n ${celebrating && state.lastGoal === 'bot' ? 'is-score-pop' : ''}`}
            >
              {state.score.bot}
            </span>
            <div>
              <span className="scoreboard__name">{t.bot}</span>
              <span className="scoreboard__team">{botTeam.name[lang]}</span>
            </div>
            <span
              className="scoreboard__badge"
              style={{ background: botTeam.primary, color: botTeam.secondary }}
            />
          </div>
        </div>
      </header>

      <div className="match-body">
        <aside className="match-rail match-rail--start" aria-hidden={false}>
          <p className="rail-label">{t.desktopTipTitle}</p>
          <ol className="rail-tips">
            <li>{t.desktopTip1}</li>
            <li>{t.desktopTip2}</li>
            <li>{t.desktopTip3}</li>
          </ol>
          <p className="rail-esc">{t.desktopEsc}</p>
          <p className="rail-diff">
            {t.difficulty}: {t.difficultyNames[difficulty]}
          </p>
        </aside>

        <div className="match-stage">
          <div className="match-stage__meta">
            <p className={`match-hint ${yourTurn ? 'is-you' : ''}`}>{message}</p>
            <div
              className={`turn-pill turn-pill--mobile ${yourTurn ? 'is-you' : orbiting ? 'is-you' : state.turn === 'bot' ? 'is-bot' : ''}`}
            >
              {orbiting
                ? t.orbiting
                : yourTurn
                  ? t.yourTurnShort
                  : state.turn === 'bot'
                    ? t.botTurnShort
                    : t.ballInPlay}
            </div>
          </div>
          <Pitch
            ref={pitchRef}
            state={state}
            onKick={handleKick}
            interactive={yourTurn}
            onPowerChange={setPower}
          />
          <div className="power-meter" aria-hidden={!yourTurn}>
            <span>{t.power}</span>
            <div className="power-meter__track">
              <div
                className="power-meter__fill"
                style={{ width: `${Math.round(power * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <aside className="match-rail match-rail--end">
          <div
            className={`turn-pill ${yourTurn ? 'is-you' : orbiting ? 'is-you' : state.turn === 'bot' ? 'is-bot' : ''}`}
          >
            {orbiting
              ? t.orbiting
              : yourTurn
                ? t.yourTurnShort
                : state.turn === 'bot'
                  ? t.botTurnShort
                  : t.ballInPlay}
          </div>
          {state.passChain > 0 && (
            <p className="pass-count">{f('passCount', { n: state.passChain })}</p>
          )}
        </aside>
      </div>

      {celebrating && state.lastGoal && (
        <GoalCelebration
          scorer={state.lastGoal}
          team={scoringTeam}
          score={state.score}
        />
      )}

      {(orbiting || (state.phase === 'aim' && state.passChain > 0 && state.turn === 'human')) && (
        <div className="banner banner--pass" role="status">
          {orbiting ? t.orbiting : t.nicePass}
        </div>
      )}

      {over && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="result-title">
          <div className="overlay__card">
            <Logo size={48} title={t.brand} />
            <p className="eyebrow">
              {state.winner === 'human' ? t.goal : t.botScores}
            </p>
            <h2 id="result-title">
              {state.winner === 'human'
                ? f('youWin', { name: session.playerName })
                : t.botWins}
            </h2>
            <p className="lead">
              {f('finalScore', { a: state.score.human, b: state.score.bot })}
            </p>
            {reward && (
              <p className="reward-line">
                {f('pointsGained', { n: reward.gained })}
                <span> · {f('pointsTotal', { n: reward.points })}</span>
              </p>
            )}
            <div className="overlay__actions">
              <button type="button" className="btn btn--primary" onClick={rematch}>
                {t.playAgain}
              </button>
              <button type="button" className="btn btn--ghost" onClick={onExit}>
                {t.changeSetup}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
