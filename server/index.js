const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { getUser, getUserByUsername, createUser, updateElo, saveMatch, getLeaderboard } = require('./db');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = FRONTEND_URL.split(',').map(s => s.trim());

const app = express();
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
});

// --- State ---
const queue = [];           // socket ids waiting for match
const activeMatches = {};   // matchId -> match state
const socketToMatch = {};   // socketId -> matchId
const socketToUser = {};    // socketId -> { userId, username, elo }

function getRank(elo) {
  if (elo <= 800) return { name: 'Bronze Mogger', tier: 'bronze' };
  if (elo <= 1100) return { name: 'Silver Mogger', tier: 'silver' };
  if (elo <= 1400) return { name: 'Gold Mogger', tier: 'gold' };
  if (elo <= 1700) return { name: 'Platinum Mogger', tier: 'platinum' };
  if (elo <= 2000) return { name: 'Diamond Mogger', tier: 'diamond' };
  return { name: 'Sigma Skibidi 67 King', tier: 'sigma' };
}

function calcElo(winner, loser, isDraw) {
  if (isDraw) return { winnerDelta: 5, loserDelta: 5 };
  return { winnerDelta: 25, loserDelta: -20 };
}

const MATCH_DURATION = 60; // seconds

// --- REST endpoints ---
app.get('/api/leaderboard', (req, res) => {
  res.json(getLeaderboard(50));
});

app.post('/api/user/register', (req, res) => {
  const { username } = req.body;
  if (!username || username.trim().length < 2 || username.trim().length > 20) {
    return res.status(400).json({ error: 'Username must be 2–20 characters' });
  }
  const trimmed = username.trim();
  const existing = getUserByUsername(trimmed);
  if (existing) return res.json({ user: existing, rank: getRank(existing.elo) });
  const id = uuidv4();
  const user = createUser(id, trimmed);
  res.json({ user, rank: getRank(user.elo) });
});

app.get('/api/user/:id', (req, res) => {
  const user = getUser(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ user, rank: getRank(user.elo) });
});

// --- Socket.IO ---
io.on('connection', (socket) => {
  console.log('+ connected:', socket.id);

  socket.on('identify', ({ userId, username, elo }) => {
    socketToUser[socket.id] = { userId, username, elo };
  });

  socket.on('join-queue', () => {
    if (queue.includes(socket.id)) return;
    if (socketToMatch[socket.id]) return; // already in a match
    queue.push(socket.id);
    socket.emit('queue-status', { position: queue.indexOf(socket.id) + 1 });

    if (queue.length >= 2) {
      const [sid1, sid2] = queue.splice(0, 2);
      const matchId = uuidv4();
      const u1 = socketToUser[sid1] || { userId: sid1, username: 'Mogger', elo: 1000 };
      const u2 = socketToUser[sid2] || { userId: sid2, username: 'Mogger', elo: 1000 };

      activeMatches[matchId] = {
        id: matchId,
        players: { [sid1]: { ...u1, reps: 0, ready: false }, [sid2]: { ...u2, reps: 0, ready: false } },
        sids: [sid1, sid2],
        startTime: null,
        timer: null,
        ended: false,
      };
      socketToMatch[sid1] = matchId;
      socketToMatch[sid2] = matchId;

      io.to(sid1).emit('match-found', { matchId, opponent: u2, role: 'initiator' });
      io.to(sid2).emit('match-found', { matchId, opponent: u1, role: 'receiver' });
    }
  });

  socket.on('leave-queue', () => {
    const idx = queue.indexOf(socket.id);
    if (idx !== -1) queue.splice(idx, 1);
  });

  // WebRTC signaling
  socket.on('signal', ({ matchId, signal }) => {
    const match = activeMatches[matchId];
    if (!match) return;
    const other = match.sids.find(s => s !== socket.id);
    if (other) io.to(other).emit('signal', { signal, from: socket.id });
  });

  socket.on('player-ready', ({ matchId }) => {
    const match = activeMatches[matchId];
    if (!match || match.ended) return;
    match.players[socket.id].ready = true;
    const allReady = match.sids.every(s => match.players[s]?.ready);
    if (allReady && !match.startTime) {
      match.startTime = Date.now();
      io.to(match.sids[0]).emit('match-start', { startTime: match.startTime });
      io.to(match.sids[1]).emit('match-start', { startTime: match.startTime });

      match.timer = setTimeout(() => endMatch(matchId), MATCH_DURATION * 1000 + 500);
    }
  });

  socket.on('rep-update', ({ matchId, reps }) => {
    const match = activeMatches[matchId];
    if (!match || match.ended) return;
    match.players[socket.id].reps = reps;
    const other = match.sids.find(s => s !== socket.id);
    if (other) io.to(other).emit('opponent-reps', { reps });
  });

  socket.on('disconnect', () => {
    console.log('- disconnected:', socket.id);
    const idx = queue.indexOf(socket.id);
    if (idx !== -1) queue.splice(idx, 1);

    const matchId = socketToMatch[socket.id];
    if (matchId) {
      const match = activeMatches[matchId];
      if (match && !match.ended) {
        const other = match.sids.find(s => s !== socket.id);
        if (other) io.to(other).emit('opponent-disconnected');
        endMatch(matchId, socket.id); // disconnected player forfeits
      }
    }
    delete socketToUser[socket.id];
    delete socketToMatch[socket.id];
  });
});

