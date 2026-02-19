/**
 * Utility functions for chart rendering and data manipulation
 */

/**
 * Format vibration value dengan unit yang sesuai (Hz/kHz/MHz/GHz)
 */
export const formatVibrationValue = (value) => {
  if (value >= 1000000000) {
    return { value: (value / 1000000000).toFixed(2), unit: "GHz" };
  } else if (value >= 1000000) {
    return { value: (value / 1000000).toFixed(2), unit: "MHz" };
  } else if (value >= 1000) {
    return { value: (value / 1000).toFixed(2), unit: "kHz" };
  } else {
    return { value: value.toFixed(2), unit: "Hz" };
  }
};

/**
 * Format number dengan suffix (k, M, G)
 */
export const formatNumberWithSuffix = (num) => {
  if (num === 0) return "0";
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(0) + "G";
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(0) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(0) + "k";
  } else {
    return num.toString();
  }
};

/**
 * Generate chart data berdasarkan time filter
 */
export const generateChartData = (timeFilter) => {
  let labels = [];

  if (timeFilter === "daily") {
    labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  } else if (timeFilter === "weekly") {
    labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  } else {
    labels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
  }

  return labels.map((label) => {
    // Vibration: 1kHz - 800MHz (sama seperti bar chart)
    const vibrationRange = Math.random();
    let vibration;
    if (vibrationRange < 0.3) {
      vibration = Math.random() * 10000 + 1000; // 1kHz - 11kHz
    } else if (vibrationRange < 0.6) {
      vibration = Math.random() * 500000 + 10000; // 10kHz - 510kHz
    } else {
      vibration = Math.random() * 700000000 + 1000000; // 1MHz - 701MHz
    }
    
    return {
      label,
      vibration: vibration,
      temperature: Math.random() * 30 + 60, // 60-90°C
      current: Math.random() * 5 + 10, // 10-15A
      power: Math.random() * 18 + 2, // 2-20 kW (dalam kW!)
      noise: Math.random() * 20 + 70, // 70-90 dB
    };
  });
};

/**
 * Generate bar chart data untuk 7 hari (average per hari)
 * selectedDate: tanggal akhir, akan generate 7 hari ke belakang
 */
export const generateWeeklyBarData = (selectedDate = null) => {
  const endDate = selectedDate ? new Date(selectedDate) : new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(endDate);
    date.setDate(date.getDate() - (6 - i)); // 7 hari ke belakang
    
    // Simulasi average data untuk hari ini dengan range lebih variatif
    // Vibration: 1kHz - 800MHz (lebih tinggi)
    const vibrationRange = Math.random();
    let vibration;
    if (vibrationRange < 0.3) {
      vibration = Math.random() * 10000 + 1000; // 1kHz - 11kHz
    } else if (vibrationRange < 0.6) {
      vibration = Math.random() * 500000 + 10000; // 10kHz - 510kHz
    } else {
      vibration = Math.random() * 700000000 + 1000000; // 1MHz - 701MHz
    }
    
    return {
      label: dayNames[date.getDay()],
      date: date.toISOString().split('T')[0],
      vibration: vibration,
      temperature: Math.random() * 30 + 60,
      current: Math.random() * 5 + 10,
      power: Math.random() * 18 + 2, // 2kW - 20kW (dalam kW, bukan Watt!)
      noise: Math.random() * 20 + 70,
    };
  });
};

/**
 * Normalize chart data untuk rendering
 */
export const normalizeChartData = (chartData) => {
  return chartData.map((point) => ({
    ...point,
    vibrationNorm: (point.vibration / 15) * 100,
    temperatureNorm: (point.temperature / 100) * 100,
    currentNorm: (point.current / 20) * 100,
    powerNorm: (point.power / 2000) * 100,
    noiseNorm: (point.noise / 100) * 100,
  }));
};

/**
 * Generate SVG path untuk line chart
 */
