import os
import requests
from datetime import datetime, timedelta, timezone


FINNHUB_BASE_URL = "https://finnhub.io/api/v1"


def get_finnhub_api_key() -> str | None:
    return os.getenv("FINNHUB_API_KEY")


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
        "symbols": item.get("related") or fallback_ticker,
        "summary": (item.get("summary") or "").strip(),
    }


def get_company_aliases(ticker: str) -> list[str]:
    company_aliases = {
        "NVDA": ["nvidia", "nvda"],
        "TSLA": ["tesla", "tsla"],
        "AMD": ["amd", "advanced micro devices"],
        "SOFI": ["sofi"],
        "AAPL": ["apple", "aapl"],
        "MSFT": ["microsoft", "msft"],
        "AMZN": ["amazon", "amzn"],
        "GOOGL": ["google", "alphabet", "googl"],
        "META": ["meta", "facebook"],
        "PLTR": ["palantir", "pltr"],
        "AVGO": ["broadcom", "avgo"],
        "INTC": ["intel", "intc"],
        "NFLX": ["netflix", "nflx"],
        "CRM": ["salesforce", "crm"],
        "ORCL": ["oracle", "orcl"],
        "ADBE": ["adobe", "adbe"],
        "SHOP": ["shopify", "shop"],
        "HOOD": ["robinhood", "hood"],
        "SNOW": ["snowflake", "snow"],
        "SPOT": ["spotify", "spot"],
        "UBER": ["uber"],
        "COIN": ["coinbase", "coin"],
    }
    return company_aliases.get(ticker.upper(), [ticker.lower()])


def score_news_item(item: dict, ticker: str) -> int:
    ticker = ticker.upper()
    aliases = get_company_aliases(ticker)

    title = (item.get("title") or "").lower()
    summary = (item.get("summary") or "").lower()
    symbols = str(item.get("symbols") or "").lower()

    score = 0

    # strongest signal: headline directly names the company/ticker
    for alias in aliases:
        if alias in title:
            score += 5

    # summary also matters, but less than headline
    for alias in aliases:
        if alias in summary:
            score += 3

    # related/symbol field helps, but should not dominate by itself
    if ticker.lower() in symbols:
        score += 2

    return score


def is_relevant_news_item(item: dict, ticker: str, min_score: int = 5) -> bool:
    return score_news_item(item, ticker) >= min_score


def fetch_news_for_ticker(ticker: str, limit: int = 3, days_back: int = 7) -> list[dict]:
    api_key = get_finnhub_api_key()
    if not api_key:
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
                "token": api_key,
            },
            timeout=10,
        )
        response.raise_for_status()

        data = response.json()
        if not isinstance(data, list):
            return []

        normalized = [normalize_news_item(item, fallback_ticker=ticker) for item in data]

        scored = []
        for item in normalized:
            score = score_news_item(item, ticker)
            if score >= 5:
                item["relevance_score"] = score
                scored.append(item)

        scored.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)

        return scored[:limit]

    except Exception as e:
        print(f"Finnhub fetch error for {ticker}: {e}")
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


def fetch_news_for_tickers(
    tickers: list[str],
    per_ticker_limit: int = 3,
    total_limit: int = 5,
) -> list[dict]:
    all_items = []

    for ticker in tickers[:3]:
        all_items.extend(fetch_news_for_ticker(ticker, limit=per_ticker_limit, days_back=7))

    all_items = dedupe_news_items(all_items)
    return all_items[:total_limit]