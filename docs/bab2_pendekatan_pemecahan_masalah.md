BAB II. PENDEKATAN PEMECAHAN MASALAH

Berisi teori dan temuan-temuan yang dapat dijadikan acuan untuk mengembangkan konsep pemecahan masalah di bidang ilmu terapan yang menjadi fokus kajian/pengembangan.

2.1 Pendahuluan

Bab ini menyajikan pendekatan pemecahan masalah yang digunakan untuk merancang sistem predictive maintenance pada motor sub mesin shakeout reguler di PT. XYZ. Pendekatan disusun berdasarkan teori dasar dan temuan-temuan yang relevan pada bidang diagnostik getaran, pemantauan kondisi, dan pembelajaran mesin untuk deteksi anomali serta estimasi sisa masa pakai (RUL). Tujuan bab ini adalah menyediakan landasan teoretis yang dapat dijadikan acuan secara praktis untuk implementasi, validasi lapangan, dan pengambilan keputusan perawatan.

2.2 Relevansi Metode dengan Masalah Lapangan

Permasalahan utama di lapangan adalah terjadinya kegagalan atau penurunan performa mesin yang berdampak pada produksi, namun sinyal peringatan seringkali samar dan tersebar di dimensi waktu dan frekuensi. Oleh karena itu pendekatan yang dipilih harus mampu:
- mendeteksi pola abnormal pada sinyal getaran, suara, dan parameter listrik,
- bekerja dengan data berlabel sangat terbatas (few labeled failures),
- menghasilkan indikasi yang dapat ditindaklanjuti oleh tim pemeliharaan (tingkat kepercayaan, estimasi RUL, dan rekomendasi tindakan).

2.3 Landasan Teoretis Metode Pembelajaran Mesin

2.3.1 Autoencoder (AE) untuk Deteksi Anomali

Autoencoder adalah jaringan saraf yang belajar merekonstruksi input melalui representasi berdimensi lebih rendah. Pada kondisi normal, model yang dilatih hanya dengan data sehat akan merekonstruksi sinyal normal dengan baik; anomali terlihat dari kenaikan error rekonstruksi. Kelebihan AE adalah mampu bekerja tanpa label anomali dan menangkap pola non-linier multivariat. Keterbatasan: memerlukan representasi fitur yang memadai dan rentan terhadap overfitting bila data normal tidak merepresentasikan variasi operasional.

2.3.2 LSTM dan LSTM-Autoencoder untuk Pola Temporal

LSTM (Long Short-Term Memory) dirancang untuk menangkap ketergantungan temporal jangka panjang dalam deret waktu. Untuk tugas deteksi, LSTM-autoencoder menggabungkan kekuatan pemodelan urutan LSTM dengan prinsip rekonstruksi autoencoder — cocok bila anomali muncul sebagai deviasi urutan temporal. LSTM juga dapat dipakai untuk memprediksi sinyal berikutnya dan menghitung residual sebagai indikator anomali. Kelebihan: pemodelan urutan yang kuat; kelemahan: membutuhkan data urutan cukup panjang dan komputasi lebih tinggi dibanding model statis.

2.3.3 Isolation Forest untuk Deteksi Anomali Non-Parametrik

Isolation Forest adalah metode berbasis pohon yang mengisolasi observasi outlier lebih cepat daripada observasi normal. Metode ini bagus untuk fitur berdimensi menengah dan relatif ringan secara komputasi — berguna sebagai baseline atau komponen ensemble ketika label anomali minim. Keterbatasan: kurang sensitif terhadap anomali yang hanya terlihat pada pola temporal halus tanpa fitur yang jelas.

2.4 Rekayasa Fitur dan Pra-pemrosesan (Praktis)

2.4.1 Tipe Fitur yang Direkomendasikan
- Domain waktu: mean, RMS, puncak, crest factor, kurtosis, skewness pada window waktu.
- Domain frekuensi: spektrum daya (FFT) untuk band frekuensi mesin, energi pada harmonik kritis.
- Temperatur dan arus: statistik agregat (mean, slope) untuk korelasi kondisi termal dan beban.
- Fitur turunan: fitur berubah waktu (delta, rolling std) dan fitur halus seperti envelope demodulation jika diperlukan.

