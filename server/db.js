const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return { users: {}, matches: [] };
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function getUser(id) {
  return loadDB().users[id] || null;
}

function getUserByUsername(username) {
  const db = loadDB();
  return Object.values(db.users).find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
}

function createUser(id, username) {
  const db = loadDB();
  const user = { id, username, elo: 1000, wins: 0, losses: 0, draws: 0, created_at: Date.now() };
  db.users[id] = user;
  saveDB(db);
  return user;
}

function updateElo(id, eloDelta, result) {
  const db = loadDB();
  if (!db.users[id]) return;
  db.users[id].elo = Math.max(0, db.users[id].elo + eloDelta);
  if (result === 'win') db.users[id].wins += 1;
  else if (result === 'loss') db.users[id].losses += 1;
  else db.users[id].draws += 1;
  saveDB(db);
}

function saveMatch(match) {
  const db = loadDB();
  db.matches.push({ ...match, played_at: Date.now() });
  if (db.matches.length > 1000) db.matches = db.matches.slice(-1000);
  saveDB(db);
}

function getLeaderboard(limit = 20) {
  const db = loadDB();
  return Object.values(db.users)
    .sort((a, b) => b.elo - a.elo)
    .slice(0, limit)
    .map(({ id, username, elo, wins, losses, draws }) => ({ id, username, elo, wins, losses, draws }));
}

module.exports = { getUser, getUserByUsername, createUser, updateElo, saveMatch, getLeaderboard };
