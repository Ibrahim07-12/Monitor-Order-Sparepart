# BAB III METODOLOGI PENELITIAN

Bab ini menjelaskan analisis kebutuhan, desain, implementasi, serta metode pengujian dan evaluasi sistem predictive maintenance untuk mendeteksi kerusakan dini pada motor sub mesin shakeout reguler di PT. XYZ.

---

## A. Jenis dan Pendekatan Penelitian

### A.1 Jenis Penelitian
- **Pengembangan (Design and Development Research)**
  - Fokus pada desain dan implementasi sistem IoT + ML terintegrasi
  - Bukan penelitian eksperimental murni, melainkan *action research* terapan

### A.2 Pendekatan Penelitian
- **Mixed Method (Kualitatif + Kuantitatif)**
  - **Kualitatif**: Wawancara dengan teknisi untuk identifikasi gejala kerusakan, analisis temuan di BAB 1
  - **Kuantitatif**: Pengumpulan data sensor, training model ML, evaluasi metrik (precision, recall, lead time deteksi, RUL MAE)

### A.3 Metodologi Pengembangan Sistem
- **Iteratif-Spiral**
  - Fase 1: Analisis kebutuhan (A.2)
  - Fase 2: Desain dan implementasi (B, C)
  - Fase 3: Pengujian unit dan integrasi (D)
  - Fase 4: Validasi lapangan (E)
  - Fase 5: Penyempurnaan berdasarkan hasil uji

---

## B. Analisis Kebutuhan Sistem

### B.1 Kebutuhan Fungsional

#### B.1.1 Akuisisi Data Sensor
- Mengumpulkan 6 parameter sensor per mesin (getaran, akselerasi, suhu, daya, RPM, suara)
- Sampling rate: 1000 Hz untuk getaran/akselerasi, 1 Hz untuk suhu/daya/RPM
- Format: timestamp + nilai dari 3 mesin

#### B.1.2 Preprocessing dan Feature Extraction
- Smoothing data sensor dengan EWMA untuk mengurangi noise
- Normalisasi z-score per sensor
- Ekstraksi fitur domain waktu: RMS, peak, crest factor, kurtosis
- Ekstraksi fitur domain frekuensi: FFT, energi spektral pada band mesin
- Windowing: 5-10 detik dengan overlap 50%

#### B.1.3 Deteksi Anomali dan RUL Estimation
- Implementasi 3 model ML: Autoencoder, LSTM, Isolation Forest
- Ensemble voting untuk keputusan anomali final
- RUL prediction berbasis trajectory LSTM
- Threshold kalibrasyon berdasarkan data normal + simulasi fault

#### B.1.4 Sistem Notifikasi Multi-Channel
- Push notification via Firebase Cloud Messaging (FCM)
- Alert grup Telegram untuk tim maintenance
- Email daily report via Gmail/SMTP
- Catatan: whatsapp Business API memerlukan biaya; alternative gratis terpilih

#### B.1.5 Dashboard dan Logging
- Web dashboard untuk visualisasi real-time (status mesin, anomaly scores, RUL)
- Firestore untuk storage logs dan historical data
- API endpoint untuk query status mesin dan download report

### B.2 Kebutuhan Non-Fungsional

#### B.2.1 Performa
- Latency inferensi < 2 detik (edge: Raspberry Pi)
- Throughput: proses 3 mesin × 6 sensor secara real-time
- Akurasi deteksi: precision ≥ 85%, recall ≥ 80%

#### B.2.2 Keandalan
- Uptime gateway ≥ 95%
- Handling koneksi MQTT intermittent dengan queue buffer
- Data persistence di Firestore untuk audit trail

#### B.2.3 Skalabilitas
- Desain memungkinkan penambahan mesin/sensor di masa depan
- Firmware modular untuk ESP32 dan Raspberry Pi

#### B.2.4 Keamanan
- MQTT dengan username/password
- Firestore rules untuk akses berbasis role (admin, operator, technician)

---

## C. Diagram Alir Penelitian

### C.1 Diagram Alir Umum Penelitian

