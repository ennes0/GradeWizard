import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_absolute_error
import pickle

# Veri setini alt konulara daha fazla ağırlık verecek şekilde güncelle
def generate_training_data(n_samples=1000):
    data = {}
    
    # Her örnek için rastgele değerler üret
    for i in range(n_samples):
        sample = {}
        onceki_not = np.random.normal(70, 15)  # Önceki not ortalaması 70, standart sapma 15
        
        # Alt konuları bilme durumu (0-5 arası)
        alt_konu_bilgisi = [np.random.choice([0, 2, 3, 4, 5]) for _ in range(9)]
        
        # Eğer önceki not yüksekse (>80) ve alt konuları iyi biliyorsa
        # motivasyon ve çalışma süresinin etkisini minimize et
        yuksek_performans = onceki_not > 80 and np.mean(alt_konu_bilgisi) > 3
        
        # Ana konular (alt konuların ortalamasına göre)
        ana_konular = [
            np.mean(alt_konu_bilgisi[0:3]),
            np.mean(alt_konu_bilgisi[3:6]),
            np.mean(alt_konu_bilgisi[6:9])
        ]
        
        # Veri setine ekle
        sample.update({
            "Konu 1": ana_konular[0],
            "Konu 2": ana_konular[1],
            "Konu 3": ana_konular[2],
            "Konu 1 Alt 1": alt_konu_bilgisi[0],
            "Konu 1 Alt 2": alt_konu_bilgisi[1],
            "Konu 1 Alt 3": alt_konu_bilgisi[2],
            "Konu 2 Alt 1": alt_konu_bilgisi[3],
            "Konu 2 Alt 2": alt_konu_bilgisi[4],
            "Konu 2 Alt 3": alt_konu_bilgisi[5],
            "Konu 3 Alt 1": alt_konu_bilgisi[6],
            "Konu 3 Alt 2": alt_konu_bilgisi[7],
            "Konu 3 Alt 3": alt_konu_bilgisi[8],
            "Önceki Not": onceki_not,
        })
        
        # Yüksek performanslı öğrenciler için motivasyon ve çalışma süresinin etkisini azalt
        if yuksek_performans:
            sample.update({
                "Çalışma Süresi (saat)": np.random.uniform(0, 2),  # Minimal etki
                "Motivasyon (1-10)": np.random.uniform(1, 3)  # Minimal etki
            })
        else:
            sample.update({
                "Çalışma Süresi (saat)": np.random.uniform(0, 12),
                "Motivasyon (1-10)": np.random.uniform(1, 10)
            })
        
        # Hedef notu hesapla
        alt_konu_etkisi = np.mean(alt_konu_bilgisi) * 15  # Alt konular max 75 puan etkisi
        onceki_not_etkisi = min(onceki_not * 0.25, 25)  # Önceki not max 25 puan etkisi
        
        # Yüksek performanslı öğrenciler için diğer faktörlerin etkisini minimize et
        if yuksek_performans:
            motivasyon_etkisi = 0
            calisma_etkisi = 0
        else:
            motivasyon_etkisi = sample["Motivasyon (1-10)"] * 0.2  # Max 2 puan etkisi
            calisma_etkisi = sample["Çalışma Süresi (saat)"] * 0.1  # Max 1.2 puan etkisi
        
        hedef_not = alt_konu_etkisi + onceki_not_etkisi + motivasyon_etkisi + calisma_etkisi
        sample["Hedef Not"] = np.clip(hedef_not, 0, 100)
        
        # Her örneği veri setine ekle
        for key, value in sample.items():
            if key not in data:
                data[key] = []
            data[key].append(value)
    
    return data

# Yeni veri setini oluştur
data = generate_training_data(1000)

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
