import requests

profiles = [
    # HIGH RISK
    {"age": 25, "monthly_salary": 15000, "monthly_expenses": 13000, "housing_status": "Rent",
     "total_investments": 0, "total_debt": 900000, "credit_score": 400, "dependents": 4,
     "employment_type": "Freelancer", "monthly_emi": 5000, "savings_per_month": 0, "emergency_fund_months": 0},
    # LOW RISK
    {"age": 50, "monthly_salary": 150000, "monthly_expenses": 30000, "housing_status": "Own",
     "total_investments": 5000000, "total_debt": 0, "credit_score": 820, "dependents": 0,
     "employment_type": "Salaried", "monthly_emi": 0, "savings_per_month": 80000, "emergency_fund_months": 12},
    # MEDIUM
    {"age": 35, "monthly_salary": 60000, "monthly_expenses": 35000, "housing_status": "Rent",
     "total_investments": 200000, "total_debt": 150000, "credit_score": 680, "dependents": 2,
     "employment_type": "Salaried", "monthly_emi": 8000, "savings_per_month": 10000, "emergency_fund_months": 3},
]

names = ["HIGH RISK", "LOW RISK", "MEDIUM"]
for i, p in enumerate(profiles):
    r = requests.post("http://localhost:8000/predict-risk", json=p)
    d = r.json()
    print(f"Profile {i+1} ({names[i]}): score={d['risk_score']}, label={d['risk_label']}, probs={d['probability_distribution']}")
