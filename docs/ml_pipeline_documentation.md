# Machine Learning Pipeline Documentation
## Sistem Monitoring Predictive Maintenance

---

## 📋 Overview

Sistem ini menggunakan **Machine Learning** untuk deteksi anomaly pada 5 parameter sensor:
1. **Vibration** (0.001 Hz - 1 GHz)
2. **Temperature** (0-1024°C)
3. **Current** (0-100A)
4. **Power** (0-23kW)
5. **Noise** (0-120dB)

---

## 🔄 Pipeline Lengkap

### **Fase 1: Data Collection (1-3 Minggu)** ✅

#### Hardware Setup:
- **Microcontroller**: ESP32/Arduino
- **Sensors**:
  - ADXL345/MPU6050 (Accelerometer untuk vibration)
  - DHT22/DS18B20 (Temperature)
  - ACS712 (Current sensor)
  - INA219 (Power sensor)
  - MAX9814 (Microphone untuk noise)

#### Data Collection Strategy:
```javascript
// Contoh format data mentah yang disimpan
{
  timestamp: "2026-01-18T10:30:45.123Z",
  timestampMs: 1737196245123,
  motorId: "Motor Mainshakeout",
  subMotorId: "Shakeout Reguler",
  
  // Raw sensor readings (belum diproses)
  raw: {
    vibration: 234567.89,      // Hz (raw dari FFT accelerometer)
    temperature: 65.4,         // °C
    current: 12.5,             // A
    power: 15.2,              // kW
    noise: 78.5               // dB
  },
  
  // Metadata
  collectionPhase: "training",
  deviceId: "ESP32_001",
  firmwareVersion: "v1.0.0"
}
```

#### Collection Parameters:
- **Sampling Rate**: 1 reading/second (adjustable: 0.5s - 5s)
- **Duration**: 1-3 minggu (recommended: 3 minggu minimum)
- **Expected Data Points**: 
  - 1 minggu: ~604,800 readings (7 days × 24h × 3600s)
  - 3 minggu: ~1,814,400 readings
- **Storage**: Firebase Firestore collection `rawSensorData`

#### Data Quality Requirements:
✅ **Normal Operating Conditions** (70% data):
- Mesin beroperasi normal tanpa masalah
- Berbagai load conditions (ringan, sedang, berat)
- Berbagai waktu (pagi, siang, malam)

✅ **Abnormal Conditions** (30% data):
- Simulasi kondisi abnormal (overheating, overload, dll)
- Natural anomalies yang terjadi
- Edge cases

---

### **Fase 2: Data Preprocessing**

#### 2.1 Data Cleaning
```python
# Remove outliers, handle missing values
- Remove readings dengan error/null values
- Handle sensor glitches
- Remove duplicate timestamps
```

#### 2.2 Feature Extraction

**Vibration Processing (FFT)**:
```python
import numpy as np
from scipy.fft import fft

# Raw accelerometer → FFT → Dominant frequency
acceleration_data = read_accelerometer()  # x, y, z axis
fft_result = fft(acceleration_data)
dominant_freq = find_peak_frequency(fft_result)  # Hz
```

**Statistical Features**:
```python
# Untuk setiap parameter, extract:
- Mean (rata-rata)
- Standard Deviation (variasi)
- Min/Max
- Moving Average (window: 10s, 30s, 60s)
- Rate of Change (kecepatan perubahan)
```

#### 2.3 Normalization (Z-Score)
```python
from sklearn.preprocessing import StandardScaler

# Normalize semua features ke mean=0, std=1
scaler = StandardScaler()
normalized_data = scaler.fit_transform(raw_data)

# Save scaler untuk inference nanti
import joblib
joblib.dump(scaler, 'models/scaler.pkl')
```

#### 2.4 Time Windows
```python
# Create sequences untuk LSTM
window_size = 60  # 60 detik history
sequences = create_sequences(data, window_size)
```

---

### **Fase 3: Model Training**

#### 3.1 Autoencoder (Anomaly Detection)

**Konsep**: Train neural network untuk reconstruct normal patterns. Jika reconstruction error tinggi → anomaly.

```python
import tensorflow as tf
from tensorflow.keras import layers, Model

# Architecture
input_dim = 5  # 5 parameters
encoding_dim = 3

# Encoder
encoder_input = layers.Input(shape=(input_dim,))
encoded = layers.Dense(8, activation='relu')(encoder_input)
encoded = layers.Dense(encoding_dim, activation='relu')(encoded)

# Decoder
decoded = layers.Dense(8, activation='relu')(encoded)
decoded = layers.Dense(input_dim, activation='sigmoid')(decoded)

# Model
autoencoder = Model(encoder_input, decoded)
autoencoder.compile(optimizer='adam', loss='mse')

# Train dengan data NORMAL saja
autoencoder.fit(normal_data, normal_data, 
                epochs=100, batch_size=256, validation_split=0.2)

# Save model
autoencoder.save('models/autoencoder.h5')
```