```
┌─────────────────────────────────────────────────┐
│ START: Analisis Kebutuhan & Review Literatur    │
│ (BAB 1, BAB 2 - Latar Belakang & Pendekatan)   │
└──────────────┬──────────────────────────────────┘
               │
        ┌──────▼──────────────────────────┐
        │ FASE 1: DESAIN SISTEM           │
        │ - Arsitektur IoT                │
        │ - Skenario pengumpulan data     │
        │ - Model ML: AE, LSTM, IF        │
        │ - Rancang notifikasi            │
        └──────┬──────────────────────────┘
               │
        ┌──────▼──────────────────────────┐
        │ FASE 2: IMPLEMENTASI            │
        │ - Setup hardware (ESP32, Pi, Pi)│
        │ - Code firmware & gateway       │
        │ - Setup Firestore               │
        │ - Deploy web dashboard          │
        └──────┬──────────────────────────┘
               │
        ┌──────▼──────────────────────────┐
        │ FASE 3: PERSIAPAN DATA          │
        │ - Baseline normal (2-4 minggu)  │
        │ - Fault injection/simulasi      │
        │ - Labeling dataset              │
        │ - Preprocessing & split         │
        └──────┬──────────────────────────┘
               │
        ┌──────▼──────────────────────────┐
        │ FASE 4: TRAINING & TUNING       │
        │ - Train AE, LSTM, IF            │
        │ - Hyperparameter tuning         │
        │ - Cross-validation              │
        │ - Threshold calibration         │
        └──────┬──────────────────────────┘
               │
        ┌──────▼──────────────────────────┐
        │ FASE 5: EVALUASI LAB            │
        │ - Unit testing (per model)      │
        │ - Integration testing           │
        │ - Offline validation            │
        │ - KPI assessment               │
        └──────┬──────────────────────────┘
               │
        ┌──────▼──────────────────────────┐
        │ FASE 6: VALIDASI LAPANGAN       │
        │ - Deploy ke 3 mesin             │
        │ - Monitoring real-time          │
        │ - User acceptance testing       │
        │ - Analisis false alarm rate     │
        └──────┬──────────────────────────┘
               │
        ┌──────▼──────────────────────────┐
        │ FASE 7: ANALYSIS & CONCLUSION   │
        │ - Evaluasi hasil lapangan       │
        │ - Kalkulasi ROI/manfaat         │
        │ - Rekomendasi lanjutan          │
        │ - Dokumentasi final             │
        └──────┬──────────────────────────┘
               │
        ┌──────▼──────────────────────────┐
        │ END: Laporan Thesis             │
        └────────────────────────────────┘
```

### C.2 Diagram Alir Akuisisi & Pengolahan Data

```
┌─────────────┐
│ ESP32 Nodes │ (3 units, 6 sensor per node)
│ - Sensor    │ Sampling 1000 Hz (vibration)
│   interface │ Sampling 1 Hz (temp, power, RPM)
└──────┬──────┘
       │
       │ MQTT (local network)
       ▼
┌──────────────────────────┐
│ Raspberry Pi 4 (Gateway) │
├──────────────────────────┤
│ ● MQTT Subscriber        │
│ ● Buffer/Queue           │
└──────┬───────────────────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌──────────────────┐          ┌──────────────────┐
│ Preprocessing    │          │ Feature Engine   │
├──────────────────┤          ├──────────────────┤
│ ● EWMA smoothing │          │ ● FFT            │
│ ● Z-score norm   │          │ ● RMS, peak      │
│ ● Windowing      │          │ ● Crest, kurtosis│
└──────┬───────────┘          └────────┬─────────┘
       │                               │
       └───────────────┬───────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │ Feature Vector Ready │
            │ (t, mesin_id, X)     │
            └──────────┬───────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼
  ┌────────┐      ┌────────┐      ┌────────┐
  │ Model  │      │ Model  │      │ Model  │
  │   AE   │      │ LSTM   │      │   IF   │
  └───┬────┘      └───┬────┘      └───┬────┘
      │               │               │
      ▼               ▼               ▼
  ┌─────────────────────────────────────┐
  │ Ensemble Voting / Score Fusion      │
  │ → Anomaly Label (0/1)               │
  │ → Confidence Score (0-100%)         │
  └────────┬────────────────────────────┘
           │
    ┌──────┴──────────────┐
    │                     │
    ▼                     ▼
┌──────────────┐  ┌──────────────┐
│ Notification │  │ Firestore    │
│ Engine       │  │ Logging      │
│ (FCM, TG,    │  │              │
│  Gmail)      │  │              │
└──────────────┘  └──────────────┘
```

