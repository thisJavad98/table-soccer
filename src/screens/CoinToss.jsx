import { useEffect, useRef, useState } from 'react';
import CoinFace from '../components/CoinFace.jsx';
import LangSwitch from '../components/LangSwitch.jsx';
import Logo from '../components/Logo.jsx';
import { useI18n } from '../i18n/index.jsx';

const FLIP_MS = 2800;
const RESULT_HOLD_MS = 1600;

export default function CoinToss({ session, onComplete, onExit }) {
  const { t, f } = useI18n();
  const [phase, setPhase] = useState('pick'); // pick | flipping | result
  const [choice, setChoice] = useState(null); // heads | tails
  const [outcome, setOutcome] = useState(null);
  const [entered, setEntered] = useState(false);
  const timers = useRef([]);
  const coinRef = useRef(null);
  const rigRef = useRef(null);
  const animsRef = useRef([]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => {
      cancelAnimationFrame(id);
      timers.current.forEach(clearTimeout);
      animsRef.current.forEach((a) => a.cancel());
    };
  }, []);

  function queue(fn, ms) {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }

  function runFlip(result) {
    const turns = 6 + Math.floor(Math.random() * 3);
    // Heads at Y % 360 === 0; tails at 180. Final pose faces camera flat.
    const endY = turns * 360 + (result === 'tails' ? 180 : 0);
    const endSpin = `rotateY(${endY}deg) rotateX(0deg)`;
    const endFlight = 'translateY(8px) scale(1)';

    animsRef.current.forEach((a) => a.cancel());
    animsRef.current = [];

    const coin = coinRef.current;
    const rig = rigRef.current;
    if (!coin || !rig) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      coin.style.transform = endSpin;
      rig.style.transform = endFlight;
      return;
    }

    const spin = coin.animate(
      [
        { transform: 'rotateY(-28deg) rotateX(18deg)' },
        { transform: `rotateY(${endY * 0.32}deg) rotateX(-12deg)` },
        { transform: `rotateY(${endY * 0.68}deg) rotateX(22deg)` },
        { transform: `rotateY(${endY - 40}deg) rotateX(6deg)` },
        { transform: endSpin },
      ],
      {
        duration: FLIP_MS,
        easing: 'cubic-bezier(0.12, 0.72, 0.18, 1)',
        fill: 'forwards',
      },
    );

    const flight = rig.animate(
      [
        { transform: 'translateY(40px) scale(0.88)' },
        { transform: 'translateY(-118px) scale(1.12)', offset: 0.18 },
        { transform: 'translateY(-138px) scale(1.06)', offset: 0.48 },
        { transform: 'translateY(-6px) scale(1.01)', offset: 0.78 },
        { transform: 'translateY(18px) scale(0.98)', offset: 0.9 },
        { transform: endFlight },
      ],
      {
        duration: FLIP_MS,
        easing: 'cubic-bezier(0.22, 0.8, 0.25, 1)',
        fill: 'forwards',
      },
    );

    spin.onfinish = () => {
      coin.style.transform = endSpin;
    };
    flight.onfinish = () => {
      rig.style.transform = endFlight;
    };

    animsRef.current = [spin, flight];
  }

  function pick(side) {
    if (phase !== 'pick') return;
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    setChoice(side);
    setOutcome(result);
    setPhase('flipping');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => runFlip(result));
    });

    queue(() => {
      setPhase('result');
      queue(() => {
        const userWon = side === result;
        onComplete({
          ...session,
          kickoffTeam: userWon ? 'human' : 'bot',
        });
      }, RESULT_HOLD_MS);
    }, FLIP_MS);
  }

  const userWon = Boolean(choice && outcome && choice === outcome);
  const outcomeLabel = outcome === 'heads' ? t.coinHeads : t.coinTails;
  const choiceLabel = choice === 'heads' ? t.coinHeads : t.coinTails;

  return (
    <div
      className={`screen coin-toss coin-toss--${phase} ${entered ? 'is-in' : ''}`}
    >
      <header className="coin-toss__bar">
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
      </header>

      <div className="coin-toss__stage">
        <p className="eyebrow coin-toss__eyebrow">{t.coinTossEyebrow}</p>
        <h1 className="coin-toss__title">
          {phase === 'pick' && t.coinTossTitle}
          {phase === 'flipping' && t.coinTossFlipping}
          {phase === 'result' &&
            (userWon ? t.coinTossYouWin : t.coinTossBotWins)}
        </h1>
        <p className="lead coin-toss__lead">
          {phase === 'pick' && t.coinTossLead}
          {phase === 'flipping' && f('coinTossChoice', { side: choiceLabel })}
          {phase === 'result' &&
            f('coinTossLanded', { side: outcomeLabel })}
        </p>

        {phase === 'pick' ? (
          <div
            className="coin-toss__choices"
            role="group"
            aria-label={t.coinTossTitle}
          >
            <button
              type="button"
              className="coin-choice coin-choice--heads"
              onClick={() => pick('heads')}
            >
              <CoinFace side="heads" label={t.coinHeads} size="lg" />
              <span className="coin-choice__hint">{t.coinHeadsHint}</span>
            </button>
            <button
              type="button"
              className="coin-choice coin-choice--tails"
              onClick={() => pick('tails')}
            >
              <CoinFace side="tails" label={t.coinTails} size="lg" />
              <span className="coin-choice__hint">{t.coinTailsHint}</span>
            </button>
          </div>
        ) : (
          <>
            <div
              className={`coin-scene ${phase === 'result' ? 'is-settled' : ''}`}
              data-landed={phase === 'result' ? outcome : undefined}
            >
              <div className="coin-scene__glow" aria-hidden="true" />
              <div className="coin-scene__floor" aria-hidden="true" />

              {/* During flip: 3D coin. On result: replace with flat winning face. */}
              {phase === 'flipping' && (
                <div className="coin-rig" ref={rigRef} aria-hidden="true">
                  <div className="coin" ref={coinRef}>
                    <div className="coin__side coin__side--heads">
                      <CoinFace side="heads" label={t.coinHeads} size="xl" />
                    </div>
                    <div className="coin__side coin__side--tails">
                      <CoinFace side="tails" label={t.coinTails} size="xl" />
                    </div>
                    <div className="coin__rim" />
                  </div>
                </div>
              )}

              {phase === 'result' && outcome && (
                <div className="coin-landed" role="img" aria-label={outcomeLabel}>
                  <CoinFace side={outcome} label={outcomeLabel} size="xl" />
                  <p className="coin-landed__tag">{outcomeLabel}</p>
                </div>
              )}
            </div>

            {phase === 'result' && (
              <div
                className={`coin-result coin-result--${outcome} ${userWon ? 'is-win' : 'is-loss'}`}
                role="status"
              >
                <div className="coin-result__copy">
                  <span className="coin-result__side">{outcomeLabel}</span>
                  <strong>
                    {userWon ? t.coinTossYouWin : t.coinTossBotWins}
                  </strong>
                  <span>
                    {userWon ? t.coinTossKickoffYou : t.coinTossKickoffBot}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
