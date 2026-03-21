from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
import os

from app.services.ticker_detection import detect_all_tickers
from app.services.market_data_service import fetch_market_data_for_tickers
from app.services.news_service import fetch_news_for_tickers
from app.services.prompt_builder import build_market_context, build_news_context, build_prompt

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
        detected_tickers = detect_all_tickers(
            message=req.message,
            request_tickers=req.tickers,
        )

        market_data = fetch_market_data_for_tickers(detected_tickers, max_tickers=3)
        news_items = fetch_news_for_tickers(detected_tickers, per_ticker_limit=3, total_limit=5)

        market_context = build_market_context(market_data)
        news_context = build_news_context(news_items)

        prompt = build_prompt(
            user_message=req.message,
            watchlist_name=req.watchlist_name,
            watchlist_tickers=req.tickers,
            history=req.history,
            market_context=market_context,
            news_context=news_context,
        )

        response = client.models.generate_content(
            model=MODEL,
            contents=prompt
        )

        return {
            "reply": response.text if response.text else "No response generated.",
            "detected_tickers": detected_tickers,
            "grounding_used": len(market_data) > 0,
            "market_data_count": len(market_data),
            "news_count": len(news_items),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))