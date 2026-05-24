import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { updateGlobalWarning } from "../../globalWarnings";
import { db } from "../../firebase";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import {
  formatVibrationValue,
  formatNumberWithSuffix,
  generateChartData,
  generateWeeklyBarData,
  generateSensorData,
  calculateArcConfig,
  PARAMETERS_CONFIG,
  DEFAULT_THRESHOLDS,
} from "./utils/chartUtils";
import "./MonitoringDashboard.css";

const MOTOR_MAPPING = {
  "Motor Mainshakeout": "motor_main_shakeout",
  "Motor Sand Crusher": "motor_sand_crusher",
  "Shakeout Reguler": "motor_main_shakeout",
};

const formatDateKey = (dateInput) => {
  const date = new Date(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDaysToDateKey = (dateKey, dayOffset) => {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + dayOffset);
  return formatDateKey(date);
};

const buildEmptyChartData = (timeFilter, selectedDate) => {
  if (timeFilter === "daily") {
    return Array.from({ length: 24 }, (_, hour) => ({
      label: `${hour}:00`,
      vibration: 0,
      temperature: 0,
      power: 0,
      noise: 0,
    }));
  }

  if (timeFilter === "weekly") {
    return Array.from({ length: 7 }, (_, idx) => {
      const dateKey = addDaysToDateKey(selectedDate, -(6 - idx));
      return {
        label: new Date(`${dateKey}T00:00:00`).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
        }),
        vibration: 0,
        temperature: 0,
        power: 0,
        noise: 0,
      };
    });
  }

  return Array.from({ length: 7 }, (_, idx) => {
    const dateKey = addDaysToDateKey(selectedDate, -(6 - idx));
    return {
      label: new Date(`${dateKey}T00:00:00`).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
      }),
      vibration: 0,
      temperature: 0,
      power: 0,
      noise: 0,
    };
  });
};

const averageValidValues = (values = []) => {
  const validValues = values.filter(
    (value) => typeof value === "number" && !Number.isNaN(value) && value >= 0,
  );
  if (!validValues.length) return 0;
  return Number(
    (
      validValues.reduce((sum, value) => sum + value, 0) / validValues.length
    ).toFixed(2),
  );
};

const isSameMotor = (data, motorKey) => {
  return data?.subMotorId === motorKey || data?.motorId === motorKey;
};

const getPowerFromPhase = (phase = {}) => {
  const pr = Number(phase?.R?.power ?? 0);
  const ps = Number(phase?.S?.power ?? 0);
  const pt = Number(phase?.T?.power ?? 0);
  return pr + ps + pt;
};

const extractSensorMetrics = (data = {}) => {
  const params = data.parameters || {};
  return {
    vibration: Number(params.vibration ?? data.vibration ?? 0),
    temperature: Number(params.temperature ?? data.temperature ?? 0),
    power: Number(params.power ?? getPowerFromPhase(data.phase)),
    noise: Number(params.noise ?? data.noise ?? 0),
  };
};

const downloadExcelFile = (filename, rows, sheetName = "History") => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
};

