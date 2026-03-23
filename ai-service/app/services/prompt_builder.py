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


def build_news_context(news_items: list[dict]) -> str:
    if not news_items:
        return "No recent verified news headlines were found for this request."

    lines = []

    for item in news_items:
        title = item.get("title", "Untitled")
        source = item.get("source", "Unknown source")
        published_at = item.get("published_at", "Unknown date")
        symbols = item.get("symbols", "")
        summary = item.get("summary", "")

        line = f"Headline: {title}\nSource: {source}\nPublished: {published_at}"
        if symbols:
            line += f"\nRelated symbols: {symbols}"
        if summary:
            trimmed = summary[:220].strip()
            if len(summary) > 220:
                trimmed += "..."
            line += f"\nSnippet: {trimmed}"

        lines.append(line)

    return "\n\n".join(lines)


def build_prompt(
    user_message: str,
    watchlist_name: str | None,
    watchlist_tickers: list[str],
    history: list[dict],
    market_context: str,
    news_context: str,
    watchlist_analysis_context: str | None = None,
    watchlist_analysis_used: bool = False,
    today: str | None = None
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

    Response style:
    - Start the response by writing the current date exactly as provided.
    - Keep answers short and to the point.
    - Most replies should be around 3 short sentences.
    - Keep replies concise, but always complete the thought naturally.
    - Start with the single most important insight in the first sentence.
    - Focus only on the most useful takeaway.
    - Avoid repeating information.
    - Do not write long explanations unless the user explicitly asks for more detail.

    Writing rules:
    - Use full natural language.
    - Do not use markdown, headings, bullet points, asterisks, or bold formatting.
    - Write in short readable paragraphs suitable for a chat interface.
    - Sound natural, not robotic.

    Financial rules:
    - Do not give direct financial advice like "buy" or "sell".
    - Frame answers as informational analysis.
    - Use the verified market data, verified news, and verified watchlist analysis below when relevant.
    - Do not invent numbers, catalysts, earnings results, news, price moves, or company facts.
    - Only describe a stock move as caused by news if the headlines clearly support that connection.
    - If the news suggests a possible catalyst but does not fully confirm it, say it may be related rather than stating it as a fact.
    - If neither market data nor news clearly explains a move, say that briefly.

    Watchlist rules:
    - If the user asks about a watchlist, focus on the single most important takeaway first.
    """.strip()

    prompt_parts = [
    system_prompt,
    ]

    if today:
        prompt_parts.append(f"Today’s date: {today}")

    prompt_parts.extend([
        f"Verified market data:\n{market_context}",
        f"Verified recent news:\n{news_context}",
    ])

    if watchlist_analysis_used and watchlist_analysis_context:
        prompt_parts.append(f"Verified watchlist analysis:\n{watchlist_analysis_context}")

    if context_text:
        prompt_parts.append(f"Context:\n{context_text}")

    if history_text:
        prompt_parts.append(f"Conversation so far:\n{history_text}")

    prompt_parts.append(f"User: {user_message}\nAssistant:")

    return "\n\n".join(prompt_parts).strip()