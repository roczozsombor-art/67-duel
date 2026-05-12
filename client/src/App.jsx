import React, { useState } from 'react';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Match from './pages/Match';
import Results from './pages/Results';

export default function App() {
  const [page, setPage] = useState('home');
  const [user, setUser] = useState(null);
  const [rank, setRank] = useState(null);
  const [matchInfo, setMatchInfo] = useState(null); // { matchId, opponent, role }
  const [matchResult, setMatchResult] = useState(null);

  function handleEnterLobby(u, r) {
    setUser(u);
    setRank(r);
    setPage('lobby');
  }

  function handleMatchFound({ matchId, opponent, role }) {
    setMatchInfo({ matchId, opponent, role });
    setPage('match');
  }

  function handleMatchEnd(data) {
    setMatchResult(data);
    // Refresh user ELO
    const saved = localStorage.getItem('67duel_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        fetch(`/api/user/${u.id}`)
          .then(r => r.json())
          .then(d => {
            if (d.user) {
              localStorage.setItem('67duel_user', JSON.stringify(d.user));
              setUser(d.user);
              setRank(d.rank);
            }
          })
          .catch(() => {});
      } catch {}
    }
    setPage('results');
  }

  function handlePlayAgain() {
    setMatchResult(null);
    setMatchInfo(null);
    setPage('lobby');
  }

  function handleHome() {
    setMatchResult(null);
    setMatchInfo(null);
    setPage('home');
  }

  switch (page) {
    case 'home':
      return <Home onEnterLobby={handleEnterLobby} />;
    case 'lobby':
      return (
        <Lobby
          user={user}
          rank={rank}
          onMatchFound={handleMatchFound}
          onLeave={() => setPage('home')}
        />
      );
    case 'match':
      return (
        <Match
          user={user}
          opponent={matchInfo?.opponent}
          matchId={matchInfo?.matchId}
          role={matchInfo?.role}
          onMatchEnd={handleMatchEnd}
        />
      );
    case 'results':
      return (
        <Results
          result={matchResult}
          user={user}
          opponent={matchInfo?.opponent}
          onPlayAgain={handlePlayAgain}
          onHome={handleHome}
        />
      );
    default:
      return <Home onEnterLobby={handleEnterLobby} />;
  }
}
