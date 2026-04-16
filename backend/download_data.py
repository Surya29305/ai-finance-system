import pandas as pd
import requests
import io

def download_dataset():
    # URL for the Statlog (German Credit Data) from UCI
    # The 'data' file is space-separated and contains categorical codes
    url = "https://archive.ics.uci.edu/ml/machine-learning-databases/statlog/german/german.data"
    
    columns = [
        "status", "duration", "credit_history", "purpose", "amount", 
        "savings", "employment_duration", "installment_rate", 
        "personal_status_sex", "other_debtors", "residence_since", 
        "property", "age", "other_installment_plans", "housing", 
        "number_credits", "job", "people_liable", "telephone", 
        "foreign_worker", "credit_risk"
    ]
    
    print("Downloading German Credit Dataset...")
    response = requests.get(url)
    if response.status_code == 200:
        data = response.text
        df = pd.read_csv(io.StringIO(data), sep=' ', names=columns)
        
        # Save to CSV
        df.to_csv("german_credit_data.csv", index=False)
        print("Dataset saved to german_credit_data.csv")
    else:
        print(f"Failed to download dataset. Status code: {response.status_code}")

if __name__ == "__main__":
    download_dataset()