---

## D. Tahapan Penelitian (Detailed)

### D.1 Tahap 1: Persiapan dan Setup Hardware (Minggu 1-2)

**Aktivitas:**
- Pembelian/assembly komponen: ESP32 (3), Raspberry Pi 4 (1), sensor (6 per mesin), kabel, power supply
- Setup network: WiFi/LAN untuk MQTT broker
- Mounting sensor pada 3 mesin dengan dokumentasi foto
- Kalibrasi sensor dasar (offset, sensitivity check)

**Output:**
- BOM lengkap dengan harga lokal
- Hardware installation report dengan foto
- Network topology diagram

### D.2 Tahap 2: Development dan Coding (Minggu 2-4)

**Sub-tahap 2A: Firmware ESP32**
- Setup MQTT client library
- Sensor interface (I2C, SPI untuk accelerometer, temperature, power meter)
- Data buffering dan transmission logic
- Error handling dan reconnect mechanism

**Sub-tahap 2B: Gateway Software (Raspberry Pi)**
- MQTT subscriber + queue handler
- Preprocessing pipeline (EWMA, z-score, FFT)
- Model loading (pre-trained AE, LSTM, IF dalam format .h5 atau .pkl)
- Ensemble voting logic
- Notifikasi trigger logic (threshold-based)
- Logging ke Firestore

**Sub-tahap 2C: Cloud & Web**
- Firestore collection schema design (metrics, alerts, logs, RUL)
- Firebase Admin SDK setup
- Web dashboard (React/Vue) untuk visualisasi real-time
- API endpoints untuk query data

**Output:**
- Source code repository (GitHub/GitLab)
- Documentation teknis untuk tiap modul
- Setup guide untuk deployment

### D.3 Tahap 3: Pengumpulan Data Baseline (Minggu 5-8)

**Aktivitas:**
- Jalankan sistem 24/7 pada kondisi normal operasi
- Durasi: 2-4 minggu per mesin (total 3 mesin)
- Log semua sensor data + operator observations (maintenance, anomali spontan, dll)
- Kualitas check: deteksi missing data, outlier extremes

**Kriteria:**
- Minimal 1 bulan data normal per mesin = ~2.6 juta sample (1000 Hz × 3600 detik × 24 jam × 30 hari)
- Variasi operasi: load bervariasi, suhu ruang bervariasi
- Zero labels (semua normal → gunakan untuk AE, IF training)

**Output:**
- Raw dataset: CSV/Parquet dengan timestamp, mesin_id, 6 sensor
- Data quality report
- Statistik deskriptif per sensor per mesin

### D.4 Tahap 4: Persiapan Dataset dan Labeling (Minggu 8-10)

**Aktivitas:**
- Fault injection/simulasi pada test environment atau historis data (jika ada)
  - Vibration anomaly: bearing imbalance, misalignment (simulasi sintetis dengan added harmonics)
  - Temperature rise: electrical fault simulation
  - Power anomaly: phase imbalance atau short winding
- Atau: kumpulkan data kerusakan nyata (jika event terjadi selama monitoring)
- Manual labeling: window mana yang normal (label=0) vs anomali (label=1), dan kapan mulai degradasi RUL

**Data Split:**
- Training: 60% (untuk AE, IF training + LSTM supervised training)
- Validation: 20% (untuk tuning threshold, hyperparameter)
- Testing: 20% (untuk evaluasi final, blind test)

