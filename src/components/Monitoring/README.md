# Monitoring System

Folder ini berisi komponen-komponen untuk sistem monitoring real-time mesin.

## Komponen:

1. **MonitoringPage.jsx** - Main container untuk monitoring system
2. **MonitoringSidebar.jsx** - Sidebar menu dengan daftar komponen/aktuator
3. **MonitoringDashboard.jsx** - Dashboard dengan gauge meters dan grafik
4. **MonitoringThreshold.jsx** - Setting threshold untuk setiap parameter

## Fitur:

- Real-time monitoring 5 parameter (Vibration, Temperature, Current, Power, Noise)
- Gauge meters berbentuk speedometer
- Grafik tren gabungan dengan filter Daily/Weekly/Monthly
- Tooltip interaktif pada grafik
- Warning notifikasi berkedip setiap 2 detik
- Sidebar dapat disembunyikan/ditampilkan
- Manajemen komponen/aktuator (tambah/hapus)
- Setting threshold per parameter

## Parameter yang dimonitor:

1. **Vibration** - Intensitas Getaran (m/s²)
2. **Temperature** - Suhu Mesin (°C)
3. **Current** - Arus Listrik (A)
4. **Power** - Daya Listrik (W)
5. **Noise** - Tingkat Kebisingan (dB)
