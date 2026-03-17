from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
import os

load_dotenv()

app = FastAPI()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL = os.getenv("OPENAI_MODEL", "gpt-5.4-mini")

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

        context_text = "\n".join(context_bits).strip()

        input_messages = [
            {
                "role": "system",
                "content": system_prompt
            }
        ]

        if context_text:
            input_messages.append({
                "role": "system",
                "content": f"Context:\n{context_text}"
            })

        for msg in req.history[-8:]:
            if msg.get("role") in ["user", "assistant"] and msg.get("content"):
                input_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

        input_messages.append({
            "role": "user",
            "content": req.message
        })

        response = client.responses.create(
            model=MODEL,
            input=input_messages
        )

        return {
            "reply": response.output_text
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))