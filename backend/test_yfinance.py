import yfinance as yf
print("yfinance version:", yf.__version__)
print("Fetching news for Gold (GC=F)...")
try:
    ticker = yf.Ticker('GC=F')
    news = ticker.news
    print(f"Got {len(news)} news items.")
    print(news)
except Exception as e:
    print("Error fetching news:", e)