2.4.2 Pra-pemrosesan yang Disarankan
- Smoothing: EWMA untuk mengurangi noise high-frequency sambil mempertahankan tren.
- Normalisasi: z-score per sensor atau per mesin agar model lebih stabil terhadap perbedaan skala.
- Windowing: gunakan jendela t (~1-10 detik tergantung sampling) dengan overlap 25-50% untuk menangkap transien.
- FFT: ambil magnitudo spektrum dan energi dalam rentang frekuensi mesin sebagai fitur frekuensi.

Praktik arsitektural: sesuai kebijakan proyek, ESP32 bertugas hanya mengakuisisi dan mengirim data mentah (atau agregat ringan). Semua pra-pemrosesan intensif dan ekstraksi fitur dijalankan di Raspberry Pi (gateway) sebelum inferensi model.

2.5 Strategi Pelatihan, Validasi, dan Evaluasi

2.5.1 Sumber Data dan Label
Karena kegagalan nyata jarang, kombinasi data berikut direkomendasikan: data operasi normal historis, data simulasi/gabungan (fault injection atau data sintetis), serta sebagian kecil kejadian nyata jika tersedia. Pendekatan semi-supervised (AE, IF) dan supervised (LSTM untuk RUL bila tersedia label) bisa digabung.

2.5.2 Pembagian Data dan Validasi
- Gunakan skema waktu-tergantung: data pelatihan dari periode awal, validasi lintas-waktu, dan pengujian pada periode terpisah untuk mengukur generalisasi.
- Evaluasi metrik: deteksi anomali — precision, recall, F1, false alarm rate; RUL estimasi — MAE/RMSE; deteksi dini — lead time (waktu antara deteksi dan kegagalan).

2.5.3 Thresholding dan Kalibrasi
Kalibrasi threshold anomaly score pada data validasi penting untuk mengendalikan trade-off antara false alarm dan missed detection. Teknik adaptif (mis. percentile rolling atau EWMA pada score) direkomendasikan untuk menyesuaikan dengan drift operasional.

2.6 Implementasi dan Integrasi Sistem (Praktis)

2.6.1 Pembagian Tanggung Jawab Perangkat
- ESP32: akuisisi sensor, timestamp, pengiriman via MQTT (payload ringkas, format JSON), mekanisme retry dasar.
- Raspberry Pi (gateway): buffering, pra-pemrosesan (EWMA, normalisasi, FFT), ekstraksi fitur, inferensi model (AE/LSTM/IF), penyimpanan ke Firestore, logging, dan orkestrasi notifikasi (Telegram/Email/FCM).

2.6.2 Inferensi Real-Time dan Batch
Inferensi kritis (deteksi anomali langsung) harus berjalan near-real-time pada gateway dengan pipeline ringan (feature extraction → model → scoring). Untuk analisis lebih mendalam dan retraining, simpan batch data ke cloud/Firestore untuk pelatihan ulang terjadwal.

2.6.3 Ensemble dan Keputusan Tindakan
Gabungkan skor dari beberapa model (mis. rata-rata bobot atau voting) untuk stabilitas. Tetapkan aturan operasi: jika skor > threshold1 → peringatan; jika skor > threshold2 dan berulang → perintah inspeksi/stop dan estimasi RUL.

2.7 Evaluasi Lapangan dan Indikator Keberhasilan

Indikator utama:
- Penurunan frekuensi kerusakan tak terduga (%),
- Lead time rata-rata untuk deteksi dini (jam/hari),
- False alarm rate yang dapat diterima oleh tim pemeliharaan,
- Keandalan estimasi RUL (MAE/RMSE pada kasus berlabel).

Evaluasi lapangan harus mencakup pengujian A/B atau pilot pada beberapa mesin sebelum penggelaran penuh.

2.8 Keterbatasan dan Rekomendasi Lanjutan

Keterbatasan praktis meliputi keterbatasan label kegagalan, variasi kondisi operasi, dan keterbatasan komputasi pada gateway. Rekomendasi: mulai dengan solusi semi-supervised (AE + IF), gunakan ensemble, kumpulkan lebih banyak data kegagalan untuk model supervised (LSTM untuk RUL), dan buat pipeline retraining terjadwal berbasis batch yang memanfaatkan data cloud.

Penutup singkat: kerangka ini menempatkan teori metode (AE, LSTM, IF), praktek rekayasa fitur dan pra-pemrosesan, strategi pelatihan dan validasi, serta panduan implementasi yang langsung dapat diterapkan untuk menyelesaikan masalah pemeliharaan prediktif di PT. XYZ.