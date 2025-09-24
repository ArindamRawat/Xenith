const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8787;
const DATA_DIR = __dirname;
const BETS_FILE = path.join(DATA_DIR, 'bets.json');
const SENTIMENT_FILE = path.join(DATA_DIR, 'sentiment.json');

app.use(cors());
app.use(express.json());

function ensureFile() {
  if (!fs.existsSync(BETS_FILE)) {
    fs.writeFileSync(BETS_FILE, JSON.stringify({ bets: [] }, null, 2));
  }
  if (!fs.existsSync(SENTIMENT_FILE)) {
    fs.writeFileSync(SENTIMENT_FILE, JSON.stringify({ history: [] }, null, 2));
  }
}

function readBets() {
  ensureFile();
  try {
    const raw = fs.readFileSync(BETS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { bets: [] };
  }
}

function writeBets(data) {
  fs.writeFileSync(BETS_FILE, JSON.stringify(data, null, 2));
}

function readSentiment() {
  ensureFile();
  try {
    const raw = fs.readFileSync(SENTIMENT_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { history: [] };
  }
}

function writeSentiment(data) {
  fs.writeFileSync(SENTIMENT_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/bets', (req, res) => {
  const data = readBets();
  res.json(data);
});

app.post('/api/bets', (req, res) => {
  const bet = req.body;
  if (!bet || !bet.id) {
    return res.status(400).json({ error: 'missing id' });
  }
  const data = readBets();
  const idx = data.bets.findIndex(b => b.id === bet.id);
  if (idx >= 0) {
    data.bets[idx] = { ...data.bets[idx], ...bet };
  } else {
    data.bets.push(bet);
  }
  writeBets(data);
  res.json({ ok: true });
});

// ----- Sentiment history endpoints -----
app.get('/api/sentiment', (req, res) => {
  const data = readSentiment();
  // Optionally cap to last 500 samples server-side
  if (Array.isArray(data.history) && data.history.length > 500) {
    data.history = data.history.slice(-500);
    writeSentiment(data);
  }
  res.json(data);
});

app.post('/api/sentiment', (req, res) => {
  const sample = req.body; // { t, score, trend }
  if (!sample || typeof sample.t !== 'number') {
    return res.status(400).json({ error: 'invalid sample' });
  }
  const data = readSentiment();
  if (!Array.isArray(data.history)) data.history = [];
  data.history.push({ t: sample.t, score: sample.score, trend: sample.trend });
  // Cap to last 1000 samples
  data.history = data.history.slice(-1000);
  writeSentiment(data);
  res.json({ ok: true });
});

// Ensure data files exist on startup
ensureFile();

app.listen(PORT, () => {
  console.log(`Bets server listening on http://localhost:${PORT}`);
});


