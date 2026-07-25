# 🎰 Nudge — Gamified Search Interface

A slot-machine-style search interface where users spin animated reels to discover search results. Earn free social credits for each spin, with bonus credits for winning combinations.

## ✨ Features

- **Reel-style search**: Enter a query, get results across 3 animated slot-machine reels
- **Spin to randomize**: Click SPIN to shuffle visible results with smooth animation
- **Social credits**: Earn 1 credit per spin, +2 bonus for winning combinations
- **User accounts**: JWT auth for credit tracking and leaderboard competition
- **Leaderboard**: Compete with other users on social credit balance
- **Mobile responsive**: Works great on phones and tablets
- **No monetization**: Credits are purely cosmetic — no dark patterns, no purchase path

## 🏗️ Tech Stack

- **Frontend**: React 18 + Vite (deployed on Vercel)
- **Backend**: Node.js + Express (deployed on Render or Railway)
- **Database**: PostgreSQL (free tier on Render or Aiven)
- **Search APIs**: SerpAPI, Google Custom Search, DuckDuckGo (with demo mode fallback)
- **Real-time**: Socket.io for instant credit updates

## 🚀 Quick Start (Docker Compose)

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd nudge

# 2. Set environment variables
cp .env.example .env
# Edit .env with your actual values

# 3. Run with Docker Compose
docker-compose up --build

# 4. Access the app
# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
# Health:   http://localhost:5000/health
```

## 📁 Project Structure

```
nudge/
├── nudge-backend/          # Express + PostgreSQL API
│   ├── src/
│   │   ├── server.js
│   │   ├── config/         # Database + Search API config
│   │   ├── routes/         # Express routes
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, error handling, rate limiting
│   │   └── utils/          # Logger
│   ├── migrations/         # SQL schema
│   ├── scripts/            # Migration runner
│   ├── Dockerfile
│   └── .env.example
├── nudge-frontend/         # React + Vite frontend
│   ├── src/
│   │   ├── components/     # ReelSpinner, ResultCard, etc.
│   │   ├── pages/          # Search, Auth, Profile, Leaderboard
│   │   ├── hooks/          # useAuth, useSearch, useCredits
│   │   ├── context/        # AuthContext
│   │   └── styles/         # CSS
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🔑 Environment Variables

### Backend (.env)
| Variable | Description | Required |
|---|---|---|
| `DB_USER` | PostgreSQL username | Yes |
| `DB_PASSWORD` | PostgreSQL password | Yes |
| `DB_HOST` | Database host | Yes |
| `DB_PORT` | Database port (default 5432) | Yes |
| `DB_NAME` | Database name | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `REFRESH_TOKEN_SECRET` | Refresh token secret | Yes |
| `SERPAPI_KEY` | SerpAPI key (250 free searches/mo) | No |
| `GOOGLE_CSE_KEY` | Google Custom Search API key | No |
| `GOOGLE_CSE_CX` | Google Custom Search Engine ID | No |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `PORT` | Backend port (default 5000) | No |

### Frontend (.env)
| Variable | Description | Required |
|---|---|---|
| `VITE_API_URL` | Backend API URL | Yes |

> **Note**: If no search API keys are set, the app runs in **demo mode** with mock results — so you can test immediately without any API keys.

## 📦 Deployment

### Option 1: Docker Compose (Local)
Follow the Quick Start above.

### Option 2: Render (Backend + DB) + Vercel (Frontend)

**Backend on Render:**
1. Push `nudge-backend/` to GitHub
2. Create a new Web Service on Render, connect the repo
3. Build: `npm install`
4. Start: `npm start`
5. Add environment variables from the table above

**Database on Render:**
1. Create a PostgreSQL database on Render
2. Copy the internal connection string
3. Set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` on the backend
4. Run migrations: `npm run migrate`

**Frontend on Vercel:**
1. Push `nudge-frontend/` to GitHub
2. Import the project on Vercel
3. Set `VITE_API_URL` to your Render backend URL
4. Deploy

### Option 3: Railway (Full Stack)
1. Push the entire repo to GitHub
2. Create a new project on Railway
3. Add a PostgreSQL database
4. Deploy the backend from `nudge-backend/`
5. Deploy the frontend from `nudge-frontend/`
6. Set environment variables

## 🔍 Search API Setup

The app tries APIs in this order and falls back to demo mode:

1. **SerpAPI** (if `SERPAPI_KEY` set) — 250 free searches/month
2. **Google Custom Search** (if `GOOGLE_CSE_KEY` + `GOOGLE_CSE_CX` set) — 100 free searches/day
3. **DuckDuckGo** (always free, no key) — HTML scraping
4. **Demo mode** — generates mock results when no API is available

## 🎮 How It Works

1. User enters a search query
2. Backend fetches results from the configured search API(s)
3. Results are distributed across 3 reels (round-robin)
4. User clicks SPIN to animate and randomize visible results
5. When reels stop, the user earns 1 social credit
6. If the top result on each reel shares the same domain OR all have high relevance, it's a winning combination (+2 bonus credits)
7. Credits are saved to the user's account and updated in real-time via Socket.io

## 📊 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/refresh` | No | Refresh token |
| GET | `/api/auth/profile` | Yes | Get user profile |
| POST | `/api/search/query` | Optional | Perform search |
| GET | `/api/search/history` | Yes | Search history |
| POST | `/api/credits/spin` | Optional | Record spin, earn credits |
| GET | `/api/credits/balance` | Yes | Credit balance |
| GET | `/api/credits/stats` | Yes | Spin statistics |
| GET | `/api/leaderboard/top` | No | Top 100 users |
| GET | `/api/leaderboard/rank/:userId` | No | User's rank |

## 📝 License

MIT
