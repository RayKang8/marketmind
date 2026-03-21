import os
import requests
from datetime import datetime, timedelta, timezone


FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")
FINNHUB_BASE_URL = "https://finnhub.io/api/v1"


def format_unix_timestamp(ts) -> str:
    if not ts:
        return "Unknown date"

    try:
        dt = datetime.fromtimestamp(ts, tz=timezone.utc)
        return dt.strftime("%Y-%m-%d %H:%M UTC")
    except Exception:
        return "Unknown date"


def normalize_news_item(item: dict, fallback_ticker: str | None = None) -> dict:
    return {
        "title": (item.get("headline") or "Untitled").strip(),
        "source": (item.get("source") or "Unknown source").strip(),
        "url": item.get("url"),
        "published_at": format_unix_timestamp(item.get("datetime")),
        "symbols": fallback_ticker,
        "summary": (item.get("summary") or "").strip(),
    }


def fetch_news_for_ticker(ticker: str, limit: int = 3, days_back: int = 7) -> list[dict]:
    if not FINNHUB_API_KEY:
        return []

    today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=days_back)

    try:
        response = requests.get(
            f"{FINNHUB_BASE_URL}/company-news",
            params={
                "symbol": ticker,
                "from": start_date.isoformat(),
                "to": today.isoformat(),
                "token": FINNHUB_API_KEY,
            },
            timeout=10,
        )
        response.raise_for_status()

        data = response.json()
        if not isinstance(data, list):
            return []

        normalized = [normalize_news_item(item, fallback_ticker=ticker) for item in data]
        return normalized[:limit]

    except Exception:
        return []


def dedupe_news_items(items: list[dict]) -> list[dict]:
    seen = set()
    deduped = []

    for item in items:
        key = (
            item.get("title", "").strip().lower(),
            item.get("source", "").strip().lower(),
            item.get("published_at", "").strip().lower(),
        )
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)

    return deduped


def fetch_news_for_tickers(tickers: list[str], per_ticker_limit: int = 3, total_limit: int = 5) -> list[dict]:
    all_items = []

    for ticker in tickers[:3]:
        all_items.extend(fetch_news_for_ticker(ticker, limit=per_ticker_limit, days_back=7))

    all_items = dedupe_news_items(all_items)
    return all_items[:total_limit]