from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import yfinance as yf
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_KEY = os.getenv("GEMINI_API_KEY")
gemini_client = genai.Client(api_key=GEMINI_KEY) if GEMINI_KEY else None

try:
    pipeline = joblib.load('risk_pipeline.pkl')
    label_encoder = joblib.load('label_encoder.pkl')
except Exception as e:
    print(f"Warning: Model not found. Did you run train_model.py? Error: {e}")
    pipeline = None
    label_encoder = None


class RiskInput(BaseModel):
    age: int
    monthly_salary: int          # NEW: monthly salary in INR
    monthly_expenses: int
    housing_status: str
    total_investments: int
    total_debt: int
    credit_score: int
    dependents: int
    employment_type: str = "Salaried"          # NEW
    monthly_emi: int = 0                        # NEW: total monthly EMI
    savings_per_month: int = 0                  # NEW
    emergency_fund_months: int = 0              # NEW


class SentimentInput(BaseModel):
    ticker: str

class DomainInput(BaseModel):
    domain: str

DOMAIN_MAPPING = {
    # Commodities
    "Gold": "GC=F",
    "Silver": "SI=F",
    "Crude Oil": "CL=F",
    # Crypto
    "Bitcoin": "BTC-USD",
    "Ethereum": "ETH-USD",
    "Solana": "SOL-USD",
    # Indian Indices
    "Nifty 50": "^NSEI",
    "Sensex": "^BSESN",
    "Bank Nifty": "^NSEBANK",
    # Indian Blue-chip stocks
    "Reliance": "RELIANCE.NS",
    "TCS": "TCS.NS",
    "Infosys": "INFY.NS",
    "HDFC Bank": "HDFCBANK.NS",
    "ICICI Bank": "ICICIBANK.NS",
    "Wipro": "WIPRO.NS",
    "Adani Enterprises": "ADANIENT.NS",
    # Global
    "Tesla": "TSLA",
    "Apple": "AAPL",
    "Nvidia": "NVDA",
}


class ChatRequest(BaseModel):
    user_portfolio: RiskInput
    question: str


