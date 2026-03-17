from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
import os

load_dotenv()

app = FastAPI()

client = genai.Client()
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


class ChatRequest(BaseModel):
    message: str
    watchlist_name: str | None = None
    tickers: list[str] = []
    history: list[dict] = []


@app.get("/health")
def health():
    return {"message": "AI service is running"}


@app.post("/chat")
def chat(req: ChatRequest):
    try:
        system_prompt = """
You are MarketMind, an AI-powered investment research assistant.

Rules:
- Be concise, clear, and analytical.
- Do not give direct financial advice like "buy" or "sell".
- Frame answers as informational analysis.
- If market data is missing or stale, say so clearly.
- If the user references a watchlist, use the provided watchlist context.
"""

        context_bits = []
        if req.watchlist_name:
            context_bits.append(f"Selected watchlist: {req.watchlist_name}")
        if req.tickers:
            context_bits.append(f"Watchlist tickers: {', '.join(req.tickers)}")

        history_text = ""
        for msg in req.history[-6:]:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if content:
                history_text += f"{role.capitalize()}: {content}\n"

        context_text = "\n".join(context_bits).strip()

        prompt = f"""
{system_prompt}

{"Context:\n" + context_text if context_text else ""}

Conversation so far:
{history_text}

User: {req.message}
Assistant:
""".strip()

        response = client.models.generate_content(
            model=MODEL,
            contents=prompt
        )

        return {
            "reply": response.text if response.text else "No response generated."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))