**Output:**
- Labeled dataset (.csv/.h5)
- Labeling guideline document
- Class imbalance analysis (normal vs anomali ratio)

### D.5 Tahap 5: Training Model ML (Minggu 10-12)

**Model 1: Autoencoder (AE)**
- Input: feature vector dari normal data
- Architecture: encoder (3-4 layers), latent dim = 16-32, decoder (mirror)
- Loss: MSE pada reconstruction
- Training: early stopping, batch size 32-64, epoch 100-200
- Output: encoder+decoder model, reconstruction error threshold

**Model 2: LSTM untuk Deteksi Anomali & RUL**
- Input: time series (window 100-200 timesteps)
- Architecture: LSTM layer (64-128 units) + dropout + dense
- Task: 
  - Seq2seq prediction: predict next timestep, anomaly = high prediction error
  - RUL regression: predict remaining timesteps until failure (jika label RUL tersedia)
- Output: LSTM model, RUL estimates

**Model 3: Isolation Forest (IF)**
- Input: feature vector
- Parameters: n_estimators=100, max_samples='auto', contamination=0.05
- Output: IF model, anomaly scores

**Hyperparameter Tuning:**
- Grid search atau random search pada validation set
- Fokus: threshold untuk classify anomali (F1 score, precision/recall balance)

**Output:**
- Trained models (.h5, .pkl)
- Training report (loss curves, training time)
- Hyperparameter log

### D.6 Tahap 6: Evaluasi Lab (Minggu 12-14)

#### D.6.1 Evaluasi Unit (Per Model)
- **Autoencoder**: reconstruction error distribution pada normal data vs fault data
  - Metric: AUC-ROC, optimal threshold
- **LSTM**: prediction error distribution
  - Metric: MSE, MAE pada test set, lead time untuk deteksi
- **Isolation Forest**: anomaly score distribution
  - Metric: decision boundary clarity, false positive rate

#### D.6.2 Evaluasi Integrasi (Ensemble)
- Voting logic test: simulasikan berbagai skenario fault
- Confidence score calibration: apakah 80% confidence benar-benar 80% accuracy?
- Notification trigger test: manual input → cek alert dikirim benar

#### D.6.3 Metrics Utama
- **Deteksi Anomali:**
  - Precision: TP / (TP + FP) — jangan banyak false alarm
  - Recall: TP / (TP + FN) — jangan sampai miss kegagalan
  - F1-score: harmonic mean
  - Lead time: berapa lama sebelum kegagalan terdeteksi

- **RUL Estimation:**
  - MAE (Mean Absolute Error): rata² selisih prediksi vs aktual
  - RMSE: sensitif ke outlier
  - Scoring: accuracy dalam 10% dari RUL sebenarnya

- **False Alarm Rate:**
  - % dari semua alert yang ternyata non-event
  - Target: < 10% untuk operasional acceptable

#### D.6.4 Output
- Evaluation report (.pdf/.md)
- Confusion matrix dan ROC curve per model
- Threshold recommendation
- Performance summary table

### D.7 Tahap 7: Validasi Lapangan (Minggu 15-20)

**Aktivitas:**
- Deploy model terlatih ke Raspberry Pi gateway
- Jalankan sistem pada 3 mesin mesin shakeout, vibrating screen, bucket elevator secara 24/7
- Monitoring real-time: dashboard, logs, user feedback
- Durasi: 4-6 minggu agar capture variasi operasi dan potential early failures

**Protokol Validasi:**
1. **Baseline Tracking:**
   - Catat normal state signature per mesin (baseline sensor readings)
   - Anomaly score pada kondisi normal = harus rendah/konsisten

2. **Event Capture:**
   - Saat alert terbangkun: catat timestamp, mesin, anomaly score
   - Tanyakan ke operator: "Apakah benar ada masalah?"
   - Tindakan maintenance apa yang diambil?

3. **Ground Truth Logging:**
   - Koleksi actual failure events atau maintenance actions
   - Verifikasi apakah deteksi alert lead time mencukupi untuk preemptive action

