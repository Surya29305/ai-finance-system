import pandas as pd
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib

def train():
    print("Loading dataset...")
    df = pd.read_csv('credit_risk_data.csv')

    print("Class distribution:")
    print(df['risk_label'].value_counts())

    X = df.drop(columns=['risk_label'])
    y = df['risk_label']

    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    print(f"\nLabel encoding: {dict(zip(le.classes_, le.transform(le.classes_)))}")
    joblib.dump(le, 'label_encoder.pkl')

    numerical_features = [
        'age', 'annual_salary', 'monthly_expenses', 'monthly_emi',
        'savings_per_month', 'total_investments', 'total_debt',
        'credit_score', 'dependents', 'emergency_fund_months'
    ]
    categorical_features = ['housing_status', 'employment_type']

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ]
    )

    clf = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1,
        eval_metric='mlogloss',
    )

    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', clf)
    ])

    print("\nTraining XGBClassifier pipeline on 150,000 rows...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )

    pipeline.fit(X_train, y_train)

    acc = pipeline.score(X_test, y_test)
    print(f"XGBoost trained! Test Accuracy: {acc * 100:.2f}%")

    # Quick sanity check
    print("\n--- Sanity Check ---")
    test_cases = [
        # Very HIGH risk
        {'age': 25, 'annual_salary': 180000, 'monthly_expenses': 14000, 'monthly_emi': 8000,
         'savings_per_month': 0, 'housing_status': 'Rent', 'employment_type': 'Freelancer',
         'total_investments': 0, 'total_debt': 500000, 'credit_score': 400,
         'dependents': 4, 'emergency_fund_months': 0},
        # Very LOW risk
        {'age': 48, 'annual_salary': 3600000, 'monthly_expenses': 40000, 'monthly_emi': 0,
         'savings_per_month': 150000, 'housing_status': 'Own', 'employment_type': 'Salaried',
         'total_investments': 10000000, 'total_debt': 0, 'credit_score': 850,
         'dependents': 0, 'emergency_fund_months': 18},
        # MEDIUM risk
        {'age': 32, 'annual_salary': 720000, 'monthly_expenses': 35000, 'monthly_emi': 12000,
         'savings_per_month': 8000, 'housing_status': 'Rent', 'employment_type': 'Salaried',
         'total_investments': 150000, 'total_debt': 300000, 'credit_score': 670,
         'dependents': 2, 'emergency_fund_months': 3},
    ]
    expected = ["HIGH", "LOW", "MEDIUM"]
    for i, tc in enumerate(test_cases):
        df_tc = pd.DataFrame([tc])
        probs = pipeline.predict_proba(df_tc)[0]
        pred = pipeline.predict(df_tc)[0]
        label = le.inverse_transform([pred])[0]
        classes = le.classes_
        prob_dict = {classes[j]: round(float(probs[j]), 3) for j in range(len(classes))}
        score = round(prob_dict.get('High',0)*100 + prob_dict.get('Medium',0)*50 + prob_dict.get('Low',0)*15)
        print(f"  Expected {expected[i]}: got {label} (score={score}) | probs={prob_dict}")

    joblib.dump(pipeline, 'risk_pipeline.pkl')
    print("\nPipeline saved to risk_pipeline.pkl!")

if __name__ == "__main__":
    train()
