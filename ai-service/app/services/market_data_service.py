import yfinance as yf


def safe_get(info: dict, key: str, default=None):
    value = info.get(key, default)
    return value if value not in ("", None) else default


def fetch_stock_snapshot(ticker: str) -> dict | None:
    try:
        stock = yf.Ticker(ticker)
        info = stock.info or {}

        if not info:
            return None

        current_price = safe_get(info, "currentPrice")
        previous_close = safe_get(info, "previousClose")

        daily_change_percent = None
        if current_price is not None and previous_close not in (None, 0):
            daily_change_percent = ((current_price - previous_close) / previous_close) * 100

        snapshot = {
            "ticker": ticker,
            "company_name": safe_get(info, "longName") or safe_get(info, "shortName") or ticker,
            "sector": safe_get(info, "sector"),
            "industry": safe_get(info, "industry"),
            "current_price": current_price,
            "previous_close": previous_close,
            "daily_change_percent": daily_change_percent,
            "market_cap": safe_get(info, "marketCap"),
            "pe_ratio": safe_get(info, "trailingPE"),
            "volume": safe_get(info, "volume"),
            "fifty_two_week_low": safe_get(info, "fiftyTwoWeekLow"),
            "fifty_two_week_high": safe_get(info, "fiftyTwoWeekHigh"),
            "description": safe_get(info, "longBusinessSummary"),
        }

        return snapshot

    except Exception:
        return None


def fetch_market_data_for_tickers(tickers: list[str], max_tickers: int = 3) -> list[dict]:
    results = []

    for ticker in tickers[:max_tickers]:
        snapshot = fetch_stock_snapshot(ticker)
        if snapshot:
            results.append(snapshot)

    return results