export const generatePath = (
  normalizedData,
  key,
  padding,
  innerWidth,
  innerHeight
) => {
  return normalizedData
    .map((point, i) => {
      const x = padding.left + (i / (normalizedData.length - 1)) * innerWidth;
      const y = padding.top + innerHeight - (point[key] / 100) * innerHeight;
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");
};

/**
 * Generate sensor data dengan variasi range
 */
export const generateSensorData = (shouldGenerateAbnormal = false) => {
  const data = {};

  if (shouldGenerateAbnormal) {
    // Generate dengan beberapa parameter abnormal
    const vibrationRange = Math.random();
    if (vibrationRange < 0.3) {
      data.vibration = parseFloat((Math.random() * 99900 + 100).toFixed(2));
    } else if (vibrationRange < 0.6) {
      data.vibration = parseFloat(
        (Math.random() * 9900000 + 100000).toFixed(2)
      );
    } else {
      data.vibration = parseFloat(
        (Math.random() > 0.5
          ? Math.random() * 500000000 + 500000000
          : Math.random() * 490000000 + 10000000
        ).toFixed(2)
      );
    }
    data.temperature = parseFloat(
      (Math.random() > 0.5
        ? Math.random() * 200 + 100
        : Math.random() * 70 + 30
      ).toFixed(1)
    );
    data.current = parseFloat(
      (Math.random() > 0.5
        ? Math.random() * 20 + 80
        : Math.random() * 75 + 5
      ).toFixed(2)
    );
    data.power = parseFloat(
      (Math.random() > 0.5
        ? Math.random() * 3 + 20
        : Math.random() * 19.5 + 0.5
      ).toFixed(2)
    );
    data.noise = parseFloat(
      (Math.random() > 0.5
        ? Math.random() * 30 + 85
        : Math.random() * 45 + 40
      ).toFixed(1)
    );
  } else {
    // Generate data normal dengan variasi
    const vibrationRange = Math.random();
    if (vibrationRange < 0.3) {
      data.vibration = parseFloat((Math.random() * 99900 + 100).toFixed(2));
    } else if (vibrationRange < 0.6) {
      data.vibration = parseFloat(
        (Math.random() * 9900000 + 100000).toFixed(2)
      );
    } else {
      data.vibration = parseFloat(
        (Math.random() * 490000000 + 10000000).toFixed(2)
      );
    }
    data.temperature = parseFloat((Math.random() * 70 + 30).toFixed(1));
    data.current = parseFloat((Math.random() * 75 + 5).toFixed(2));
    data.power = parseFloat((Math.random() * 19.5 + 0.5).toFixed(2));
    data.noise = parseFloat((Math.random() * 45 + 40).toFixed(1));
  }

  return data;
};

/**
 * Calculate arc configuration for gauge
 */
export const calculateArcConfig = (currentValue, max, threshold) => {
  const percentage = Math.min(Math.max((currentValue / max) * 100, 0), 100);
  const isAbnormal =
    currentValue < threshold.min || currentValue > threshold.max;

  const radius = 70;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (180 / 360) * circumference; // 180° arc (semi-circle)

  const currentArcLength = (percentage / 100) * arcLength;

  return {
    percentage,
    isAbnormal,
    radius,
    strokeWidth,
    arcLength,
    currentArcLength,
  };
};

/**
 * Parameters configuration
 */
export const PARAMETERS_CONFIG = [
  {
    name: "Vibration",
    key: "vibration",
    unit: "Hz",
    max: 1000000000,
    color: "#3b82f6",
    icon: "≈",
  },
  {
    name: "Temperature",
    key: "temperature",
    unit: "°C",
    max: 1024,
    color: "#ef4444",
    icon: "◐",
  },
  {
    name: "Current",
    key: "current",
    unit: "A",
    max: 100,
    color: "#f59e0b",
    icon: "⚡",
  },
  {
    name: "Power",
    key: "power",
    unit: "kW",
    max: 23,
    color: "#8b5cf6",
    icon: "◆",
  },
  {
    name: "Noise",
    key: "noise",
    unit: "dB",
    max: 120,
    color: "#10b981",
    icon: "♪",
  },
];

/**
 * Default thresholds configuration
 */
export const DEFAULT_THRESHOLDS = {
  vibration: { min: 100000, max: 500000000 },
  temperature: { min: 30, max: 100 },
  current: { min: 5, max: 80 },
  power: { min: 0.5, max: 20 },
  noise: { min: 40, max: 85 },
};
