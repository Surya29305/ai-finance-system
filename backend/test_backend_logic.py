import yfinance as yf
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import os
from google import genai
from dotenv import load_dotenv
import json

load_dotenv()

DOMAIN_MAPPING = {
    "Gold": "GC=F",
    "Silver": "SI=F",
    "Crude Oil": "CL=F",
    "Bitcoin": "BTC-USD",
    "Nifty 50": "^NSEI",
}

def test_domain(domain):
    print(f"\n--- Testing Domain: {domain} ---")
    ticker = DOMAIN_MAPPING.get(domain)
    try:
        stock = yf.Ticker(ticker)
        news = stock.news
        if not news:
            print("No news found for ticker:", ticker)
            return

        print(f"Found {len(news)} news items.")
        
        analyzer = SentimentIntensityAnalyzer()
        scores = []
        for item in news[:20]:
            title = item.get('title', '')
            score = analyzer.polarity_scores(title)['compound']
            scores.append(score)
            print(f"- {title[:50]}... | Score: {score}")

        avg_score = sum(scores) / len(scores) if scores else 0
        print(f"Average Score: {avg_score}")

        GEMINI_KEY = os.getenv("GEMINI_API_KEY")
        if not GEMINI_KEY:
            print("No GEMINI_API_KEY found.")
            return

        client = genai.Client(api_key=GEMINI_KEY)
        headlines_text = "\n".join([f"- {n.get('title')}" for n in news[:20]])
        prompt = f"Analyze these headlines for {domain} and return a JSON summary: {headlines_text}"
        
        try:
            response = client.models.generate_content(
                model='gemini-2.0-flash-lite',
                contents=prompt
            )
            print("Gemini Response:", response.text)
        except Exception as e:
            print("Gemini Error:", e)

    except Exception as e:
        print("General Error:", e)

if __name__ == "__main__":
    test_domain("Gold")
    test_domain("Nifty 50")
