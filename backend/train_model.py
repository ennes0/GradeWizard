import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_absolute_error
import pickle

# Daha gerçekçi ve geniş bir veri seti oluşturalım
def generate_synthetic_data(n_samples=1000):
    data = {
        # Ana konular (0-2 arası)
        "Konu 1": np.random.choice([0, 1, 2], n_samples),
        "Konu 2": np.random.choice([0, 1, 2], n_samples),
        "Konu 3": np.random.choice([0, 1, 2], n_samples),
        
        # Alt konular (0-5 arası, daha yüksek ağırlık)
        "Konu 1 Alt 1": np.random.choice([0, 2, 3, 4, 5], n_samples),
        "Konu 1 Alt 2": np.random.choice([0, 2, 3, 4, 5], n_samples),
        "Konu 1 Alt 3": np.random.choice([0, 2, 3, 4, 5], n_samples),
        "Konu 2 Alt 1": np.random.choice([0, 2, 3, 4, 5], n_samples),
        "Konu 2 Alt 2": np.random.choice([0, 2, 3, 4, 5], n_samples),
        "Konu 2 Alt 3": np.random.choice([0, 2, 3, 4, 5], n_samples),
        "Konu 3 Alt 1": np.random.choice([0, 2, 3, 4, 5], n_samples),
        "Konu 3 Alt 2": np.random.choice([0, 2, 3, 4, 5], n_samples),
        "Konu 3 Alt 3": np.random.choice([0, 2, 3, 4, 5], n_samples),
        
        # Çalışma süresi (1-12 saat arası, gerçekçi dağılım)
        "Çalışma Süresi (saat)": np.random.choice(
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            n_samples,
            p=[0.1, 0.15, 0.2, 0.15, 0.1, 0.1, 0.05, 0.05, 0.03, 0.03, 0.02, 0.02]  # Gerçekçi dağılım
        ),
        
        # Önceki notlar (0-100 arası, normal dağılım)
        "Önceki Not": np.clip(np.random.normal(70, 15, n_samples), 0, 100).astype(int),
        
        # Motivasyon (1-10 arası, gerçekçi dağılım)
        "Motivasyon (1-10)": np.random.choice(
            range(1, 11),
            n_samples,
            p=[0.05, 0.05, 0.1, 0.1, 0.15, 0.15, 0.15, 0.1, 0.1, 0.05]  # Gerçekçi motivasyon dağılımı
        )
    }
    
    # Hedef notu hesapla (daha gerçekçi bir formül ile)
    df = pd.DataFrame(data)
    
    # Alt konu bilgisine daha fazla ağırlık veren bir hesaplama
    alt_konu_ortalama = df[[col for col in df.columns if 'Alt' in col]].mean(axis=1) * 10  # 0-50 arası
    ana_konu_ortalama = df[['Konu 1', 'Konu 2', 'Konu 3']].mean(axis=1) * 5  # 0-10 arası
    motivasyon_etkisi = df['Motivasyon (1-10)'] * 0.5  # 0.5-5 arası
    calisma_etkisi = df['Çalışma Süresi (saat)'] * 0.5  # 0.5-6 arası
    onceki_not_etkisi = df['Önceki Not'] * 0.3  # 0-30 arası
    
    # Hedef notu hesapla ve 0-100 aralığında tut
    data["Hedef Not"] = np.clip(
        alt_konu_ortalama +  # En yüksek etki alt konulardan (0-50)
        ana_konu_ortalama +  # Ana konulardan (0-10)
        motivasyon_etkisi +  # Motivasyondan (0.5-5)
        calisma_etkisi +     # Çalışma süresinden (0.5-6)
        onceki_not_etkisi,   # Önceki nottan (0-30)
        0, 100
    ).astype(int)
    
    return data

# Genişletilmiş veri setini oluştur
data = generate_synthetic_data(1000)  # 1000 örnek

# 📌 Veriyi DataFrame'e çevir
df = pd.DataFrame(data)

# Özellikler (X) ve hedef değişkeni (y) ayır
X = df.drop(columns=["Hedef Not"])
y = df["Hedef Not"]

# Veriyi eğitim ve test setine ayır
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 📌 GridSearch parametreleri
param_grid = {
    "n_estimators": [100, 200],  # Daha fazla ağaç
    "learning_rate": [0.01, 0.05],  # Daha düşük öğrenme oranı
    "max_depth": [5, 7],  # Daha derin ağaçlar
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

# Modeli pickle ile kaydet
with open('model.pkl', 'wb') as f:
    pickle.dump(best_model, f)
