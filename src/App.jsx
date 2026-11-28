import { useState } from 'react';
import CoinToss from './screens/CoinToss.jsx';
import Leaderboard from './screens/Leaderboard.jsx';
import Match from './screens/Match.jsx';
import Welcome from './screens/Welcome.jsx';

export default function App() {
  const [view, setView] = useState('welcome');
  const [session, setSession] = useState(null);
  const [tossDone, setTossDone] = useState(false);

  function clearSession() {
    setSession(null);
    setTossDone(false);
    setView('welcome');
  }

  if (session && !tossDone) {
    return (
      <CoinToss
        session={session}
        onComplete={(next) => {
          setSession(next);
          setTossDone(true);
        }}
        onExit={clearSession}
      />
    );
  }

  if (session && tossDone) {
    return (
      <Match
        session={session}
        onExit={clearSession}
        onRematch={() => setTossDone(false)}
      />
    );
  }

  if (view === 'leaderboard') {
    return <Leaderboard onBack={() => setView('welcome')} />;
  }

  return (
    <Welcome
      onStart={(next) => {
        setTossDone(false);
        setSession(next);
      }}
      onLeaderboard={() => setView('leaderboard')}
    />
  );
}
