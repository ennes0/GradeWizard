import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_absolute_error

# Genişletilmiş eğitim verisi: Her ana konu için 3 alt konu
data = {
    "Konu 1": [1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1],
    "Konu 2": [1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0],
    "Konu 3": [1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0],
    # Konu 1'in alt konuları
    "Konu 1 Alt 1": [1, 0.5, 1, 0, 0, 1, 1, 0.5, 1, 0, 1, 1, 0, 1, 1, 0, 0.5, 1, 0, 1],
    "Konu 1 Alt 2": [1, 1, 0.5, 1, 0, 0, 0.5, 1, 0, 1, 0.5, 1, 0, 1, 1, 1, 0, 0, 1, 0.5],
    "Konu 1 Alt 3": [1, 0, 0.5, 1, 1, 0, 1, 0.5, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0],
    # Konu 2'nin alt konuları
    "Konu 2 Alt 1": [1, 0.5, 1, 0, 0, 1, 1, 0.5, 1, 0, 1, 1, 0, 1, 1, 0, 0.5, 1, 0, 1],
    "Konu 2 Alt 2": [1, 1, 0.5, 1, 0, 0, 0.5, 1, 0, 1, 0.5, 1, 0, 1, 1, 1, 0, 0, 1, 0.5],
    "Konu 2 Alt 3": [1, 0, 0.5, 1, 1, 0, 1, 0.5, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0],
    # Konu 3'ün alt konuları
    "Konu 3 Alt 1": [1, 0.5, 1, 0, 0, 1, 1, 0.5, 1, 0, 1, 1, 0, 1, 1, 0, 0.5, 1, 0, 1],
    "Konu 3 Alt 2": [1, 1, 0.5, 1, 0, 0, 0.5, 1, 0, 1, 0.5, 1, 0, 1, 1, 1, 0, 0, 1, 0.5],
    "Konu 3 Alt 3": [1, 0, 0.5, 1, 1, 0, 1, 0.5, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0],
    "Çalışma Süresi (saat)": [10, 8, 6, 5, 4, 2, 9, 3, 12, 7, 11, 4, 6, 8, 10, 1, 2, 0, 15, 1],
    "Önceki Not": [85, 80, 75, 70, 60, 50, 90, 55, 95, 75, 88, 65, 78, 80, 92, 30, 20, 40, 10, 5],
    "Motivasyon (1-10)": [9, 8, 7, 6, 5, 4, 9, 6, 10, 8, 9, 5, 7, 8, 9, 2, 1, 3, 1, 2],
    "Hedef Not": [95, 90, 85, 80, 70, 60, 100, 65, 98, 85, 93, 75, 88, 90, 97, 50, 30, 40, 5, 0],
}

# 📌 Veriyi DataFrame'e çevir
df = pd.DataFrame(data)

# Özellikler (X) ve hedef değişkeni (y) ayır
X = df.drop(columns=["Hedef Not"])
y = df["Hedef Not"]

# Veriyi eğitim ve test setine ayır
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 📌 GridSearch parametreleri
param_grid = {
    "n_estimators": [50, 100],
    "learning_rate": [0.05, 0.1],
    "max_depth": [3, 5],
}

# GridSearch ile en iyi modeli bul
grid_search = GridSearchCV(
    estimator=GradientBoostingRegressor(random_state=42),
    param_grid=param_grid,
    scoring="neg_mean_absolute_error",
    cv=3,
    verbose=1,
    n_jobs=-1,
)

# Modeli eğit
grid_search.fit(X_train, y_train)

# En iyi modeli seç
best_model = grid_search.best_estimator_
print(f"En iyi parametreler: {grid_search.best_params_}")

# Modeli kaydet
model_path = "optimized_gbr_model.pkl"
joblib.dump(best_model, model_path)
print(f"✅ Optimize edilmiş model kaydedildi: {model_path}")

# Test setinde tahmin yap
y_pred = best_model.predict(X_test)
y_pred = np.clip(y_pred, 0, 100)  # Tahmin değerlerini 0-100 aralığında tut

# Performans metrikleri
mae = mean_absolute_error(y_test, y_pred)
print(f"📉 Ortalama Mutlak Hata (MAE): {mae:.2f}")

# Özelliklerin önem sıralaması
feature_importances = best_model.feature_importances_
features = X.columns
print("\n📊 Özellik Önemi Sıralaması:")
for feature, importance in sorted(zip(features, feature_importances), key=lambda x: x[1], reverse=True):
    print(f"{feature}: {importance:.4f}")