**Inference**:
```python
# Prediction
reconstructed = autoencoder.predict(new_data)
reconstruction_error = np.mean(np.square(new_data - reconstructed))

# Threshold (tentukan dari validation set)
threshold = 0.05  # Tuned berdasarkan data
is_anomaly = reconstruction_error > threshold
```

#### 3.2 LSTM (Time Series Prediction)

**Konsep**: Predict nilai sensor berikutnya. Jika prediksi jauh dari actual → anomaly.

```python
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout

# Architecture
model = Sequential([
    LSTM(50, return_sequences=True, input_shape=(window_size, 5)),
    Dropout(0.2),
    LSTM(50, return_sequences=False),
    Dropout(0.2),
    Dense(25),
    Dense(5)  # Predict next values untuk 5 parameters
])

model.compile(optimizer='adam', loss='mse', metrics=['mae'])

# Train
history = model.fit(X_train, y_train, 
                   epochs=50, batch_size=64, 
                   validation_data=(X_val, y_val))

# Save
model.save('models/lstm_predictor.h5')
```

**Inference**:
```python
# Predict next values
predicted = lstm_model.predict(last_60_seconds)
actual = current_reading

# Prediction error
prediction_error = np.abs(predicted - actual)
normalized_error = prediction_error / actual  # Percentage error

# Threshold per parameter
is_anomaly = any(normalized_error > [0.15, 0.10, 0.12, 0.15, 0.08])
```

#### 3.3 Isolation Forest (Outlier Detection)

**Konsep**: Tree-based algorithm untuk isolate anomalous points.

```python
from sklearn.ensemble import IsolationForest

# Train
iso_forest = IsolationForest(
    contamination=0.1,  # Expected % of anomalies
    random_state=42,
    n_estimators=100
)
iso_forest.fit(training_data)

# Save
joblib.dump(iso_forest, 'models/isolation_forest.pkl')
```

**Inference**:
```python
# Predict (-1 = anomaly, 1 = normal)
prediction = iso_forest.predict([new_reading])
anomaly_score = iso_forest.score_samples([new_reading])

is_anomaly = prediction == -1
```

#### 3.4 Ensemble Decision

Combine all 3 models:
```python
def detect_anomaly(reading):
    # Autoencoder
    recon_error = autoencoder_predict(reading)
    ae_anomaly = recon_error > ae_threshold
    
    # LSTM
    pred_error = lstm_predict(last_60_readings)
    lstm_anomaly = pred_error > lstm_threshold
    
    # Isolation Forest
    if_anomaly = isolation_forest.predict([reading]) == -1
    
    # Voting
    votes = ae_anomaly + lstm_anomaly + if_anomaly
    
    # If 2/3 or 3/3 models say anomaly → ANOMALY
    is_anomaly = votes >= 2
    
    # Confidence score
    confidence = votes / 3.0
    
    return {
        'isAnomaly': is_anomaly,
        'confidence': confidence,
        'details': {
            'autoencoder': ae_anomaly,
            'lstm': lstm_anomaly,
            'isolationForest': if_anomaly
        }
    }
```

---

### **Fase 4: Model Deployment**

#### 4.1 Model Conversion
```bash
# TensorFlow → TensorFlow Lite (untuk ESP32)
tflite_convert --keras_model_file=autoencoder.h5 \
               --output_file=autoencoder.tflite

# Or ONNX format
import tf2onnx
onnx_model = tf2onnx.convert.from_keras(model)
```

#### 4.2 Inference Pipeline

**Option A: Edge Computing (ESP32)**
```cpp
// ESP32 C++ code
#include <TensorFlowLite_ESP32.h>

// Load model
tflite::MicroInterpreter interpreter(model, ...);

// Run inference
float input[5] = {vib, temp, curr, pow, noise};
interpreter->input(0)->data.f = input;
interpreter->Invoke();
float* output = interpreter->output(0)->data.f;
```

**Option B: Cloud Computing (Firebase Functions)**
```javascript
// Firebase Cloud Function
import * as functions from 'firebase-functions';
import * as tf from '@tensorflow/tfjs-node';

export const predictAnomaly = functions.firestore
  .document('rawSensorData/{docId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    
    // Load models
    const autoencoder = await tf.loadLayersModel('gs://bucket/autoencoder/model.json');
    const lstm = await tf.loadLayersModel('gs://bucket/lstm/model.json');
    
    // Predict
    const result = await detectAnomaly(data.raw);
    
    // Save result
    await snap.ref.update({
      mlPrediction: result,
      status: result.isAnomaly ? 'abnormal' : 'normal'
    });
  });
```