4. **Feedback Loop:**
   - Jika false alarm tinggi: adjust threshold
   - Jika miss events: improve feature engineering atau model
   - Dokumentasikan semua adjustment

**Output:**
- Field test report
- Anomaly log dengan ground truth
- Performance metrics on real data
- User feedback summary

### D.8 Tahap 8: Analisis Hasil dan Kesimpulan (Minggu 20-22)

**Aktivitas:**
- Compile semua hasil testing (lab + field)
- Hitung ROI: downtime reduction % × maintenance cost savings
- Compare dengan baseline sebelum sistem (jika ada historical data kerusakan)
- Dokumentasikan lessons learned dan limitation

**Output:**
- Final evaluation report
- ROI calculation
- Conclusion dan recommendation untuk deployment di mesin lain

---

## E. Alat dan Bahan

### E.1 Hardware

| No | Komponen | Qty | Spesifikasi | Fungsi | Estimasi Biaya |
|----|----------|-----|-------------|--------|---|
| 1 | ESP32 Microcontroller | 3 | 240 MHz, 8 MB flash, WiFi+BLE | Edge node, sensor interface | IDR 100K × 3 |
| 2 | Raspberry Pi 4 | 1 | 8 GB RAM, 64 GB MicroSD | Gateway, preprocessing, inference | IDR 2M |
| 3 | Accelerometer (MPU6050) | 3 | 3-axis, ±16g | Vibration measurement | IDR 80K × 3 |
| 4 | Temperature Sensor (PT100) | 3 | RTD, -40 to 125°C | Temperature monitoring | IDR 150K × 3 |
| 5 | Power Meter (PZEM-004T) | 3 | Modbus, V/I/P/E | Power & current monitoring | IDR 200K × 3 |
| 6 | Proximity Sensor (Inductive) | 3 | NPN, 4-20mA | RPM/speed measurement | IDR 120K × 3 |
| 7 | Microphone + ADC | 3 | Omnidirectional, 20 Hz-20 kHz | Sound monitoring | IDR 150K × 3 |
| 8 | MQTT Broker (Mosquitto) | 1 | Open-source | Message broker (SW) | Free |
| 9 | Power Supply | 3 | 12V 5A per ESP32 node | Power distribution | IDR 200K |
| 10 | Kabel, Connector, Mounting | 1 | Various | Installation | IDR 500K |
| **Total Hardware Cost** | | | | | **~IDR 8-10 juta** |

### E.2 Software dan Platform

| No | Tools | Lisensi | Fungsi |
|----|-------|---------|--------|
| 1 | Python 3.9+ | Open-source | Development, ML training |
| 2 | TensorFlow/Keras | Open-source | Deep learning (AE, LSTM) |
| 3 | Scikit-learn | Open-source | Isolation Forest, preprocessing |
| 4 | PuPyMQTT / paho-mqtt | Open-source | MQTT client library |
| 5 | Firebase Admin SDK | Free tier | Cloud data & notifications |
| 6 | Firebase Cloud Messaging | Free tier | Push notification service |
| 7 | Telegram Bot API | Free | Messaging service |
| 8 | Gmail/SMTP | Free | Email notifications |
| 9 | React / Vue.js | Open-source | Web dashboard frontend |
| 10 | Node.js / Express | Open-source | Backend API (optional) |
| 11 | Git / GitHub | Free | Version control |
| 12 | VS Code | Free | Code editor |
| 13 | Jupyter Notebook | Open-source | Data exploration & training |

### E.3 Infrastruktur Lab/Testing

- **Lokasi Testing**: Workshop PT. XYZ (3 mesin shakeout, vibrating screen, bucket elevator)
- **Network**: WiFi router atau Ethernet untuk koneksi MQTT
- **Monitoring Tools**: oscilloscope (optional untuk kalibrasi sensor), thermal camera (optional)

---

## F. Lokasi dan Waktu Penelitian

### F.1 Lokasi Penelitian
- **Lokasi Utama**: Fasilitas produksi PT. XYZ (workshop area)
- **Lokasi Secondary**: Lab kampus untuk training model, development, offline testing
- **Alamat**: [sesuai lokasi PT. XYZ yang sesungguhnya]

