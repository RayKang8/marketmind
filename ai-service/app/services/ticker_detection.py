import re

COMPANY_NAME_TO_TICKER = {
    "nvidia": "NVDA",
    "tesla": "TSLA",
    "apple": "AAPL",
    "microsoft": "MSFT",
    "amazon": "AMZN",
    "google": "GOOGL",
    "alphabet": "GOOGL",
    "meta": "META",
    "netflix": "NFLX",
    "amd": "AMD",
    "sofi": "SOFI",
    "palantir": "PLTR",
    "uber": "UBER",
    "coinbase": "COIN",
    "broadcom": "AVGO",
    "intel": "INTC",
    "salesforce": "CRM",
    "oracle": "ORCL",
    "adobe": "ADBE",
    "shopify": "SHOP",
    "robinhood": "HOOD",
    "snowflake": "SNOW",
    "spotify": "SPOT",
    "amazon web services": "AMZN",
}

TICKER_REGEX = r"\b[A-Z]{1,5}\b"

COMMON_FALSE_POSITIVES = {
    "A", "I", "AM", "PM", "CEO", "USA", "ETF", "EV", "AI",
    "GDP", "YOY", "IPO", "FED", "CPI", "PPI", "ATH", "USD"
}


def detect_tickers_from_text(message: str) -> list[str]:
    matches = re.findall(TICKER_REGEX, message)
    tickers = []

    for match in matches:
        if match not in COMMON_FALSE_POSITIVES:
            tickers.append(match)

    return list(dict.fromkeys(tickers))


def detect_company_name_tickers(message: str) -> list[str]:
    text = message.lower()
    found = []

    for company_name, ticker in COMPANY_NAME_TO_TICKER.items():
        if company_name in text:
            found.append(ticker)

    return list(dict.fromkeys(found))


def detect_all_tickers(message: str, request_tickers: list[str] | None = None) -> list[str]:
    request_tickers = request_tickers or []

    explicit_tickers = detect_tickers_from_text(message)
    company_tickers = detect_company_name_tickers(message)

    merged = request_tickers + explicit_tickers + company_tickers
    merged = [ticker.upper() for ticker in merged if ticker]

    return list(dict.fromkeys(merged))