@app.post("/predict-risk")
async def predict_risk(data: RiskInput):
    if not pipeline:
        raise HTTPException(status_code=500, detail="Model pipeline not loaded.")

    # Convert monthly salary → annual for the ML pipeline (which was trained on annual_salary)
    annual_salary = data.monthly_salary * 12

    # Pass ALL 12 features the new model was trained on
    input_df = pd.DataFrame([{
        "age":                  data.age,
        "annual_salary":        annual_salary,
        "monthly_expenses":     data.monthly_expenses,
        "monthly_emi":          data.monthly_emi,
        "savings_per_month":    data.savings_per_month,
        "housing_status":       data.housing_status,
        "employment_type":      data.employment_type,
        "total_investments":    data.total_investments,
        "total_debt":           data.total_debt,
        "credit_score":         data.credit_score,
        "dependents":           data.dependents,
        "emergency_fund_months": data.emergency_fund_months,
    }])

    probabilities = pipeline.predict_proba(input_df)[0]
    encoded_pred = pipeline.predict(input_df)[0]
    risk_label = label_encoder.inverse_transform([encoded_pred])[0]

    classes = label_encoder.classes_
    prob_dict = {classes[i]: float(probabilities[i]) for i in range(len(classes))}

    # Compute risk score 0–100 with smooth interpolation across all three classes
    # High → 61–100, Medium → 31–60, Low → 0–30
    p_high   = prob_dict.get('High',   0)
    p_medium = prob_dict.get('Medium', 0)
    p_low    = prob_dict.get('Low',    0)
    risk_score = round(p_high * 100 + p_medium * 55 + p_low * 10)
    risk_score = max(0, min(100, risk_score))

    # ── Rule-based local analysis engine (always works, no quota limits) ──────
    def generate_local_analysis(data, risk_score, risk_label, prob_dict):
        salary = data.monthly_salary or 1
        savings_rate = round((data.savings_per_month / salary) * 100, 1)
        emi_rate = round((data.monthly_emi / salary) * 100, 1)
        expense_rate = round((data.monthly_expenses / salary) * 100, 1)
        dti = round(((data.monthly_expenses + data.monthly_emi) / salary) * 100, 1)
        net_worth = data.total_investments - data.total_debt
        debt_to_investment = round((data.total_debt / data.total_investments) * 100) if data.total_investments > 0 else 999
        disposable = salary - data.monthly_expenses - data.monthly_emi - data.savings_per_month

        # ── Overall Health ─────────────────────────────────
        if risk_score <= 25:
            health_summary = f"Your financial profile is **excellent** with a risk score of **{risk_score}/100**. You demonstrate disciplined financial habits and strong resilience."
        elif risk_score <= 45:
            health_summary = f"Your financial profile is **healthy** with a risk score of **{risk_score}/100**. You are on a stable path with some areas that can be further optimised."
        elif risk_score <= 65:
            health_summary = f"Your financial profile shows **moderate vulnerability** with a risk score of **{risk_score}/100**. Several key ratios need attention to build long-term resilience."
        else:
            health_summary = f"Your financial profile indicates **significant financial stress** with a risk score of **{risk_score}/100**. Immediate corrective action is strongly advised."

        income_class = "lower-income" if salary < 30000 else "middle-income" if salary < 100000 else "upper-middle-income"

        lines = []
        lines.append(f"## 📊 Overall Financial Health\n")
        lines.append(f"{health_summary}\n")
        lines.append(f"As a **{data.employment_type}** professional earning **₹{salary:,}/month**, you fall in the {income_class} bracket. "
                     f"Your current **debt-to-income ratio is {dti}%** "
                     f"({'within safe limits' if dti <= 50 else 'above the recommended 50% threshold'}) "
                     f"and your **net worth stands at ₹{net_worth:,}** "
                     f"({'positive' if net_worth >= 0 else 'negative — liabilities exceed assets'}).\n")

        # ── Strengths ──────────────────────────────────────
        lines.append(f"\n## ✅ Key Strengths\n")
        strengths = []
        if savings_rate >= 20:
            strengths.append(f"**Strong savings discipline** — your savings rate of **{savings_rate}%** meets the recommended 20% benchmark. This is the foundation of long-term wealth.")
        if data.credit_score >= 750:
            strengths.append(f"**Excellent credit score of {data.credit_score}** — you qualify for the best loan rates and credit products in India.")
        elif data.credit_score >= 700:
            strengths.append(f"**Good credit score of {data.credit_score}** — you have access to most credit products at competitive interest rates.")
        if data.emergency_fund_months >= 6:
            strengths.append(f"**Robust emergency fund of {data.emergency_fund_months} months** — well above the recommended 6-month buffer, providing excellent financial cushion.")
        if emi_rate <= 20:
            strengths.append(f"**Low EMI burden at {emi_rate}% of income** — your loan obligations are well within the safe 30% limit.")
        if data.total_investments > data.total_debt:
            strengths.append(f"**Investments (₹{data.total_investments:,}) exceed total debt (₹{data.total_debt:,})** — your asset base is stronger than your liabilities.")
        if data.housing_status == "Own":
            strengths.append("**Debt-free home ownership** — a significant long-term asset that reduces housing cost risk.")
        if disposable > 0:
            strengths.append(f"**Positive monthly surplus of ₹{disposable:,}** — you have room to increase investments or build buffers.")

        if not strengths:
            strengths.append("Focus on building your savings rate toward the 20% mark to create your first major financial strength.")

        for s in strengths:
            lines.append(f"- {s}\n")

        # ── Risk Factors ───────────────────────────────────
        lines.append(f"\n## ⚠️ Risk Factors\n")
        risks = []
        if savings_rate < 10:
            risks.append(f"**Very low savings rate ({savings_rate}%)** — below the minimum 10% threshold. Even a small financial shock could derail your stability.")
        elif savings_rate < 20:
            risks.append(f"**Below-target savings rate ({savings_rate}%)** — the recommended minimum is 20% of monthly income.")
        if emi_rate > 40:
            risks.append(f"**High EMI-to-income ratio ({emi_rate}%)** — EMIs consuming over 40% of income leave little room for savings and emergencies.")
        elif emi_rate > 30:
            risks.append(f"**Elevated EMI burden ({emi_rate}%)** — slightly above the 30% safe threshold. Consider prepaying high-interest debt.")
        if data.credit_score < 650:
            risks.append(f"**Low credit score ({data.credit_score})** — this significantly limits borrowing options and results in higher interest rates.")
        elif data.credit_score < 700:
            risks.append(f"**Below-average credit score ({data.credit_score})** — work toward 750+ to access the best financial products.")
        if data.emergency_fund_months < 3:
            risks.append(f"**Critical gap in emergency fund ({data.emergency_fund_months} months)** — you need at least 3–6 months of expenses saved in a liquid account.")
        elif data.emergency_fund_months < 6:
            risks.append(f"**Insufficient emergency fund ({data.emergency_fund_months} months)** — aim for 6 months to be adequately protected.")
        if data.dependents >= 3:
            risks.append(f"**High dependent load ({data.dependents} dependents)** — increases fixed household expenses and reduces financial flexibility.")
        if data.total_debt > data.total_investments * 1.5:
            risks.append(f"**Debt significantly exceeds investments** — your liabilities (₹{data.total_debt:,}) are {round(data.total_debt/max(data.total_investments,1), 1)}x your investments, indicating wealth erosion risk.")
        if expense_rate > 60:
            risks.append(f"**High expense ratio ({expense_rate}% of income)** — living expenses alone consume most of your income, leaving little for wealth creation.")
        if data.employment_type in ["Freelancer", "Self-Employed"] and data.emergency_fund_months < 6:
            risks.append(f"**Variable income ({data.employment_type}) without adequate emergency buffer** — irregular earners need at least 6–9 months of liquid reserves.")

        if not risks:
            risks.append("No major risk flags detected at this time. Continue your current financial strategy and review annually.")

        for r in risks:
            lines.append(f"- {r}\n")

        # ── Action Plan ────────────────────────────────────
        lines.append(f"\n## 🎯 Personalised Action Plan\n")
        actions = []

        if data.emergency_fund_months < 6:
            target = max(0, 6 - data.emergency_fund_months)
            actions.append(f"**Priority 1 — Build Emergency Fund:** Target {target} more months of expenses in a high-yield savings account or liquid mutual fund (e.g., Parag Parikh Liquid Fund). Automate a fixed SIP each month toward this goal.")

        if savings_rate < 20:
            gap = round((20 - savings_rate) / 100 * salary)
            actions.append(f"**Increase Savings Rate to 20%:** You need to save an additional ₹{gap:,}/month. Review discretionary expenses and redirect surplus via a SIP in an index fund (e.g., Nifty 50 Index Fund).")

        if data.credit_score < 750:
            actions.append(f"**Improve Credit Score to 750+:** Pay all EMIs on or before due dates, reduce credit card utilisation below 30%, and check your CIBIL report for errors. Target a 750+ score within 12 months.")

        if data.total_investments < salary * 12:
            actions.append(f"**Accelerate Investment Growth:** Your total investments (₹{data.total_investments:,}) are below 1 year's salary. Start or increase SIPs in diversified equity mutual funds. Consider PPF (₹1.5L/year tax-free) and NPS for retirement.")

        if emi_rate > 30:
            actions.append(f"**Reduce EMI Burden:** Your EMIs consume {emi_rate}% of income. Prioritise prepaying the highest-interest loan first (typically personal loans or credit card debt) using any annual bonus or windfall.")

        if data.age < 35 and data.total_investments < salary * 24:
            actions.append(f"**Leverage Compounding Early:** At age {data.age}, time is your biggest asset. Increasing your SIP by even ₹{round(salary*0.03):,}/month now can generate significant wealth by retirement through the power of compounding.")

        if data.dependents > 0:
            actions.append(f"**Secure Adequate Life & Health Insurance:** With {data.dependents} dependent(s), ensure you have a term insurance cover of at least 15–20x your annual income and a health cover of ₹10–25L for the family.")

        if not actions:
            actions.append("**Maintain & Optimise:** Your profile is strong. Review your asset allocation annually, ensure equity exposure is appropriate for your age, and consider stepping up SIPs by 10% each year in line with salary increments.")

        for i, a in enumerate(actions[:4], 1):
            lines.append(f"{i}. {a}\n")

        lines.append(f"\n---\n*Analysis generated by FinSight AI Engine • Risk Model Score: {risk_score}/100 ({risk_label} Risk)*")
        return "".join(lines)

    # Generate AI analysis — try Gemini first, fall back to local engine
    analysis = None
    if gemini_client:
        try:
            savings_rate_val = round((data.savings_per_month / data.monthly_salary) * 100, 1) if data.monthly_salary > 0 else 0
            dti_val = round(((data.monthly_expenses + data.monthly_emi) / data.monthly_salary) * 100, 1) if data.monthly_salary > 0 else 0

            prompt = f"""
You are an expert Indian Certified Financial Planner.

Analyze this person's financial profile and provide a structured assessment:

**Profile:**
- Age: {data.age} years
- Employment: {data.employment_type}
- Monthly Salary: Rs.{data.monthly_salary:,}
- Monthly Expenses: Rs.{data.monthly_expenses:,}
- Monthly EMI: Rs.{data.monthly_emi:,}
- Monthly Savings: Rs.{data.savings_per_month:,}
- Total Debt: Rs.{data.total_debt:,}
- Total Investments: Rs.{data.total_investments:,}
- Credit Score: {data.credit_score}
- Housing: {data.housing_status}
- Dependents: {data.dependents}
- Emergency Fund: {data.emergency_fund_months} months of expenses
- AI Risk Score: {risk_score}/100 ({risk_label} Risk)
- Savings Rate: {savings_rate_val}%
- Debt-to-Income Ratio: {dti_val}%

Write a concise financial analysis (3-4 short sections) covering:
1. **Overall Financial Health** - summary of their current position
2. **Key Strengths** - what they're doing well
3. **Risk Factors** - specific vulnerabilities in their profile
4. **Action Plan** - 3-4 specific, actionable steps tailored to their situation

Use Indian financial context (SIP, PPF, mutual funds, etc.). Use markdown formatting with headers and bullet points. Keep it concise and practical.
"""
            response = gemini_client.models.generate_content(
                model='gemini-2.5-flash-lite',
                contents=prompt
            )
            analysis = response.text
        except Exception as e:
            print(f"Gemini error (falling back to local engine): {e}")
            analysis = None  # Will use local engine below

    # Always fall back to local rule-based engine if Gemini unavailable
    if not analysis:
        analysis = generate_local_analysis(data, risk_score, risk_label, prob_dict)

    return {
        "risk_score": risk_score,
        "risk_label": risk_label,
        "probability_distribution": prob_dict,
        "analysis": analysis or f"Risk Score: {risk_score}/100 — {risk_label} Risk."
    }


