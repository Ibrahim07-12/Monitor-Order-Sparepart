import React, { useState, useEffect } from "react";
import { updateGlobalWarning } from "../../globalWarnings";
import { db } from "../../firebase";
import { doc, onSnapshot } from "firebase/firestore";
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

const MonitoringDashboard = ({ selectedMotor, selectedSubMotor }) => {
  const [sensorData, setSensorData] = useState({
    vibration: 4.5,
    temperature: 65.0,
    current: 12.3,
    power: 1200,
    noise: 75.5,
  });

  const [timeFilter, setTimeFilter] = useState("daily");
  const [chartData, setChartData] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  ); // Format: YYYY-MM-DD untuk grafik historis
  
  // State untuk bar charts individual (7 hari)
  const [barChartDate, setBarChartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [barChartData, setBarChartData] = useState([]);

  // Load thresholds from Firestore with real-time sync
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  
  useEffect(() => {
    const thresholdsRef = doc(db, "monitoringSettings", "thresholds");
    
    const unsubscribe = onSnapshot(thresholdsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setThresholds(data);
        console.log(
          "[MonitoringDashboard] Loaded/Updated thresholds from Firestore:",
          data
        );
      }
    }, (error) => {
      console.error("Failed to load thresholds from Firestore:", error);
    });

    return () => unsubscribe();
  }, []);

  // Simulasi data sensor real-time
  useEffect(() => {
    // Set initial data immediately
    const initialData = generateSensorData(Math.random() > 0.4);
    setSensorData(initialData);
    console.log("[MonitoringDashboard] Initial sensor data:", initialData);

    const interval = setInterval(() => {
      const shouldGenerateAbnormal = Math.random() > 0.4;
      const newData = generateSensorData(shouldGenerateAbnormal);
      console.log("[MonitoringDashboard] New sensor data:", newData);
      setSensorData(newData);

      // Deteksi parameter yang abnormal
      const abnormalParams = [];
      Object.keys(newData).forEach((key) => {
        const value = newData[key];
        const threshold = thresholds[key];
        if (value < threshold.min || value > threshold.max) {
          abnormalParams.push(key);
          console.log(
            `[MonitoringDashboard] ⚠️ ${key} ABNORMAL: ${value} (threshold: ${threshold.min}-${threshold.max})`
          );
        }
      });

      // SELALU update global warning system (clear jika kosong, set jika ada abnormal)
      if (selectedSubMotor) {
        console.log(
          `[MonitoringDashboard] Updating warning for ${selectedSubMotor}:`,
          abnormalParams
        );
        updateGlobalWarning(selectedSubMotor, abnormalParams);
      } else {
        console.warn("[MonitoringDashboard] No selectedSubMotor!");
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [selectedSubMotor]);

  // Generate chart data berdasarkan timeFilter (grafik historis)
  useEffect(() => {
    const data = generateChartData(timeFilter);
    setChartData(data);
  }, [timeFilter]);
  
  // Generate bar chart data (7 hari) berdasarkan barChartDate
  useEffect(() => {
    const data = generateWeeklyBarData(barChartDate);
    setBarChartData(data);
  }, [barChartDate]);

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

            {/* Center unit text */}
            <text
              x="100"
              y="115"
              textAnchor="middle"
              fontSize="16"
              fill="#1e293b"
              fontWeight="700"
            >
              {param.unit}
            </text>

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
          ) : (
            <div className="value-display" style={{ color: param.color }}>
              {param.value}
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
            <linearGradient id={`barGradient-${param.key}`} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#1e3a8a', stopOpacity: 1 }} /> {/* Biru gelap di bawah */}
              <stop offset="100%" style={{ stopColor: '#93c5fd', stopOpacity: 1 }} /> {/* Biru muda di atas */}
            </linearGradient>
          </defs>
          {/* Y-axis grid lines and labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + innerHeight - ratio * innerHeight;
            const value = (maxValue * ratio).toFixed(ratio === 0 || ratio === 1 ? 0 : 1);
            
            let labelText;
            if (dataKey === 'vibration') {
              const formatted = formatVibrationValue(parseFloat(value));
              labelText = formatted.value + ' ' + formatted.unit; // Tambah spasi dan unit lengkap
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
            x={10}
            y={chartHeight / 2}
            textAnchor="middle"
            fill="#64748b"
            fontSize="11"
            fontWeight="600"
            transform={`rotate(-90, 10, ${chartHeight / 2})`}
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
                    {dataKey === 'vibration' 
                      ? formatVibrationValue(value).value 
                      : value.toFixed(dataKey === 'power' ? 0 : 1)}
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

    // Normalize data untuk masing-masing parameter (sesuaikan dengan max value yang benar)
    const normalizedData = chartData.map((point) => ({
      ...point,
      vibrationNorm: (point.vibration / 1000000000) * 100, // Max 1GHz = 1,000,000,000 Hz
      temperatureNorm: (point.temperature / 1024) * 100, // Max 1024°C
      currentNorm: (point.current / 100) * 100, // Max 100A
      powerNorm: (point.power / 23) * 100, // Max 23 kW
      noiseNorm: (point.noise / 120) * 100, // Max 120 dB
    }));

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
              {["daily", "weekly", "monthly"].map((filter) => (
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
            d={generatePath("currentNorm")}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
          />
          <path
            d={generatePath("powerNorm")}
            fill="none"
            stroke="#8b5cf6"
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
            const yCurrent =
              padding.top +
              innerHeight -
              (point.currentNorm / 100) * innerHeight;
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
                {/* Current bullet */}
                <circle
                  cx={x}
                  cy={yCurrent}
                  r="4"
                  fill="#fff"
                  stroke="#f59e0b"
                  strokeWidth="2"
                />
                {/* Power bullet */}
                <circle
                  cx={x}
                  cy={yPower}
                  r="4"
                  fill="#fff"
                  stroke="#8b5cf6"
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
                      Vib: {formatVibrationValue(chartData[hoveredPoint].vibration).value} {formatVibrationValue(chartData[hoveredPoint].vibration).unit}
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
                      Curr: {chartData[hoveredPoint].current.toFixed(2)} A
                    </text>
                    <text
                      x={x + 20}
                      y={padding.top + 95}
                      fill="#8b5cf6"
                      fontSize="11"
                    >
                      Pow: {chartData[hoveredPoint].power.toFixed(1)} kW
                    </text>
                    <text
                      x={x + 20}
                      y={padding.top + 110}
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
        {/* Header */}
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
      </div>
    </div>
  );
};

export default MonitoringDashboard;
