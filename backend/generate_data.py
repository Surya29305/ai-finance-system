import pandas as pd
import numpy as np

# Generate 150,000 synthetic Indian financial profiles
n_samples = 150000

print(f"Generating {n_samples} realistic Indian financial profiles (INR)...")
np.random.seed(42)

# ── Monthly salary in INR (realistic Indian range) ─────────────────────────
# Range: ₹15,000 (entry level) to ₹5,00,000 (senior/C-suite)
monthly_salary = np.clip(
    np.random.lognormal(mean=np.log(60000), sigma=0.7, size=n_samples),
    15000, 500000
).astype(int)

annual_salary = monthly_salary * 12

# ── Demographics ───────────────────────────────────────────────────────────
age = np.clip(np.random.normal(35, 10, n_samples), 22, 65).astype(int)
dependents = np.clip(np.random.poisson(1.5, n_samples), 0, 6).astype(int)

# ── Housing ────────────────────────────────────────────────────────────────
housing_status = np.random.choice(
    ['Rent', 'Own', 'Mortgage'], n_samples, p=[0.45, 0.20, 0.35]
)

# ── Monthly expenses: 30–75% of salary ────────────────────────────────────
expense_ratio = np.random.uniform(0.30, 0.75, n_samples)
monthly_expenses = np.clip(
    (monthly_salary * expense_ratio).astype(int), 5000, None
)

# ── EMI: 0–50% of salary (higher for Mortgage holders) ────────────────────
base_emi_ratio = np.random.uniform(0.0, 0.45, n_samples)
emi_boost = np.where(housing_status == 'Mortgage', 0.10, 0.0)
monthly_emi = np.clip(
    (monthly_salary * (base_emi_ratio + emi_boost)).astype(int), 0, None
)

# ── Savings per month ──────────────────────────────────────────────────────
disposable = np.maximum(monthly_salary - monthly_expenses - monthly_emi, 0)
savings_ratio = np.random.uniform(0.0, 0.9, n_samples)
savings_per_month = (disposable * savings_ratio).astype(int)

# ── Debt (correlated with EMI and housing) ─────────────────────────────────
total_debt = np.where(
    housing_status == 'Mortgage',
    np.clip(np.random.normal(monthly_salary * 60, monthly_salary * 15, n_samples), 0, None),
    np.where(
        housing_status == 'Rent',
        np.clip(np.random.normal(monthly_salary * 5, monthly_salary * 3, n_samples), 0, None),
        np.clip(np.random.normal(monthly_salary * 2, monthly_salary * 2, n_samples), 0, None),
    )
).astype(int)

# ── Investments ────────────────────────────────────────────────────────────
invest_months = np.random.uniform(0, 60, n_samples)  # 0–5 years of savings invested
total_investments = np.clip(
    (savings_per_month * invest_months).astype(int), 0, None
)

# ── Credit score (Indian CIBIL range: 300–900) ─────────────────────────────
credit_score = np.clip(np.random.normal(680, 90, n_samples), 300, 900).astype(int)

# ── Emergency fund in months ───────────────────────────────────────────────
emergency_fund_months = np.clip(np.random.exponential(scale=4, size=n_samples), 0, 24).astype(int)

# ── Employment type ────────────────────────────────────────────────────────
employment_type = np.random.choice(
    ['Salaried', 'Self-Employed', 'Business', 'Freelancer', 'Retired'],
    n_samples, p=[0.55, 0.20, 0.12, 0.08, 0.05]
)

# ══════════════════════════════════════════════════════════════════════════
# RISK SCORING LOGIC — deterministic, rule-based, multi-factor
# ══════════════════════════════════════════════════════════════════════════
score = np.zeros(n_samples)

# 1. Savings rate (savings / salary) — higher is better
savings_rate = savings_per_month / np.maximum(monthly_salary, 1)
score += np.where(savings_rate >= 0.20, -2,
         np.where(savings_rate >= 0.10,  0,
         np.where(savings_rate >= 0.05,  2, 4)))

# 2. EMI-to-income ratio
emi_ratio = monthly_emi / np.maximum(monthly_salary, 1)
score += np.where(emi_ratio <= 0.20, -1,
         np.where(emi_ratio <= 0.30,  1,
         np.where(emi_ratio <= 0.40,  3, 5)))

# 3. Expense ratio
expense_ratio_actual = monthly_expenses / np.maximum(monthly_salary, 1)
score += np.where(expense_ratio_actual <= 0.40, -1,
         np.where(expense_ratio_actual <= 0.55,  0,
         np.where(expense_ratio_actual <= 0.70,  2, 4)))

# 4. Credit score
score += np.where(credit_score >= 750,  -2,
         np.where(credit_score >= 700,  -1,
         np.where(credit_score >= 650,   1,
         np.where(credit_score >= 600,   2, 4))))

# 5. Emergency fund
score += np.where(emergency_fund_months >= 6, -2,
         np.where(emergency_fund_months >= 3,  0,
         np.where(emergency_fund_months >= 1,  2, 4)))

# 6. Debt-to-income (annual)
annual_dti = total_debt / np.maximum(annual_salary, 1)
score += np.where(annual_dti <= 1,   -1,
         np.where(annual_dti <= 3,    1,
         np.where(annual_dti <= 6,    3, 5)))

# 7. Investment coverage
invest_to_annual = total_investments / np.maximum(annual_salary, 1)
score += np.where(invest_to_annual >= 2,  -2,
         np.where(invest_to_annual >= 1,  -1,
         np.where(invest_to_annual >= 0.5, 0, 2)))

# 8. Dependents burden
score += np.where(dependents == 0, -1,
         np.where(dependents <= 2,   0,
         np.where(dependents <= 4,   2, 4)))

# 9. Housing status
score += np.where(housing_status == 'Own',      -1,
         np.where(housing_status == 'Rent',      1, 2))

# 10. Employment stability
score += np.where(np.isin(employment_type, ['Salaried']),       -1,
         np.where(np.isin(employment_type, ['Business']),         0,
         np.where(np.isin(employment_type, ['Retired']),          0,
         np.where(np.isin(employment_type, ['Self-Employed']),    2, 3))))

# ── Label assignment ───────────────────────────────────────────────────────
# Tune thresholds to get roughly 25% Low / 40% Medium / 35% High
risk_label = np.where(score >= 12, 'High',
             np.where(score >= 4,  'Medium', 'Low'))

# ── Build DataFrame ────────────────────────────────────────────────────────
df = pd.DataFrame({
    'age':                  age,
    'annual_salary':        annual_salary,
    'monthly_expenses':     monthly_expenses,
    'monthly_emi':          monthly_emi,
    'savings_per_month':    savings_per_month,
    'housing_status':       housing_status,
    'employment_type':      employment_type,
    'total_investments':    total_investments,
    'total_debt':           total_debt,
    'credit_score':         credit_score,
    'dependents':           dependents,
    'emergency_fund_months': emergency_fund_months,
    'risk_label':           risk_label,
})

print("Class distribution:")
print(df['risk_label'].value_counts())
print(f"\nSample annual salary range: INR {df['annual_salary'].min():,} - INR {df['annual_salary'].max():,}")

df.to_csv('credit_risk_data.csv', index=False)
print("\nData generation complete. Saved to credit_risk_data.csv.")
