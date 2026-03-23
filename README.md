# MarketMind

MarketMind is an AI-powered market analysis platform that helps users understand financial markets, individual stocks, and their personal watchlists using natural language.

Instead of manually reading multiple news articles or analyzing charts, users can simply ask questions like:

> "Why is NVDA moving today?"  
> "Analyze my tech watchlist."

MarketMind gathers relevant market data, news, and contextual information, then uses AI to generate short, clear explanations of what is happening in the market.

---

# Live Application

https://marketmind-ashy.vercel.app

---

# Overview

MarketMind combines real-time financial data, news sources, and AI analysis to provide concise explanations of market activity.

The system is built using a **multi-service architecture** consisting of:

- A **Next.js frontend**
- A **Node.js backend API**
- A **Python AI service**
- A **PostgreSQL database**

Each service is deployed independently and communicates through REST APIs.

---

# Features

### AI Market Analysis
Users can ask natural language questions about stocks and receive concise explanations based on:

- Market data
- News context
- Watchlist composition

Example queries:

```
Why is NVDA moving today?
Analyze my tech watchlist.
```

---

### Watchlists

Users can create and manage personal watchlists of stocks.

The AI assistant can analyze a watchlist and explain:

- sector exposure
- concentration risk
- macro sensitivity
- valuation characteristics

---

### News and Market Context

MarketMind integrates external financial data sources to ground AI responses in real-world information.

This allows the AI to explain:

- major price movements
- relevant company news
- broader market trends

---

# System Architecture

```
Frontend (Next.js)
↓
Backend API (Node.js / Express)
↓
AI Service (FastAPI)
↓
External Data + Database
```

### Infrastructure

```
Frontend: Vercel
Backend: Render
AI Service: Render
Database: Supabase PostgreSQL
```

---

# Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

Responsibilities:

- user interface
- authentication flow
- watchlist management
- chat interface

---

## Backend

- Node.js
- Express
- Prisma ORM
- PostgreSQL (Supabase)

Responsibilities:

- authentication
- user management
- watchlists
- chat session storage
- API orchestration

---

## AI Service

- Python
- FastAPI

Responsibilities:

- prompt construction
- market data processing
- news aggregation
- AI response generation

---

## AI & Data Sources

- Google Gemini
- Finnhub
- Yahoo Finance

These sources provide the financial data and context used by the AI assistant.

---

# Project Structure

```
marketmind
│
├── frontend
│   └── Next.js application
│
├── backend
│   └── Express API server
│
├── ai-service
│   └── FastAPI AI service
│
└── docs
```

---

# How It Works

1. The user asks a question in the chat interface.
2. The frontend sends the request to the backend API.
3. The backend forwards relevant data to the AI service.
4. The AI service gathers:
   - market data
   - news context
   - watchlist composition
5. The AI generates a concise explanation of market activity.
6. The response is returned to the frontend.

---

# Running Locally

### 1. Clone the repository

```
git clone <repo-url>
cd marketmind
```

---

### 2. Start the backend

```
cd backend
npm install
npm run dev
```

---

### 3. Start the AI service

```
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

### 4. Start the frontend

```
cd frontend
npm install
npm run dev
```

---

# Environment Variables

### Frontend

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001
```

### Backend

```
DATABASE_URL=your_supabase_database_url
JWT_SECRET=your_secret
AI_SERVICE_URL=http://localhost:8000
```

### AI Service

```
GEMINI_API_KEY=your_google_key
FINNHUB_API_KEY=your_finnhub_key
```

---

# Future Improvements

Planned enhancements include:

- real-time market streaming
- portfolio analytics
- improved news relevance ranking
- deeper AI financial reasoning
- richer visualization of watchlist risk

---

# Author

Ray Kang  
Software Engineering — Western University

---

# License

MIT License