@app.post("/analyze-sentiment")
async def analyze_sentiment(data: SentimentInput):
    ticker = data.ticker
    try:
        stock = yf.Ticker(ticker)
        news = stock.news

        if not news:
            return {"sentiment_label": "Neutral", "average_score": 0.0, "headlines": []}

        analyzer = SentimentIntensityAnalyzer()
        scores = []
        analyzed_news = []

        for item in news[:5]:
            # Updated: Handle new yfinance news structure (nested in 'content')
            content = item.get('content', {})
            title = content.get('title') or item.get('title') or ""
            link = (content.get('canonicalUrl') or {}).get('url') or item.get('link') or ""
            
            if not title: continue # Skip empty items
            
            score = analyzer.polarity_scores(title)['compound']
            scores.append(score)
            analyzed_news.append({'title': title, 'score': score, 'link': link})

        avg_score = sum(scores) / len(scores) if scores else 0
        sentiment_label = "Bullish" if avg_score > 0.05 else "Bearish" if avg_score < -0.05 else "Neutral"

        return {
            "sentiment_label": sentiment_label,
            "average_score": avg_score,
            "headlines": analyzed_news
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


import json


def _run_sentiment_pipeline(label: str, ticker_sym: str, news_limit: int = 20):
    """Shared NLP pipeline for both domain and ticker analysis."""
    stock = yf.Ticker(ticker_sym)
    news = stock.news

    analyzer = SentimentIntensityAnalyzer()
    scores = []
    analyzed_news = []
    dist = {"Bullish": 0, "Bearish": 0, "Neutral": 0}

    if not news:
        return None, news  # caller handles empty

    for item in news[:news_limit]:
        content = item.get('content', {})
        title = content.get('title') or item.get('title') or ""
        link = (content.get('canonicalUrl') or {}).get('url') or item.get('link') or ""
        if not title:
            continue
        score = analyzer.polarity_scores(title)['compound']
        scores.append(score)
        lbl = "Bullish" if score > 0.05 else "Bearish" if score < -0.05 else "Neutral"
        dist[lbl] += 1
        analyzed_news.append({'title': title, 'score': score, 'link': link, 'label': lbl})

    avg_score = sum(scores) / len(scores) if scores else 0.0
    sentiment_label = "Bullish" if avg_score > 0.05 else "Bearish" if avg_score < -0.05 else "Neutral"
    avg_intensity = round(sum(abs(s) for s in scores) / len(scores) * 100, 1) if scores else 0.0

    nlp_insights = {
        "positive_count": dist["Bullish"],
        "negative_count": dist["Bearish"],
        "neutral_count": dist["Neutral"],
        "avg_intensity": avg_intensity,
    }

    base = {
        "sentiment_label": sentiment_label,
        "average_score": avg_score,
        "distribution": dist,
        "headlines": analyzed_news,
        "nlp_insights": nlp_insights,
    }
    return base, analyzed_news


def _gemini_synthesis(label: str, analyzed_news: list, is_custom: bool = False):
    """Call Gemini to generate summary, drivers, suggested_action, plain_insight."""
    if not gemini_client or not analyzed_news:
        return None, None, None, None

    headlines_text = "\n".join([f"- [{n['label']}] {n['title']}" for n in analyzed_news])
    plain_desc = f"custom ticker '{label}'" if is_custom else f"{label} market"

    prompt = f"""You are an expert AI Financial Analyst writing for retail investors who may not understand technical jargon.

Analyze these recent news headlines for the {plain_desc}:

{headlines_text}

Each headline is pre-labeled by VADER NLP as [Bullish], [Bearish], or [Neutral].

Provide a JSON object with EXACTLY these keys (no markdown, pure JSON):
1. "summary": 3-4 sentences explaining the market mood using the headlines. Mention specific themes you see. Use **bold** for key terms.
2. "drivers": Array of 4-6 short strings — the main factors driving sentiment (e.g. "Fed Rate Concerns", "Strong Earnings").
3. "suggested_action": ONE of "Buy", "Wait", "Hedge", or "Sell" — your consensus recommendation.
4. "plain_insight": 2-3 plain English sentences explaining what this means for a beginner investor making a decision TODAY. Be direct and practical.

Do NOT include ```json blocks. Return pure JSON only."""

    try:
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash-lite',
            contents=prompt
        )
        resp_text = response.text.strip()
        if resp_text.startswith("```json"):
            resp_text = resp_text[7:]
            if resp_text.endswith("```"):
                resp_text = resp_text[:-3]
        elif resp_text.startswith("```"):
            resp_text = resp_text[3:]
            if resp_text.endswith("```"):
                resp_text = resp_text[:-3]
        resp_text = resp_text.strip()
        ai_data = json.loads(resp_text)
        return (
            ai_data.get("summary"),
            ai_data.get("drivers", []),
            ai_data.get("suggested_action", "Wait"),
            ai_data.get("plain_insight"),
        )
    except Exception as e:
        print(f"Gemini synthesis error: {e}")
        return None, None, None, None


