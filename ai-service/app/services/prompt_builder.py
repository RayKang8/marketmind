def format_number(value):
    if value is None:
        return "N/A"
    if isinstance(value, int):
        return f"{value:,}"
    if isinstance(value, float):
        return f"{value:,.2f}"
    return str(value)


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


def format_percent(value):
    if value is None:
        return "N/A"
    sign = "+" if value > 0 else ""
    return f"{sign}{value:.2f}%"


def format_price(value):
    if value is None:
        return "N/A"
    return f"${value:.2f}"


def trim_description(text: str | None, max_len: int = 500) -> str:
    if not text:
        return "N/A"

    text = text.strip()
    if len(text) <= max_len:
        return text

    return text[:max_len].rsplit(" ", 1)[0] + "..."


def build_market_context(market_data: list[dict]) -> str:
    if not market_data:
        return "No verified market data was found for this request."

    blocks = []

    for stock in market_data:
        block = f"""
Ticker: {stock.get("ticker", "N/A")}
Company: {stock.get("company_name", "N/A")}
Sector: {stock.get("sector", "N/A")}
Industry: {stock.get("industry", "N/A")}
Current Price: {format_price(stock.get("current_price"))}
Previous Close: {format_price(stock.get("previous_close"))}
Daily Change: {format_percent(stock.get("daily_change_percent"))}
Market Cap: {format_market_cap(stock.get("market_cap"))}
P/E Ratio: {format_number(stock.get("pe_ratio"))}
Volume: {format_number(stock.get("volume"))}
52-Week Range: {format_price(stock.get("fifty_two_week_low"))} to {format_price(stock.get("fifty_two_week_high"))}
Business Summary: {trim_description(stock.get("description"))}
        """.strip()

        blocks.append(block)

    return "\n\n".join(blocks)


def build_prompt(
    user_message: str,
    watchlist_name: str | None,
    watchlist_tickers: list[str],
    history: list[dict],
    market_context: str,
) -> str:
    history_lines = []
    for msg in history[-6:]:
        role = msg.get("role", "user")
        content = msg.get("content", "").strip()
        if content:
            history_lines.append(f"{role.capitalize()}: {content}")

    history_text = "\n".join(history_lines)

    context_bits = []
    if watchlist_name:
        context_bits.append(f"Selected watchlist: {watchlist_name}")
    if watchlist_tickers:
        context_bits.append(f"Watchlist tickers: {', '.join(watchlist_tickers)}")

    context_text = "\n".join(context_bits).strip()

    system_prompt = """
    You are MarketMind, an AI-powered investment research assistant.

    Rules:
    - Be concise, clear, and analytical.
    - Use full natural language.
    - Do not use markdown, headings, bullet points, asterisks, or bold formatting.
    - Write in short readable paragraphs.
    - Keep answers direct and easy to read in a chat interface.
    - Do not give direct financial advice like "buy" or "sell".
    - Frame answers as informational analysis.
    - Use the verified market data below when relevant.
    - Do not invent numbers, catalysts, earnings results, news, price moves, or company facts.
    - Do not claim to know why a stock is moving unless the cause is explicitly provided in the prompt.
    - If only market data is available, describe what the stock is doing, not why it is doing it.
    - If you mention a possible explanation, label it clearly as a possibility rather than a fact.
    - If market data does not fully explain a move, say that clearly.
    - If the user references a watchlist, use the provided watchlist context.
    - If no verified market data is available, answer cautiously and say the data is limited.
    """.strip()

    prompt_parts = [
        system_prompt,
        f"Verified market data:\n{market_context}",
    ]

    if context_text:
        prompt_parts.append(f"Context:\n{context_text}")

    if history_text:
        prompt_parts.append(f"Conversation so far:\n{history_text}")

    prompt_parts.append(f"User: {user_message}\nAssistant:")

    return "\n\n".join(prompt_parts).strip()