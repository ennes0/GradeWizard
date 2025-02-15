import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_absolute_error
import pickle

def generate_training_data(n_samples=5000):
    data = {}
    
    for i in range(n_samples):
        sample = {}
        onceki_not = np.random.normal(70, 15)
        alt_konu_bilgisi = [np.random.choice([0, 2, 3, 4, 5]) for _ in range(9)]
        
        yuksek_performans = onceki_not > 80 and np.mean(alt_konu_bilgisi) > 3
        
        ana_konular = [
            np.mean(alt_konu_bilgisi[0:3]),
            np.mean(alt_konu_bilgisi[3:6]),
            np.mean(alt_konu_bilgisi[6:9])
        ]
        
        sample.update({
            "Konu 1": ana_konular[0],
            "Konu 2": ana_konular[1],
            "Konu 3": ana_konular[2],
            "Önceki Not": onceki_not,
        })
        
        for j in range(9):
            sample[f"Konu {j//3 + 1} Alt {j%3 + 1}"] = alt_konu_bilgisi[j]
        
        if yuksek_performans:
            sample.update({
                "Çalışma Süresi (saat)": np.random.uniform(1, 4),
                "Motivasyon (1-10)": np.random.uniform(2, 5)
            })
        else:
            sample.update({
                "Çalışma Süresi (saat)": np.random.uniform(0, 12),
                "Motivasyon (1-10)": np.random.uniform(1, 10)
            })
        
        alt_konu_etkisi = np.mean(alt_konu_bilgisi) * 18  
        onceki_not_etkisi = min(onceki_not * 0.4, 40)  
        motivasyon_etkisi = sample["Motivasyon (1-10)"] * 0.3
        calisma_etkisi = sample["Çalışma Süresi (saat)"] * 0.15
        
        hedef_not = alt_konu_etkisi + onceki_not_etkisi + motivasyon_etkisi + calisma_etkisi
        sample["Hedef Not"] = np.clip(hedef_not, 0, 100)
        
        for key, value in sample.items():
            if key not in data:
                data[key] = []
            data[key].append(value)
    
    return data

data = generate_training_data(5000)
df = pd.DataFrame(data)
X = df.drop(columns=["Hedef Not"])
y = df["Hedef Not"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

param_grid = {
    "n_estimators": [150, 250],
    "learning_rate": [0.02, 0.05],
    "max_depth": [6, 8],
}

grid_search = GridSearchCV(
    estimator=GradientBoostingRegressor(random_state=42),
    param_grid=param_grid,
    scoring="neg_mean_absolute_error",
    cv=3,
    verbose=1,
    n_jobs=-1,
)

grid_search.fit(X_train, y_train)
best_model = grid_search.best_estimator_
print(f"En iyi parametreler: {grid_search.best_params_}")

model_path = "optimized_gbr_model.pkl"
joblib.dump(best_model, model_path)
print(f"✅ Optimize edilmiş model kaydedildi: {model_path}")

y_pred = best_model.predict(X_test)
y_pred = np.clip(y_pred, 0, 100)

mae = mean_absolute_error(y_test, y_pred)
print(f"📉 Ortalama Mutlak Hata (MAE): {mae:.2f}")

feature_importances = best_model.feature_importances_
features = X.columns
print("\n📊 Özellik Önemi Sıralaması:")
for feature, importance in sorted(zip(features, feature_importances), key=lambda x: x[1], reverse=True):
    print(f"{feature}: {importance:.4f}")

with open('model.pkl', 'wb') as f:
    pickle.dump(best_model, f)