def _local_fallback(label: str, sentiment_label: str):
    """Rule-based fallback if Gemini is unavailable."""
    if sentiment_label == "Bullish":
        return (
            f"The **{label}** market is showing a strong positive trajectory. News signals are aligning with bullish lexical indicators from recent financial headlines.",
            ["Positive Momentum", "Volume Growth", "Increased Demand", "Investor Confidence"],
            "Buy",
            f"The overall news sentiment for {label} is positive right now. This suggests the market is leaning upward. If you are already holding, consider staying invested. If you are looking to enter, this may be a good window — but always check price levels before acting.",
        )
    elif sentiment_label == "Bearish":
        return (
            f"The **{label}** domain is currently under significant selling pressure. Recent headlines indicate heightened volatility and cautious sentiment.",
            ["Selling Pressure", "Market Volatility", "Macro Uncertainty", "Risk-Off Mood"],
            "Hedge",
            f"News around {label} is mostly negative right now. This could mean prices may fall further. If you hold this asset, consider protecting your position. Avoid making large fresh investments until the sentiment stabilises.",
        )
    else:
        return (
            f"The **{label}** market is in a consolidation phase. News flow is balanced between positive catalysts and cautious outlooks.",
            ["Consolidation", "Wait & Watch", "Mixed Signals", "Balanced Headlines"],
            "Wait",
            f"The market for {label} is showing mixed signals — neither strongly positive nor negative. This is a good time to observe and wait before making any major moves. Watch for a clear breakout before acting.",
        )


