import { useState } from 'react';
import Match from './screens/Match.jsx';
import Welcome from './screens/Welcome.jsx';

export default function App() {
  const [session, setSession] = useState(null);

  if (!session) {
    return <Welcome onStart={setSession} />;
  }

  return <Match session={session} onExit={() => setSession(null)} />;
}
