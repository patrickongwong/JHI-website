# Leaderboard Design

## Overview

Add a shared leaderboard to both golf-adventure and mini-golf games. A simple Node.js/Express server serves static files and provides API endpoints for score submission and retrieval. Scores are stored in CSV files.

## Architecture

- **Server:** `server.js` — Express app (~50 lines) serving static files + 2 API routes
- **Storage:** Two CSV files in `data/` directory
  - `data/leaderboard-golf-adventure.csv`
  - `data/leaderboard-mini-golf.csv`
  - Columns: `name,score,date`
- **Sorting:** Lowest score first (golf rules)

## API Endpoints

- `GET /api/leaderboard/:game` — Returns top 20 scores as JSON
- `POST /api/score` — Body: `{ game, name, score }` — Appends to CSV, returns updated top 20

## UI Flow (both games)

1. Game ends, score summary displays as before
2. Below score summary, leaderboard section appears:
   - Text input for player name (pre-filled from localStorage if returning player)
   - "Submit Score" button
3. On submit:
   - Name saved to localStorage for future sessions
   - Score posted to server
   - Input form replaced with scrollable top-20 leaderboard table
4. "Play Again" button appears below leaderboard

## Restrictions

- Golf Adventure: If player used the Patrick Wong character, the submit form is hidden and a message explains they're ineligible due to unfair advantage.

## Data Format

CSV with no header row, append-only:
```
PlayerName,27,2026-03-08
AnotherPlayer,31,2026-03-08
```
