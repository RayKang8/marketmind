from collections import Counter
from app.services.market_data_service import fetch_stock_snapshot


WATCHLIST_ANALYSIS_KEYWORDS = [
    "watchlist",
    "my list",
    "portfolio",
    "my holdings",
    "my stocks",
    "analyze my",
    "analyse my",
    "concentration",
    "exposure",
    "risk",
    "diversified",
    "diversification",
    "too exposed",
    "sector exposure",
]


CYCLICAL_SECTORS = {
    "Consumer Cyclical",
    "Financial Services",
    "Real Estate",
    "Industrials",
    "Basic Materials",
    "Energy",
}

DEFENSIVE_SECTORS = {
    "Consumer Defensive",
    "Healthcare",
    "Utilities",
}

GROWTH_SECTORS = {
    "Technology",
    "Communication Services",
}


def is_watchlist_analysis_request(message: str, watchlist_tickers: list[str]) -> bool:
    text = (message or "").lower()

    if len(watchlist_tickers) >= 2:
        for keyword in WATCHLIST_ANALYSIS_KEYWORDS:
            if keyword in text:
                return True

    return False


def fetch_watchlist_market_data(tickers: list[str], max_tickers: int = 12) -> list[dict]:
    results = []

    for ticker in tickers[:max_tickers]:
        snapshot = fetch_stock_snapshot(ticker)
        if snapshot:
            results.append(snapshot)

    return results


def format_percent(value):
    if value is None:
        return "N/A"
    sign = "+" if value > 0 else ""
    return f"{sign}{value:.2f}%"


def format_market_cap(value):
    if value is None:
        return "N/A"
    if value >= 1_000_000_000_000:
        return f"${value / 1_000_000_000_000:.2f}T"
    if value >= 1_000_000_000:
        return f"${value / 1_000_000_000:.2f}B"
    if value >= 1_000_000:
        return f"${value / 1_000_000:.2f}M"
    return f"${value:,}"


def classify_macro_sensitivity(sectors: list[str]) -> str:
    sector_set = set(sectors)

    cyclical_count = sum(1 for sector in sectors if sector in CYCLICAL_SECTORS)
    defensive_count = sum(1 for sector in sectors if sector in DEFENSIVE_SECTORS)
    growth_count = sum(1 for sector in sectors if sector in GROWTH_SECTORS)

    if growth_count >= max(2, len(sectors) // 2):
        return "This watchlist appears growth-heavy and may be more sensitive to interest rates, valuation compression, and shifts in risk appetite."

    if cyclical_count >= max(2, len(sectors) // 2):
        return "This watchlist appears cyclical and may be more sensitive to economic growth expectations, consumer demand, and macro slowdowns."

    if defensive_count >= max(2, len(sectors) // 2):
        return "This watchlist appears relatively defensive compared with a typical growth watchlist."

    if "Technology" in sector_set and "Financial Services" in sector_set:
        return "This watchlist mixes technology and financial exposure, so it may react to both rate-sensitive growth sentiment and credit or macro conditions."

    return "This watchlist has mixed macro sensitivity and does not appear driven by only one style factor."


def build_watchlist_analysis_context(
    watchlist_name: str | None,
    watchlist_tickers: list[str],
    watchlist_market_data: list[dict],
) -> str:
    if not watchlist_tickers:
        return "No watchlist tickers were provided."

    if not watchlist_market_data:
        return "A watchlist was provided, but verified market data could not be fetched for the watchlist tickers."

    sectors = [item.get("sector") for item in watchlist_market_data if item.get("sector")]
    industries = [item.get("industry") for item in watchlist_market_data if item.get("industry")]

    sector_counts = Counter(sectors)
    industry_counts = Counter(industries)

    total_names = len(watchlist_market_data)

    top_sector, top_sector_count = sector_counts.most_common(1)[0] if sector_counts else ("Unknown", 0)
    top_industry, top_industry_count = industry_counts.most_common(1)[0] if industry_counts else ("Unknown", 0)

    sector_concentration = (top_sector_count / total_names) * 100 if total_names else 0
    industry_concentration = (top_industry_count / total_names) * 100 if total_names else 0

    daily_changes = [
        item.get("daily_change_percent")
        for item in watchlist_market_data
        if item.get("daily_change_percent") is not None
    ]
    avg_daily_change = sum(daily_changes) / len(daily_changes) if daily_changes else None

    high_pe_names = [
        f"{item.get('ticker')} ({item.get('pe_ratio'):.2f})"
        for item in watchlist_market_data
        if isinstance(item.get("pe_ratio"), (int, float)) and item.get("pe_ratio") > 40
    ]

    largest_market_caps = sorted(
        watchlist_market_data,
        key=lambda x: x.get("market_cap") or 0,
        reverse=True
    )[:3]

    strongest_movers = sorted(
        [item for item in watchlist_market_data if item.get("daily_change_percent") is not None],
        key=lambda x: abs(x.get("daily_change_percent") or 0),
        reverse=True
    )[:3]

    sector_breakdown = ", ".join(
        f"{sector}: {count}"
        for sector, count in sector_counts.most_common()
    ) if sector_counts else "N/A"

    industry_breakdown = ", ".join(
        f"{industry}: {count}"
        for industry, count in industry_counts.most_common(5)
    ) if industry_counts else "N/A"

    largest_names_text = ", ".join(
        f"{item.get('ticker')} ({format_market_cap(item.get('market_cap'))})"
        for item in largest_market_caps
    ) if largest_market_caps else "N/A"

    movers_text = ", ".join(
        f"{item.get('ticker')} ({format_percent(item.get('daily_change_percent'))})"
        for item in strongest_movers
    ) if strongest_movers else "N/A"

    valuation_comment = (
        f"Several names in the watchlist trade at relatively high valuation multiples, including {', '.join(high_pe_names[:5])}."
        if high_pe_names
        else "There are no obviously extreme valuation multiples in the currently fetched watchlist data."
    )

    concentration_comment = "This watchlist looks fairly diversified across sectors."
    if sector_concentration >= 60:
        concentration_comment = f"This watchlist is highly concentrated in {top_sector}, with about {sector_concentration:.0f}% of tracked names in that sector."
    elif sector_concentration >= 40:
        concentration_comment = f"This watchlist has meaningful concentration in {top_sector}, with about {sector_concentration:.0f}% of tracked names in that sector."

    industry_comment = ""
    if industry_concentration >= 50:
        industry_comment = f"It is also concentrated at the industry level, especially in {top_industry}."

    macro_comment = classify_macro_sensitivity(sectors)

    return f"""
Watchlist name: {watchlist_name or "Unnamed watchlist"}
Number of tickers analyzed: {total_names}
Tickers: {', '.join([item.get("ticker", "") for item in watchlist_market_data])}

Sector breakdown: {sector_breakdown}
Industry breakdown: {industry_breakdown}

Top sector concentration: {top_sector} ({top_sector_count} of {total_names}, {sector_concentration:.0f}%)
Top industry concentration: {top_industry} ({top_industry_count} of {total_names}, {industry_concentration:.0f}%)

Average daily move across watchlist: {format_percent(avg_daily_change)}
Largest names by market cap: {largest_names_text}
Biggest movers today: {movers_text}

Concentration assessment: {concentration_comment}
Industry assessment: {industry_comment or "Industry concentration does not appear extreme."}
Valuation assessment: {valuation_comment}
Macro sensitivity assessment: {macro_comment}
    """.strip()