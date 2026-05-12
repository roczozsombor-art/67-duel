# 67 DUEL — Mog or Get Mogged

Real-time 1v1 "67" gesture battle platform. Two players compete via webcam to perform the most reps of the viral "6-7" hand gesture in 60 seconds.

## Quick Start

```bash
# Install all dependencies
npm install && npm install --prefix client

# Start both server + client
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## How It Works

1. Enter a username on the home screen
2. Click "Find Opponent" — you're queued for matchmaking
3. When matched, WebRTC connects your webcams peer-to-peer
4. A 3-second countdown starts when both players are ready
5. Perform the 67 gesture (two hands alternating up/down) repeatedly
6. Most reps in 60 seconds wins
7. ELO changes are applied and your rank updates

## Gesture Detection

Uses MediaPipe Hands (loaded from CDN). The gesture detector:
- Requires **both hands** visible to the webcam
- Counts a rep when hand0 goes up while hand1 goes down, then they switch
- Debounced at 350ms per rep to prevent double-counting

**Debug tip:** Press `Spacebar` to manually add a rep (fallback when MediaPipe isn't available).

## Ranks

| ELO | Rank |
|-----|------|
| 0–800 | Bronze Mogger |
| 801–1100 | Silver Mogger |
| 1101–1400 | Gold Mogger |
| 1401–1700 | Platinum Mogger |
| 1701–2000 | Diamond Mogger |
| 2001+ | Sigma Skibidi 67 King |

## Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS + MediaPipe Hands + Socket.IO client
- **Backend**: Node.js + Express + Socket.IO + simple-peer (WebRTC signaling)
- **Storage**: JSON file (`server/data.json`, auto-created)
- **Dev runner**: concurrently