@app.post("/analyze-domain")
async def analyze_domain(data: DomainInput):
    domain = data.domain
    ticker_sym = DOMAIN_MAPPING.get(domain, "AAPL")
    try:
        base, analyzed_news = _run_sentiment_pipeline(domain, ticker_sym)

        if base is None:
            return {
                "sentiment_label": "Neutral",
                "average_score": 0.0,
                "distribution": {"Bullish": 0, "Bearish": 0, "Neutral": 0},
                "headlines": [],
                "summary": "Not enough news data available at this time.",
                "drivers": [],
                "suggested_action": "Wait",
                "plain_insight": "No recent news was found for this asset. Please try again later.",
                "nlp_insights": {"positive_count": 0, "negative_count": 0, "neutral_count": 0, "avg_intensity": 0},
            }

        # Try Gemini first
        summary, drivers, suggested_action, plain_insight = _gemini_synthesis(domain, analyzed_news)

        # Fall back to local engine if Gemini fails
        if not summary:
            summary, drivers, suggested_action, plain_insight = _local_fallback(
                domain, base["sentiment_label"]
            )

        return {
            **base,
            "summary": summary,
            "drivers": drivers,
            "suggested_action": suggested_action,
            "plain_insight": plain_insight,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-sentiment-full")
async def analyze_sentiment_full(data: SentimentInput):
    """Full NLP analysis for any custom ticker, returning the same rich shape as /analyze-domain."""
    ticker_sym = data.ticker
    try:
        base, analyzed_news = _run_sentiment_pipeline(ticker_sym, ticker_sym, news_limit=15)

        if base is None:
            return {
                "sentiment_label": "Neutral",
                "average_score": 0.0,
                "distribution": {"Bullish": 0, "Bearish": 0, "Neutral": 0},
                "headlines": [],
                "summary": f"No recent news found for **{ticker_sym}**. Verify the ticker symbol.",
                "drivers": [],
                "suggested_action": "Wait",
                "plain_insight": "We couldn't find any news for this ticker. Please double-check the symbol (e.g. TATAMOTORS.NS for NSE stocks).",
                "nlp_insights": {"positive_count": 0, "negative_count": 0, "neutral_count": 0, "avg_intensity": 0},
            }

        summary, drivers, suggested_action, plain_insight = _gemini_synthesis(
            ticker_sym, analyzed_news, is_custom=True
        )

        if not summary:
            summary, drivers, suggested_action, plain_insight = _local_fallback(
                ticker_sym, base["sentiment_label"]
            )

        return {
            **base,
            "summary": summary,
            "drivers": drivers,
            "suggested_action": suggested_action,
            "plain_insight": plain_insight,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat_assistant(req: ChatRequest):
    if not gemini_client:
        return {"response": "AI Assistant is currently offline. Please configure your GEMINI_API_KEY in the backend .env file to enable advanced generative portfolio advice."}

    try:
        prompt = f"""
        You are a highly advanced AI Financial Advisor with expertise in Indian personal finance.
        The user has the following portfolio metrics:
        - Age: {req.user_portfolio.age}
        - Employment: {req.user_portfolio.employment_type}
        - Monthly Salary: Rs.{req.user_portfolio.monthly_salary:,}
        - Monthly Expenses: Rs.{req.user_portfolio.monthly_expenses:,}
        - Monthly EMI: Rs.{req.user_portfolio.monthly_emi:,}
        - Monthly Savings: Rs.{req.user_portfolio.savings_per_month:,}
        - Housing: {req.user_portfolio.housing_status}
        - Total Investments: Rs.{req.user_portfolio.total_investments:,}
        - Total Debt: Rs.{req.user_portfolio.total_debt:,}
        - Credit Score: {req.user_portfolio.credit_score}
        - Dependents: {req.user_portfolio.dependents}
        - Emergency Fund: {req.user_portfolio.emergency_fund_months} months

        The user asks: "{req.question}"

        Provide a concise, professional, and directly actionable financial assessment in Indian context (SIP, mutual funds, PPF, NPS, etc.). Use markdown formatting.
        """

        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash-lite',
            contents=prompt
        )
        return {"response": response.text}
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "quota" in error_msg.lower():
            return {
                "response": "⚠️ **Network Notice:** The AI Assistant is currently experiencing high traffic and has temporarily hit its free-tier API rate limits. Please wait about 60 seconds and try your question again."
            }
        raise HTTPException(status_code=500, detail=f"LLM API Error: {error_msg}")