const MonitoringDashboard = ({ selectedMotor, selectedSubMotor }) => {
  const [sensorData, setSensorData] = useState({
    vibration: 4.5,
    temperature: 65.0,
    power: 1230.0,
    noise: 75.5,
  });

  const [timeFilter, setTimeFilter] = useState("daily");
  const [chartData, setChartData] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  ); // Format: YYYY-MM-DD untuk grafik historis

  // State untuk bar charts individual (7 hari)
  const [barChartDate, setBarChartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [barChartData, setBarChartData] = useState([]);
  const [historyMilestones, setHistoryMilestones] = useState([]);
  const [selectedHistoryMarker, setSelectedHistoryMarker] = useState("");

  // Load thresholds from Firestore with real-time sync
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  useEffect(() => {
    const thresholdsRef = doc(db, "monitoringSettings", "thresholds");

    const unsubscribe = onSnapshot(
      thresholdsRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setThresholds(data);
          console.log(
            "[MonitoringDashboard] Loaded/Updated thresholds from Firestore:",
            data,
          );
        }
      },
      (error) => {
        console.error("Failed to load thresholds from Firestore:", error);
      },
    );

    return () => unsubscribe();
  }, []);

  // Data source mode: 'firebase' or 'dummy'
    const [dataSource, setDataSource] = useState("dummy");
  const [mlStatus, setMlStatus] = useState(null); // ML prediction status

  // Base data dari Firebase (update setiap 30 detik)
  const [baseData, setBaseData] = useState(null);
  const [lastDataTimestamp, setLastDataTimestamp] = useState(null);
  const [currentMotorKey, setCurrentMotorKey] = useState(null);
  const activeMotorKey = MOTOR_MAPPING[selectedSubMotor] || "";

  // Subscribe ke Firebase (data update setiap 30 detik dari hardware)
  useEffect(() => {
    const loadHistoryMilestones = async () => {
      if (!activeMotorKey) {
        setHistoryMilestones([]);
        return;
      }

      try {
        const startWindow = Date.now() - 14 * 24 * 60 * 60 * 1000;
        const snapshot = await getDocs(
          query(
            collection(db, "sensorReadings"),
            where("timestampMs", ">=", startWindow),
            orderBy("timestampMs", "asc"),
          ),
        );

        const dateSet = new Set();
        snapshot.forEach((docItem) => {
          const item = docItem.data();
          if (!isSameMotor(item, activeMotorKey)) return;
          const ts = Number(item.timestampMs);
          if (!Number.isFinite(ts)) return;
          dateSet.add(formatDateKey(ts));
        });

        const sortedDates = Array.from(dateSet).sort((a, b) =>
          a.localeCompare(b),
        );

        if (!sortedDates.length) {
          setHistoryMilestones([]);
          return;
        }

        setHistoryMilestones(
          sortedDates.map((dateKey, index) => ({
            dayNumber: index + 1,
            targetDate: dateKey,
            available: true,
          })),
        );
      } catch (error) {
        console.error(
          "[MonitoringDashboard] Failed to load milestone dates:",
          error,
        );
        setHistoryMilestones([]);
      }
    };

    loadHistoryMilestones();
  }, [activeMotorKey]);

  useEffect(() => {
    const activeMarker = historyMilestones.find(
      (item) => item.available && item.targetDate === selectedDate,
    );
    setSelectedHistoryMarker(
      activeMarker ? String(activeMarker.dayNumber) : "",
    );
  }, [historyMilestones, selectedDate]);

  useEffect(() => {
    const motorMapping = {
      "Motor Mainshakeout": "motor_main_shakeout",
      "Motor Sand Crusher": "motor_sand_crusher",
      // Fallback mappings (legacy names)
      "Shakeout Reguler": "motor_main_shakeout",
    };

    const motorKey = motorMapping[selectedSubMotor] || "";

    // Reset saat ganti motor
    if (motorKey !== currentMotorKey) {
      setCurrentMotorKey(motorKey);
      setBaseData(null);
      setLastDataTimestamp(null);
      setDataSource("dummy");
      console.log(`[MonitoringDashboard] Switched to motor: ${motorKey}`);
    }

    if (motorKey) {
      // Function to fetch and update sensor data
      const fetchLatestSensorData = async () => {
        try {
          const sensorQuery = query(
            collection(db, "sensorReadings"),
            orderBy("timestampMs", "desc"),
            limit(20),
          );

          const snapshot = await getDocs(sensorQuery);
          if (!snapshot.empty) {
            const latestDoc = snapshot.docs
              .map((docItem) => docItem.data())
              .find((item) => isSameMotor(item, motorKey));

            if (!latestDoc) {
              setDataSource("dummy");
              setBaseData(null);
              return;
            }

            const metrics = extractSensorMetrics(latestDoc);
            const docTimestamp = latestDoc.timestampMs;

            // Cek apakah data masih fresh (dalam 2 menit terakhir)
            const now = Date.now();
            const dataAge = now - docTimestamp;
            const maxAge = 2 * 60 * 1000; // 2 menit

            if (dataAge > maxAge) {
              console.log(
                `[MonitoringDashboard] ⚠️ Data terlalu lama (${Math.round(dataAge / 1000)}s), hardware mungkin off`,
              );
              setDataSource("offline");
              setBaseData(null);
              return;
            }

            if (Number.isFinite(metrics.vibration)) {
              setDataSource("firebase");
              setLastDataTimestamp(docTimestamp);
              // Simpan sebagai base data dengan motorKey
              setBaseData({
                motorKey: motorKey,
                vibration: metrics.vibration,
                temperature: metrics.temperature,
                power: metrics.power,
                noise: metrics.noise,
              });

              // Set ML status if available
              if (latestDoc.mlPrediction) {
                setMlStatus({
                  status: latestDoc.status,
                  isWarning: latestDoc.isWarning,
                  prediction: latestDoc.mlPrediction,
                });
              }

              console.log(
                `[MonitoringDashboard] 🔥 Data dari Firebase [${motorKey}]:`,
                metrics,
              );
              return;
            }
          }

          // Jika tidak ada data real dari Firebase, gunakan dummy
          console.log("[MonitoringDashboard] No Firebase data, using dummy");
          setDataSource("dummy");
          setBaseData(null);
        } catch (error) {
          console.warn("[MonitoringDashboard] Firebase fetch error:", error);
          setDataSource("dummy");
          setBaseData(null);
        }
      };

      // Fetch immediately on mount
      fetchLatestSensorData();

      // Setup 2-second polling for real-time gauge updates
      // This ensures gauge updates every 2s to match ESP32 sensor read interval
      const pollInterval = setInterval(() => {
        fetchLatestSensorData();
      }, 2000); // 2 second polling for real-time dashboard

      return () => clearInterval(pollInterval);
    }

    // Fallback: gunakan dummy data
    setDataSource("dummy");
    setBaseData(null);
  }, [selectedSubMotor, currentMotorKey]);

  // Tampilkan data dari Firebase (TANPA variasi tambahan)
  // Hanya update ketika ada data baru dari Firebase
  useEffect(() => {
    // Pastikan baseData sesuai dengan motor yang sedang ditampilkan
    const motorMapping = {
      "Motor Mainshakeout": "motor_main_shakeout",
      "Motor Sand Crusher": "motor_sand_crusher",
      "Shakeout Reguler": "motor_main_shakeout",
    };
    const expectedMotorKey = motorMapping[selectedSubMotor] || "";

    if (
      dataSource === "firebase" &&
      baseData &&
      baseData.motorKey === expectedMotorKey
    ) {
      // Cek apakah data masih fresh (dalam 2 menit terakhir)
      if (lastDataTimestamp) {
        const now = Date.now();
        const dataAge = now - lastDataTimestamp;
        const maxAge = 2 * 60 * 1000; // 2 menit

        if (dataAge > maxAge) {
          console.log(
            `[MonitoringDashboard] Data expired (${Math.round(dataAge / 1000)}s old), switching to offline`,
          );
          setDataSource("offline");
          return;
        }
      }

      // Tampilkan data langsung dari Firebase - TANPA variasi
      setSensorData({
        vibration: baseData.vibration,
        temperature: baseData.temperature,
        power: baseData.power,
        noise: baseData.noise,
      });

      // Deteksi abnormal
      const abnormalParams = [];
      Object.keys(baseData).forEach((key) => {
        if (key === "motorKey") return;
        const value = baseData[key];
        const threshold = thresholds[key];
        if (threshold && (value < threshold.min || value > threshold.max)) {
          abnormalParams.push(key);
        }
      });

      if (selectedSubMotor) {
        updateGlobalWarning(selectedSubMotor, abnormalParams);
      }
    }
  }, [baseData, dataSource, selectedSubMotor, thresholds, lastDataTimestamp]);

  // Offline/Dummy mode - hardware tidak aktif, tampilkan 0 dan STOP
  useEffect(() => {
    if (dataSource === "offline" || dataSource === "dummy") {
      // Tampilkan nilai 0 - tidak ada generator dummy
      setSensorData({
        vibration: 0,
        temperature: 0,
        power: 0,
        noise: 0,
      });

      // Clear warnings
      if (selectedSubMotor) {
        updateGlobalWarning(selectedSubMotor, []);
      }

      console.log("[MonitoringDashboard] Hardware OFF - data = 0, stopped");
    }
  }, [dataSource, selectedSubMotor]);

  // Generate chart data berdasarkan timeFilter (grafik historis) dari Firestore
  useEffect(() => {
    const loadChartDataFromFirestore = async () => {
      if (!activeMotorKey) {
        setChartData(buildEmptyChartData(timeFilter, selectedDate));
        return;
      }

      try {
        if (timeFilter === "daily") {
          const dayStart = new Date(`${selectedDate}T00:00:00`).getTime();
          const dayEnd = new Date(`${selectedDate}T23:59:59.999`).getTime();

          const dailyQuery = query(
            collection(db, "sensorReadings"),
            where("subMotorId", "==", activeMotorKey),
            where("timestampMs", ">=", dayStart),
            where("timestampMs", "<=", dayEnd),
            orderBy("timestampMs", "asc"),
          );

          const snapshot = await getDocs(dailyQuery);
          const hourlyBuckets = Array.from({ length: 24 }, (_, hour) => ({
            label: `${hour}:00`,
            vibration: [],
            temperature: [],
            power: [],
            noise: [],
          }));

          snapshot.forEach((docItem) => {
            const data = docItem.data();
            if (!isSameMotor(data, activeMotorKey)) return;

            const metrics = extractSensorMetrics(data);
            const hour = new Date(data.timestampMs).getHours();

            if (hour < 0 || hour > 23) return;

            hourlyBuckets[hour].vibration.push(metrics.vibration);
            hourlyBuckets[hour].temperature.push(metrics.temperature);
            hourlyBuckets[hour].power.push(metrics.power);
            hourlyBuckets[hour].noise.push(metrics.noise);
          });

          setChartData(
            hourlyBuckets.map((bucket) => ({
              label: bucket.label,
              vibration: averageValidValues(bucket.vibration),
              temperature: averageValidValues(bucket.temperature),
              power: averageValidValues(bucket.power),
              noise: averageValidValues(bucket.noise),
            })),
          );
          return;
        }

        const weekStart = new Date(`${addDaysToDateKey(selectedDate, -6)}T00:00:00`).getTime();
        const weekEnd = new Date(`${selectedDate}T23:59:59.999`).getTime();
        const weeklyQuery = query(
          collection(db, "sensorReadings"),
          where("timestampMs", ">=", weekStart),
          where("timestampMs", "<=", weekEnd),
          orderBy("timestampMs", "asc"),
        );

        const weeklySnapshot = await getDocs(weeklyQuery);
        const weeklyMap = new Map(
          Array.from({ length: 7 }, (_, idx) => {
            const dateKey = addDaysToDateKey(selectedDate, -(6 - idx));
            return [
              dateKey,
              { vibration: [], temperature: [], power: [], noise: [] },
            ];
          }),
        );

        weeklySnapshot.forEach((docItem) => {
          const data = docItem.data();
          if (!isSameMotor(data, activeMotorKey)) return;

          const dateKey = formatDateKey(data.timestampMs);
          const bucket = weeklyMap.get(dateKey);
          if (!bucket) return;

          const metrics = extractSensorMetrics(data);
          bucket.vibration.push(metrics.vibration);
          bucket.temperature.push(metrics.temperature);
          bucket.power.push(metrics.power);
          bucket.noise.push(metrics.noise);
        });

        const weeklyData = Array.from({ length: 7 }, (_, idx) => {
          const dateKey = addDaysToDateKey(selectedDate, -(6 - idx));
          const bucket = weeklyMap.get(dateKey) || {
            vibration: [],
            temperature: [],
            power: [],
            noise: [],
          };

          return {
            label: new Date(`${dateKey}T00:00:00`).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "2-digit",
            }),
            vibration: averageValidValues(bucket.vibration),
            temperature: averageValidValues(bucket.temperature),
            power: averageValidValues(bucket.power),
            noise: averageValidValues(bucket.noise),
          };
        });

        setChartData(weeklyData);
      } catch (error) {
        console.error(
          "[MonitoringDashboard] Failed to load chart data:",
          error,
        );
        setChartData(buildEmptyChartData(timeFilter, selectedDate));
      }
    };

    loadChartDataFromFirestore();
  }, [timeFilter, selectedDate, activeMotorKey]);

  // Generate bar chart data (7 hari) langsung dari raw sensorReadings
  useEffect(() => {
    const loadBarChartDataFromFirestore = async () => {
      if (!activeMotorKey) {
        setBarChartData([]);
        return;
      }

      try {
        const rangeStart = new Date(`${addDaysToDateKey(barChartDate, -6)}T00:00:00`).getTime();
        const rangeEnd = new Date(`${barChartDate}T23:59:59.999`).getTime();
        const rawQuery = query(
          collection(db, "sensorReadings"),
          where("timestampMs", ">=", rangeStart),
          where("timestampMs", "<=", rangeEnd),
          orderBy("timestampMs", "asc"),
        );

        const rawSnapshot = await getDocs(rawQuery);
        const weeklyMap = new Map(
          Array.from({ length: 7 }, (_, idx) => {
            const dateKey = addDaysToDateKey(barChartDate, -(6 - idx));
            return [
              dateKey,
              { vibration: [], temperature: [], power: [], noise: [] },
            ];
          }),
        );

        rawSnapshot.forEach((docItem) => {
          const data = docItem.data();
          if (!isSameMotor(data, activeMotorKey)) return;

          const dateKey = formatDateKey(data.timestampMs);
          const bucket = weeklyMap.get(dateKey);
          if (!bucket) return;

          const metrics = extractSensorMetrics(data);
          bucket.vibration.push(metrics.vibration);
          bucket.temperature.push(metrics.temperature);
          bucket.power.push(metrics.power);
          bucket.noise.push(metrics.noise);
        });

        const weeklyPoints = Array.from({ length: 7 }, (_, idx) => {
          const dateKey = addDaysToDateKey(barChartDate, -(6 - idx));
          const bucket = weeklyMap.get(dateKey) || {
            vibration: [],
            temperature: [],
            power: [],
            noise: [],
          };

          return {
            label: new Date(`${dateKey}T00:00:00`).toLocaleDateString("id-ID", {
              weekday: "short",
            }),
            date: dateKey,
            vibration: averageValidValues(bucket.vibration),
            temperature: averageValidValues(bucket.temperature),
            power: averageValidValues(bucket.power),
            noise: averageValidValues(bucket.noise),
          };
        });

        setBarChartData(weeklyPoints);
      } catch (error) {
        console.error(
          "[MonitoringDashboard] Failed to load bar chart data:",
          error,
        );
        setBarChartData([]);
      }
    };

    loadBarChartDataFromFirestore();
  }, [barChartDate, activeMotorKey]);

  const exportHistoryExcel = () => {
    const rows = [
      ["Motor", selectedSubMotor || "-"],
      ["Mode Grafik", timeFilter],
      ["Tanggal Referensi", selectedDate],
      [],
      ["Marker Hari", "Tanggal", "Tersedia"],
      ...historyMilestones.map((item) => [
        `Hari ${item.dayNumber}`,
        item.targetDate,
        item.available ? "Ya" : "Belum",
      ]),
      [],
      ["Label", "Vibration", "Temperature", "Power", "Noise"],
      ...chartData.map((item) => [
        item.label,
        item.vibration,
        item.temperature,
        item.power,
        item.noise,
      ]),
    ];

    downloadExcelFile(
      `histori_${activeMotorKey || "motor"}_${timeFilter}_${selectedDate}.xlsx`,
      rows,
    );
  };

  const parameters = PARAMETERS_CONFIG.map((config) => ({
    ...config,
    value: sensorData[config.key],
  }));

  // Render gauge meter
  const renderGauge = (param) => {
    const threshold = thresholds[param.key];
    const currentValue = parseFloat(param.value);

    const { percentage, isAbnormal, radius, strokeWidth, currentArcLength } =
      calculateArcConfig(currentValue, param.max, threshold);

    // Generate scale marks - hanya min dan max
    const scaleMarks = [0, param.max];

    // Responsive SVG dimensions
    const svgWidth = 200;
    const svgHeight = 160;
    const viewBoxWidth = 200;
    const viewBoxHeight = 160;

    return (
      <div key={param.name} className="gauge-card">
        <div className="gauge-title">{param.name}</div>

        {/* SVG Speedometer */}
        <div className="gauge-svg-container">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            preserveAspectRatio="xMidYMid meet"
            className="gauge-svg"
          >
            {/* Background arc (light gray) */}
            <path
              d="M 30 130 A 70 70 0 1 1 170 130"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Dynamic arc - hijau jika normal, merah jika abnormal */}
            <path
              d="M 30 130 A 70 70 0 1 1 170 130"
              fill="none"
              stroke={isAbnormal ? "#dc2626" : "#16a34a"}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${currentArcLength} ${
                (180 / 360) * 2 * Math.PI * radius
              }`}
              className="transition-smooth"
            />

            {/* Scale marks and numbers - hanya min (0) dan max */}
            {scaleMarks.map((mark, i) => {
              const markPercent = (mark / param.max) * 100;
              const centerX = 100;
              const centerY = 130;

              const markAngle = 180 - (markPercent / 100) * 180;
              const markRad = (markAngle * Math.PI) / 180;

              const x1 = centerX + Math.cos(markRad) * radius;
              const y1 = centerY + Math.sin(markRad) * radius;
              const x2 = centerX + Math.cos(markRad) * (radius - 8);
              const y2 = centerY + Math.sin(markRad) * (radius - 8);

              const textRadius = 88;
              const textX = centerX + Math.cos(markRad) * textRadius;
              const textY = centerY + Math.sin(markRad) * textRadius;

              const displayValue =
                mark === 0 ? "0" : formatNumberWithSuffix(mark);

              return (
                <g key={i}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#1e293b"
                    strokeWidth="2"
                  />
                  <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fill="#1e293b"
                    fontWeight="700"
                  >
                    {displayValue}
                  </text>
                </g>
              );
            })}

            {/* Center dot */}
            <circle cx="100" cy="130" r="5" fill="#1e293b" />
          </svg>
        </div>

        {/* Value display box */}
        <div className="value-box">
          {param.name === "Vibration" ? (
            <div className="value-vibration">
              <div
                className="value-vibration-number"
                style={{ color: param.color }}
              >
                {formatVibrationValue(param.value).value}
              </div>
              <div className="value-vibration-unit">
                {formatVibrationValue(param.value).unit}
              </div>
            </div>
          ) : param.name === "Temperature" ? (
            <div className="value-with-unit">
              <div className="value-number" style={{ color: param.color }}>
                {param.value}
              </div>
              <div className="value-unit">°C</div>
            </div>
          ) : param.name === "Power" ? (
            <div className="value-with-unit">
              <div className="value-number" style={{ color: param.color }}>
                {param.value}
              </div>
              <div className="value-unit">W</div>
            </div>
          ) : (
            <div className="value-with-unit">
              <div className="value-number" style={{ color: param.color }}>
                {param.value}
              </div>
              <div className="value-unit">dB</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render individual bar chart untuk setiap parameter (7 hari dengan average)
  const renderIndividualChart = (param) => {
    const chartHeight = 220;
    const chartWidth = 280;
    const padding = { top: 15, right: 20, bottom: 35, left: 60 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    if (barChartData.length === 0) return null;

    const maxValue = param.max;
    const dataKey = param.name.toLowerCase();

    return (
      <div className="individual-chart-card" key={param.name}>
        <h4 className="individual-chart-title">{param.name}</h4>
        <svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Define gradient untuk setiap bar */}
          <defs>
            <linearGradient
              id={`barGradient-${param.key}`}
              x1="0%"
              y1="100%"
              x2="0%"
              y2="0%"
            >
              <stop
                offset="0%"
                style={{ stopColor: "#1e3a8a", stopOpacity: 1 }}
              />{" "}
              {/* Biru gelap di bawah */}
              <stop
                offset="100%"
                style={{ stopColor: "#93c5fd", stopOpacity: 1 }}
              />{" "}
              {/* Biru muda di atas */}
            </linearGradient>
          </defs>
          {/* Y-axis grid lines and labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + innerHeight - ratio * innerHeight;
            const value = (maxValue * ratio).toFixed(
              ratio === 0 || ratio === 1 ? 0 : 1,
            );

            let labelText;
            if (dataKey === "vibration") {
              const formatted = formatVibrationValue(parseFloat(value));
              labelText = formatted.value + " " + formatted.unit; // Tambah spasi dan unit lengkap
            } else {
              labelText = value;
            }

            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="0.5"
                />
                <text
                  x={padding.left - 5}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                >
                  {labelText}
                </text>
              </g>
            );
          })}

          {/* Y-axis label */}
          <text
            x={0}
            y={chartHeight / 2}
            textAnchor="middle"
            fill="#64748b"
            fontSize="11"
            fontWeight="600"
            transform={`rotate(-90, 0, ${chartHeight / 2})`}
          >
            {param.unit}
          </text>

          {/* Bars */}
          {(() => {
            // Gunakan barChartData (7 hari)
            const barCount = barChartData.length;
            const barGap = innerWidth / (barCount + 1);

            return barChartData.map((point, idx) => {
              const value = point[dataKey];
              let barHeight = (value / maxValue) * innerHeight;

              // Minimum bar height untuk visibility
              if (barHeight < 3 && value > 0) barHeight = 3;

              const barWidth = barGap * 0.7; // 70% of available space
              const x = padding.left + (idx + 1) * barGap - barWidth / 2;
              const y = padding.top + innerHeight - barHeight;

              return (
                <g key={idx}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={`url(#barGradient-${param.key})`}
                    rx="2"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    textAnchor="middle"
                    fill="#1e293b"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {dataKey === "vibration"
                      ? formatVibrationValue(value).value
                      : value.toFixed(dataKey === "power" ? 0 : 1)}
                  </text>
                </g>
              );
            });
          })()}

          {/* X-axis labels */}
          {(() => {
            // Gunakan barChartData (7 hari)
            const barCount = barChartData.length;
            const barGap = innerWidth / (barCount + 1);

            return barChartData.map((point, idx) => {
              const x = padding.left + (idx + 1) * barGap;
              return (
                <text
                  key={idx}
                  x={x}
                  y={chartHeight - 10}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="9"
                >
                  {point.label}
                </text>
              );
            });
          })()}
        </svg>
        <p className="individual-chart-unit">({param.unit})</p>
      </div>
    );
  };

  // Render grafik gabungan dengan semua parameter
  const renderCombinedChart = () => {
    const chartHeight = 300;
    const chartWidth = 900;
    const padding = { top: 20, right: 80, bottom: 40, left: 60 }; // Increased right padding
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    if (chartData.length === 0) return null;

    // Normalize data untuk masing-masing parameter menggunakan max value dari PARAMETERS_CONFIG
    // Jadi Level Relatif (%) = (nilai / max) * 100
    const normalizedData = chartData.map((point) => {
      const vibrationParam = PARAMETERS_CONFIG.find(
        (p) => p.key === "vibration",
      );
      const temperatureParam = PARAMETERS_CONFIG.find(
        (p) => p.key === "temperature",
      );
      const powerParam = PARAMETERS_CONFIG.find((p) => p.key === "power");
      const noiseParam = PARAMETERS_CONFIG.find((p) => p.key === "noise");

      return {
        ...point,
        vibrationNorm: (point.vibration / (vibrationParam?.max || 150)) * 100,
        temperatureNorm:
          (point.temperature / (temperatureParam?.max || 1024)) * 100,
        powerNorm: (point.power / (powerParam?.max || 23000)) * 100,
        noiseNorm: (point.noise / (noiseParam?.max || 120)) * 100,
      };
    });

    // Generate path untuk setiap parameter
    const generatePath = (key) => {
      return normalizedData
        .map((point, i) => {
          const x =
            padding.left + (i / (normalizedData.length - 1)) * innerWidth;
          const y =
            padding.top + innerHeight - (point[key] / 100) * innerHeight;
          return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        })
        .join(" ");
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">Grafik Historis</h3>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "12px",
                color: "#94a3b8",
                fontWeight: 500,
              }}
            >
              {new Date(selectedDate).toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#f8fafc",
                padding: "6px 10px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
              }}
            >
              <span
                style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}
              >
                Hari ke-
              </span>
              <select
                value={selectedHistoryMarker}
                onChange={(e) => {
                  const selectedDay = e.target.value;
                  setSelectedHistoryMarker(selectedDay);

                  const milestone = historyMilestones.find(
                    (item) => String(item.dayNumber) === selectedDay,
                  );

                  if (milestone?.available) {
                    setSelectedDate(milestone.targetDate);
                    setBarChartDate(milestone.targetDate);
                  }
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#1e293b",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">Pilih</option>
                {historyMilestones.map((item) => (
                  <option
                    key={item.dayNumber}
                    value={String(item.dayNumber)}
                    disabled={!item.available}
                  >
                    {item.available
                      ? `${item.dayNumber} (${item.targetDate})`
                      : `${item.dayNumber} (belum ada)`}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#f1f5f9",
                padding: "8px 12px",
                borderRadius: "8px",
              }}
            >
              <span
                style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}
              >
                📅
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1e293b",
                  cursor: "pointer",
                  outline: "none",
                }}
              />
            </div>

            {/* Time Filter Buttons */}
            <div className="chart-filters">
              {["daily", "weekly"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`filter-button ${
                    timeFilter === filter ? "active" : ""
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={exportHistoryExcel}
              style={{
                border: "none",
                background: "#0f766e",
                color: "#ffffff",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Export Excel
            </button>
          </div>
        </div>

        <svg
          width={chartWidth}
          height={chartHeight}
          className="chart-svg"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines and Y-axis */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = padding.top + innerHeight - (val / 100) * innerHeight;
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="12"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Y-axis label */}
          <text
            x={15}
            y={chartHeight / 2}
            textAnchor="middle"
            fill="#64748b"
            fontSize="13"
            fontWeight="600"
            transform={`rotate(-90, 15, ${chartHeight / 2})`}
          >
            Level Relatif (%)
          </text>

          {/* X-axis labels */}
          {chartData.map((point, i) => {
            if (i % Math.ceil(chartData.length / 8) !== 0) return null;
            const x = padding.left + (i / (chartData.length - 1)) * innerWidth;
            return (
              <text
                key={i}
                x={x}
                y={chartHeight - 10}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="12"
              >
                {point.label}
              </text>
            );
          })}

          {/* Lines untuk setiap parameter */}
          <path
            d={generatePath("vibrationNorm")}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
          />
          <path
            d={generatePath("temperatureNorm")}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.5"
          />
          <path
            d={generatePath("powerNorm")}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
          />
          <path
            d={generatePath("noiseNorm")}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
          />

          {/* Bullet points untuk setiap parameter - hanya di label yang ditampilkan */}
          {normalizedData.map((point, i) => {
            // Hanya tampilkan bullet di titik yang ada label-nya
            if (i % Math.ceil(chartData.length / 8) !== 0) return null;

            const x =
              padding.left + (i / (normalizedData.length - 1)) * innerWidth;
            const yVibration =
              padding.top +
              innerHeight -
              (point.vibrationNorm / 100) * innerHeight;
            const yTemperature =
              padding.top +
              innerHeight -
              (point.temperatureNorm / 100) * innerHeight;
            const yPower =
              padding.top + innerHeight - (point.powerNorm / 100) * innerHeight;
            const yNoise =
              padding.top + innerHeight - (point.noiseNorm / 100) * innerHeight;

            return (
              <g key={`bullets-${i}`}>
                {/* Vibration bullet */}
                <circle
                  cx={x}
                  cy={yVibration}
                  r="4"
                  fill="#fff"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
                {/* Temperature bullet */}
                <circle
                  cx={x}
                  cy={yTemperature}
                  r="4"
                  fill="#fff"
                  stroke="#ef4444"
                  strokeWidth="2"
                />
                {/* Power bullet */}
                <circle
                  cx={x}
                  cy={yPower}
                  r="4"
                  fill="#fff"
                  stroke="#f59e0b"
                  strokeWidth="2"
                />
                {/* Noise bullet */}
                <circle
                  cx={x}
                  cy={yNoise}
                  r="4"
                  fill="#fff"
                  stroke="#10b981"
                  strokeWidth="2"
                />
              </g>
            );
          })}

          {/* Hover points */}
          {normalizedData.map((point, i) => {
            const x =
              padding.left + (i / (normalizedData.length - 1)) * innerWidth;
            return (
              <g key={i}>
                <rect
                  x={x - 10}
                  y={padding.top}
                  width="20"
                  height={innerHeight}
                  fill="transparent"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHoveredPoint(i)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}

          {/* Tooltip */}
          {hoveredPoint !== null && (
            <g>
              {(() => {
                const point = normalizedData[hoveredPoint];
                const x =
                  padding.left +
                  (hoveredPoint / (normalizedData.length - 1)) * innerWidth;
                return (
                  <>
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={chartHeight - padding.bottom}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="4"
                    />
                    <rect
                      x={x + 10}
                      y={padding.top + 10}
                      width="140"
                      height="115"
                      fill="#1e293b"
                      rx="8"
                    />
                    <text
                      x={x + 20}
                      y={padding.top + 30}
                      fill="#fff"
                      fontSize="12"
                      fontWeight="600"
                    >
                      {chartData[hoveredPoint].label}
                    </text>
                    <text
                      x={x + 20}
                      y={padding.top + 50}
                      fill="#3b82f6"
                      fontSize="11"
                    >
                      Vib:{" "}
                      {
                        formatVibrationValue(chartData[hoveredPoint].vibration)
                          .value
                      }{" "}
                      {
                        formatVibrationValue(chartData[hoveredPoint].vibration)
                          .unit
                      }
                    </text>
                    <text
                      x={x + 20}
                      y={padding.top + 65}
                      fill="#ef4444"
                      fontSize="11"
                    >
                      Temp: {chartData[hoveredPoint].temperature.toFixed(1)} °C
                    </text>
                    <text
                      x={x + 20}
                      y={padding.top + 80}
                      fill="#f59e0b"
                      fontSize="11"
                    >
                      Power: {chartData[hoveredPoint].power.toFixed(1)} W
                    </text>
                    <text
                      x={x + 20}
                      y={padding.top + 95}
                      fill="#10b981"
                      fontSize="11"
                    >
                      Noise: {chartData[hoveredPoint].noise.toFixed(1)} dB
                    </text>
                  </>
                );
              })()}
            </g>
          )}
        </svg>

        {/* Legend */}
        <div className="chart-legend">
          {parameters.map((param) => (
            <div key={param.name} className="legend-item">
              <div
                className="legend-color"
                style={{ background: param.color }}
              />
              <span>
                {param.name} ({param.unit})
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="monitoring-dashboard">
      <div className="dashboard-container">
        {/* Show loading/selection message if no motor selected */}
        {!selectedSubMotor ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
              flexDirection: "column",
              gap: "20px",
              color: "#666",
            }}
          >
            <h2>Pilih Motor pada Sidebar</h2>
            <p>untuk memulai monitoring</p>
          </div>
        ) : (
          <>
            {/* Header with Power Button */}
            <div className="dashboard-header">
              <h2 className="dashboard-title">
                DASHBOARD MONITORING MESIN {selectedMotor?.toUpperCase() || ""}
              </h2>
              {selectedSubMotor && (
                <p className="dashboard-subtitle">{selectedSubMotor}</p>
              )}
            </div>

            {/* Gauge Meters */}
            <div className="gauges-grid">
              {parameters.map((param) => renderGauge(param))}
            </div>

            {/* Combined Chart */}
            {renderCombinedChart()}

            {/* Individual Parameter Charts */}
            <div className="individual-charts-container">
              <div className="individual-charts-header">
                <h3 className="section-title">Rata-Rata Parameter Mingguan</h3>
                <input
                  type="date"
                  value={barChartDate}
                  onChange={(e) => setBarChartDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="bar-chart-date-picker"
                />
              </div>
              <div className="individual-charts-grid">
                {parameters.map((param) => renderIndividualChart(param))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MonitoringDashboard;