function endMatch(matchId, forfeitSid = null) {
  const match = activeMatches[matchId];
  if (!match || match.ended) return;
  match.ended = true;
  if (match.timer) clearTimeout(match.timer);

  const [sid1, sid2] = match.sids;
  const p1 = match.players[sid1];
  const p2 = match.players[sid2];

  let winnerId = null;
  let loserId = null;
  let isDraw = false;

  if (forfeitSid) {
    loserId = forfeitSid;
    winnerId = match.sids.find(s => s !== forfeitSid);
  } else if (p1.reps > p2.reps) {
    winnerId = sid1; loserId = sid2;
  } else if (p2.reps > p1.reps) {
    winnerId = sid2; loserId = sid1;
  } else {
    isDraw = true;
  }

  const u1 = socketToUser[sid1] || p1;
  const u2 = socketToUser[sid2] || p2;
  const user1 = getUser(u1.userId);
  const user2 = getUser(u2.userId);

  let p1Delta = 0, p2Delta = 0;

  if (user1 && user2) {
    if (isDraw) {
      p1Delta = 5; p2Delta = 5;
    } else {
      const winSid = winnerId;
      if (winSid === sid1) { p1Delta = 25; p2Delta = -20; }
      else { p1Delta = -20; p2Delta = 25; }
    }

    if (user1) {
      const res1 = isDraw ? 'draw' : (winnerId === sid1 ? 'win' : 'loss');
      updateElo(user1.id, p1Delta, res1);
    }
    if (user2) {
      const res2 = isDraw ? 'draw' : (winnerId === sid2 ? 'win' : 'loss');
      updateElo(user2.id, p2Delta, res2);
    }

    saveMatch({
      id: matchId,
      player1_id: user1.id,
      player2_id: user2.id,
      player1_reps: p1.reps,
      player2_reps: p2.reps,
      winner_id: winnerId ? (winnerId === sid1 ? user1.id : user2.id) : null,
      player1_elo_change: p1Delta,
      player2_elo_change: p2Delta,
    });
  }

  const newElo1 = user1 ? user1.elo + p1Delta : 1000;
  const newElo2 = user2 ? user2.elo + p2Delta : 1000;

  const result1 = isDraw ? 'draw' : (winnerId === sid1 ? 'win' : 'loss');
  const result2 = isDraw ? 'draw' : (winnerId === sid2 ? 'win' : 'loss');

  io.to(sid1).emit('match-end', {
    result: result1,
    yourReps: p1.reps,
    opponentReps: p2.reps,
    eloDelta: p1Delta,
    newElo: newElo1,
    newRank: getRank(newElo1),
    forfeit: forfeitSid === sid2,
  });

  io.to(sid2).emit('match-end', {
    result: result2,
    yourReps: p2.reps,
    opponentReps: p1.reps,
    eloDelta: p2Delta,
    newElo: newElo2,
    newRank: getRank(newElo2),
    forfeit: forfeitSid === sid1,
  });

  delete activeMatches[matchId];
  delete socketToMatch[sid1];
  delete socketToMatch[sid2];
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`67 DUEL server running on :${PORT}`));
