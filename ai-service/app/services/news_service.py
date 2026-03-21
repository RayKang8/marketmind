import os
import requests
from datetime import datetime, timezone


FMP_API_KEY = os.getenv("FMP_API_KEY")
FMP_BASE_URL = "https://financialmodelingprep.com/stable"


def parse_date(date_str: str | None) -> str:
    if not date_str:
        return "Unknown date"

    try:
        cleaned = date_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(cleaned)
        return dt.strftime("%Y-%m-%d %H:%M UTC")
    except Exception:
        return date_str


def normalize_news_item(item: dict, fallback_ticker: str | None = None) -> dict:
    title = (
        item.get("title")
        or item.get("headline")
        or item.get("text")
        or "Untitled"
    )

    source = (
        item.get("site")
        or item.get("source")
        or item.get("publisher")
        or "Unknown source"
    )

    url = item.get("url") or item.get("link")
    published_at = (
        item.get("publishedDate")
        or item.get("published_date")
        or item.get("date")
        or item.get("datetime")
    )

    symbols = item.get("symbol") or item.get("symbols") or fallback_ticker
    text = item.get("text") or item.get("snippet") or item.get("content") or ""

    return {
        "title": title.strip(),
        "source": source.strip() if isinstance(source, str) else "Unknown source",
        "url": url,
        "published_at": parse_date(published_at),
        "symbols": symbols,
        "summary": text.strip(),
    }


def fetch_news_for_ticker(ticker: str, limit: int = 3) -> list[dict]:
    if not FMP_API_KEY:
        return []

    try:
        response = requests.get(
            f"{FMP_BASE_URL}/news/stock",
            params={
                "symbols": ticker,
                "apikey": FMP_API_KEY,
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
        all_items.extend(fetch_news_for_ticker(ticker, limit=per_ticker_limit))

    all_items = dedupe_news_items(all_items)
    return all_items[:total_limit]