---

## 📊 Data Storage Structure

### **rawSensorData** (Training Phase)
```javascript
{
  id: "auto-generated",
  timestamp: ISOString,
  timestampMs: number,
  motorId: string,
  subMotorId: string,
  raw: {
    vibration: number,
    temperature: number,
    current: number,
    power: number,
    noise: number
  },
  collectionPhase: "training",
  deviceId: string
}
```

### **sensorReadings** (Production Phase)
```javascript
{
  id: "auto-generated",
  timestamp: ISOString,
  timestampMs: number,
  motorId: string,
  subMotorId: string,
  parameters: {
    vibration: number,  // After preprocessing
    temperature: number,
    current: number,
    power: number,
    noise: number
  },
  mlPrediction: {
    isAnomaly: boolean,
    confidence: number,
    autoencoder: {
      reconstructionError: number,
      threshold: number,
      isAbnormal: boolean
    },
    lstm: {
      predictionError: number,
      threshold: number,
      isAbnormal: boolean
    },
    isolationForest: {
      anomalyScore: number,
      isAbnormal: boolean
    }
  },
  status: "normal" | "abnormal"
}
```

---

## 🔧 Tools & Libraries

### Python (Training)
```bash
pip install tensorflow keras scikit-learn numpy pandas scipy matplotlib
pip install firebase-admin
```

### JavaScript/TypeScript (Dashboard)
```bash
npm install firebase @tensorflow/tfjs
```

### Arduino/ESP32 (Edge)
```cpp
// PlatformIO platformio.ini
[env:esp32]
platform = espressif32
board = esp32dev
lib_deps = 
    tensorflow/tensorflow-lite-micro
    firebase/firebase-arduino
```

---

## 📈 Model Performance Metrics

### Training Metrics
- **Accuracy**: % correct predictions
- **Precision**: % anomalies benar dari yang diprediksi anomaly
- **Recall**: % anomalies terdeteksi dari total anomalies
- **F1-Score**: Harmonic mean of precision & recall
- **ROC-AUC**: Area under ROC curve

### Validation Strategy
- **Train/Val/Test Split**: 70% / 15% / 15%
- **Cross-Validation**: 5-fold
- **Time-Based Split**: Chronological untuk time series

---

## 🚀 Implementation Timeline

### Week 1-3: Data Collection ⬅️ **FASE KAMU SEKARANG**
- [ ] Setup hardware sensors
- [ ] Connect ESP32 to Firebase
- [ ] Collect raw sensor data
- [ ] Monitor data quality
- [ ] Target: 100k-500k readings

### Week 4: Data Preprocessing
- [ ] Clean data
- [ ] Feature engineering
- [ ] Normalization
- [ ] Create train/val/test sets

### Week 5-6: Model Training
- [ ] Train Autoencoder
- [ ] Train LSTM
- [ ] Train Isolation Forest
- [ ] Tune hyperparameters
- [ ] Validate models

### Week 7: Model Deployment
- [ ] Convert models (TFLite/ONNX)
- [ ] Deploy to ESP32 or Cloud
- [ ] Integrate with dashboard
- [ ] Test real-time inference

### Week 8: Testing & Documentation
- [ ] End-to-end testing
- [ ] Performance monitoring
- [ ] Write TA documentation
- [ ] Prepare presentation

---

## 📝 Notes untuk Tugas Akhir

### Kontribusi/Novelty:
1. **Ensemble ML approach** (3 models voting)
2. **Real-time edge computing** (jika pakai ESP32 inference)
3. **Cloud-based monitoring** dengan Firebase
4. **Multi-parameter anomaly detection**

### Dataset:
- Original dataset dari hardware sendiri
- 1-3 minggu collection period
- Real industrial environment (foundry)
- Labeled data (normal/abnormal)

### Challenges:
- Sensor noise filtering
- Real-time processing constraints
- Model size optimization (untuk ESP32)
- Threshold tuning

---

## 📚 References

1. Machine Learning for Predictive Maintenance: https://ieeexplore.ieee.org
2. TensorFlow Lite for Microcontrollers: https://tensorflow.org/lite/microcontrollers
3. Autoencoder for Anomaly Detection: arXiv papers
4. LSTM Time Series: Keras documentation
5. Isolation Forest: scikit-learn docs

---

**Last Updated**: January 18, 2026
**Author**: [Your Name]
**Project**: Sistem Monitoring Predictive Maintenance - Tugas Akhir
