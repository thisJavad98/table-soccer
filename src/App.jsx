import { useState } from 'react';
import Leaderboard from './screens/Leaderboard.jsx';
import Match from './screens/Match.jsx';
import Welcome from './screens/Welcome.jsx';

export default function App() {
  const [view, setView] = useState('welcome');
  const [session, setSession] = useState(null);

  if (session) {
    return (
      <Match
        session={session}
        onExit={() => {
          setSession(null);
          setView('welcome');
        }}
      />
    );
  }

  if (view === 'leaderboard') {
    return <Leaderboard onBack={() => setView('welcome')} />;
  }

  return (
    <Welcome
      onStart={setSession}
      onLeaderboard={() => setView('leaderboard')}
    />
  );
}
