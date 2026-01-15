# Diagram Flowchart Skripsi

Berikut tiga flowchart sederhana (Mermaid) yang dapat langsung dimasukkan ke laporan:
- Operasional sistem (IoT → Gateway → ML → Notifikasi/Logging)
- Alur data & pelatihan model (IF, AE, LSTM)
- Metodologi penelitian (tahapan proyek)

Catatan: Render dengan VS Code (Mermaid extension) atau Mermaid Live Editor, lalu ekspor ke PNG/SVG.

---

## 1) Flowchart Operasional Sistem (Realtime)

```mermaid
flowchart LR
    subgraph Edge[Edge: ESP32 Nodes]
        S1[Sensor Getaran] --> ESP32
        S2[Sensor Suhu] --> ESP32
        S3[Sensor Daya/RPM/Suara] --> ESP32
    end

    ESP32 -->|MQTT Publish| MQTT[(Broker MQTT: Mosquitto)]
    MQTT -->|Subscribe| RPi[Gateway: Raspberry Pi]

    RPi --> PRE[Preprocessing: EWMA, z-score, windowing]
    PRE --> FE[Feature Extraction: RMS, crest, FFT]

    FE --> AE[Model AE]
    FE --> LSTM[Model LSTM]
    FE --> IF[Model Isolation Forest]

    AE --> ENS[Ensemble Voting]
    LSTM --> ENS
    IF --> ENS

    ENS --> DEC{Anomali?}
    DEC -- Ya --> NOTIF[Notifikasi: FCM, Telegram, Email]
    DEC -- Tidak --> LOG[Logging: Firestore]
    NOTIF --> LOG

    LOG --> DASH[Dashboard Web (React/Firestore)]
```

---

## 2) Flowchart Alur Data & Pelatihan Model (Offline)

```mermaid
flowchart TD
    RAW[Data Mentah (normal + anomali/simulasi)] --> PREP[Preprocessing: EWMA, z-score]
    PREP --> WIN[Windowing (5–10s, overlap 25–50%)]
    WIN --> FE[Feature Engineering (waktu + frekuensi)]

    FE --> SPLIT{Train / Val / Test}

    subgraph Train AE
        TAE[Fit AE pada data normal]
        TAE --> EAE[Hitung error rekonstruksi]
        EAE --> THAE[Tentukan threshold dari distribusi error]
    end

    subgraph Train IF
        TIF[Fit Isolation Forest pada data normal]
        TIF --> SIF[Skor outlier (decision_function)]
        SIF --> THIF[Kalibrasi threshold (ROC/percentile)]
    end

    subgraph Train LSTM
        TLSTM_A[Deteksi: prediksi langkah depan] --> RLSTM_A[Residual error]
        RLSTM_A --> THLSTM[Threshold residual]
        TLSTM_B[RUL: regresi remaining life] --> MLSTM_B[Model RUL]
    end

    SPLIT --> TAE
    SPLIT --> TIF
    SPLIT --> TLSTM_A
    SPLIT --> TLSTM_B

    THAE --> EVAL[Evaluasi: ROC, PR, F1, MAE/RMSE RUL]
    THIF --> EVAL
    THLSTM --> EVAL
    MLSTM_B --> EVAL

    EVAL --> CAL[Kalibrasi: target recall ≥80%, FAR <10%]
    CAL --> SAVE[Simpan artefak: model, scaler, threshold]
```

---

## 3) Flowchart Metodologi Penelitian (Tahapan)

```mermaid
flowchart TD
    A[Analisis Kebutuhan & Kajian Pustaka (BAB 1–2)] --> B[Desain Sistem: Arsitektur IoT, Model ML, Notifikasi]
    B --> C[Implementasi: Firmware ESP32, Gateway Pi, Firestore, Dashboard]
    C --> D[Pengumpulan Data Baseline (2–4 minggu)]
    D --> E[Persiapan Dataset & Labeling (train/val/test)]
    E --> F[Pelatihan & Tuning: AE, IF, LSTM]
    F --> G[Evaluasi Lab: unit & integrasi, KPI]
    G --> H[Validasi Lapangan: 3 mesin, UAT, feedback]
    H --> I[Analisis Hasil & ROI]
    I --> J[Kesimpulan & Rekomendasi]
```

---

## Ekspor Diagram ke PNG/SVG (opsional)

Jika ingin mengekspor diagram menjadi gambar tanpa tool grafis:

1) Install Mermaid CLI (butuh Node.js):

```powershell
npm install -g @mermaid-js/mermaid-cli
```

2) Simpan salah satu diagram ke file `diagram.mmd`, lalu:

```powershell
mmdc -i diagram.mmd -o diagram.png
mmdc -i diagram.mmd -o diagram.svg
```

Atau gunakan Mermaid Live Editor (https://mermaid.live) untuk paste diagram lalu export PNG/SVG.