### F.2 Waktu Penelitian

| Fase | Tahapan | Durasi | Keterangan |
|------|---------|--------|-----------|
| **1** | Persiapan & Setup Hardware | 2 minggu | Procurement, assembly, mounting |
| **2** | Development & Coding | 2 minggu | Firmware, gateway, web backend |
| **3** | Baseline Data Collection | 4 minggu | Normal operation 24/7 |
| **4** | Dataset Prep & Labeling | 2 minggu | Fault injection, manual labeling |
| **5** | Model Training | 2 minggu | AE, LSTM, IF training & tuning |
| **6** | Lab Evaluation | 2 minggu | Unit & integration testing |
| **7** | Field Validation | 6 minggu | Real-time deployment, UAT |
| **8** | Analysis & Conclusion | 2 minggu | Final reporting, ROI calculation |
| **TOTAL** | | **22 minggu (5 bulan)** | |

### F.3 Jadwal Rinci (Gantt Chart Style)

```
Minggu:  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22
────────────────────────────────────────────────────────────────────────
Tahap 1: [========]
Tahap 2:    [========]
Tahap 3:       [================================]
Tahap 4:                    [======]
Tahap 5:                          [======]
Tahap 6:                               [======]
Tahap 7:                                    [========================]
Tahap 8:                                                         [====]
```

---

## G. Rencana Analisis Data dan Pengambilan Keputusan

### G.1 Metode Analisis Hasil

**Pada tahap lab (D.6):**
- Confusion matrix untuk setiap model
- ROC-AUC curve untuk threshold optimization
- Comparison antara 3 model: AE vs LSTM vs IF

**Pada tahap field (D.7):**
- Time-series plot: sensor reading + anomaly score timeline
- Alert correlation: kapan alert terbangkun vs actual maintenance event
- Lead time analysis: berapa hari/jam sebelum failure predicted
- False alarm rate per mesin

### G.2 Kriteria Keberhasilan (Success Criteria)

**Harus tercapai:**
1. Precision ≥ 85% pada lab testing
2. Recall ≥ 80% pada lab testing
3. Lead time deteksi ≥ 7 hari sebelum kegagalan terduga
4. False alarm rate < 10% pada field testing
5. System uptime ≥ 95% selama field trial

**Akan diklaim sebagai novel/benefit:**
1. End-to-end real IoT+ML system di industri lokal PT. XYZ
2. Multi-sensor fusion + ensemble ML approach
3. RUL prediction terintegrasi dengan sistem notifikasi
4. Free/low-cost notification architecture (FCM + Telegram + Gmail)

---

## H. Kemungkinan Risiko dan Mitigasi

| Risiko | Probabilitas | Dampak | Mitigasi |
|--------|-------------|--------|----------|
| Hardware failure (sensor, ESP32) | Medium | High | Procure 20% spare parts, redundant power supply |
| Network instability (MQTT) | Medium | High | Implement local queue, graceful degradation |
| Label scarcity (few real failures) | High | Medium | Use fault injection + synthetic data, semi-supervised AE/IF |
| Model overfitting (small dataset) | Medium | Medium | Cross-validation, regularization, early stopping |
| False alarm tinggi field | Medium | High | Iterative threshold tuning via feedback |
| Operator adoption | Medium | Medium | Training, clear UI, easy alert management |
| Time constraint | Low | High | Prioritize core features, extend if needed |

---

## Kesimpulan Metodologi

Metodologi penelitian ini dirancang dengan pendekatan iteratif-spiral yang menggabungkan:
- **Analisis kebutuhan** mendalam (fungsional & non-fungsional)
- **Implementasi praktis** IoT + ML dengan arsitektur edge-gateway-cloud
- **Evaluasi rigorous** melalui lab testing + field validation
- **Dokumentasi detail** untuk reproducibility

Timeline 22 minggu memungkinkan persiapan matang, training data berkualitas, dan validasi lapangan yang cukup sebelum deployment production.

