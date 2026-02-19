import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const MonitoringThreshold = ({ selectedSubMotor, onBack }) => {
  // Default thresholds
  const defaultThresholds = {
    vibration: { min: 100000, max: 500000000 }, // 0.001Hz~1000MHz = 1,000,000,000 Hz (1 GHz)
    temperature: { min: 30, max: 100 }, // 0-1024°C
    current: { min: 5, max: 80 }, // 0-100A
    power: { min: 0.5, max: 20 }, // 0-23kW
    noise: { min: 40, max: 85 }, // 0-120dB (MAX9814)
  };

  // Format vibration value dengan unit yang sesuai (Hz/kHz/MHz/GHz)
  const formatVibrationValue = (value) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)} GHz`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)} MHz`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)} kHz`;
    } else {
      return `${value.toFixed(3)} Hz`;
    }
  };

  // State untuk thresholds - akan di-load dari Firestore
  const [thresholds, setThresholds] = useState(defaultThresholds);

  // Load thresholds from Firestore with real-time sync
  useEffect(() => {
    const thresholdsRef = doc(db, "monitoringSettings", "thresholds");
    
    // Load initial data
    const loadThresholds = async () => {
      try {
        const docSnap = await getDoc(thresholdsRef);
        if (docSnap.exists()) {
          setThresholds(docSnap.data());
          console.log("[MonitoringThreshold] Loaded thresholds from Firestore:", docSnap.data());
        } else {
          // Initialize with default values in Firestore
          await setDoc(thresholdsRef, defaultThresholds);
          console.log("[MonitoringThreshold] Initialized default thresholds in Firestore");
        }
      } catch (e) {
        console.error("Failed to load thresholds from Firestore:", e);
      }
    };

    loadThresholds();

    // Real-time sync with Firestore
    const unsubscribe = onSnapshot(thresholdsRef, (doc) => {
      if (doc.exists()) {
        setThresholds(doc.data());
        console.log("[MonitoringThreshold] Real-time update from Firestore:", doc.data());
      }
    });

    return () => unsubscribe();
  }, []);

  // State untuk unit vibration (Hz, kHz, MHz, GHz)
  const [vibrationMinUnit, setVibrationMinUnit] = useState('kHz');
  const [vibrationMaxUnit, setVibrationMaxUnit] = useState('MHz');
  
  // Konversi nilai vibration dari Hz ke unit yang dipilih
  const getVibrationDisplayValue = (valueInHz, unit) => {
    switch(unit) {
      case 'Hz': return valueInHz;
      case 'kHz': return valueInHz / 1000;
      case 'MHz': return valueInHz / 1000000;
      case 'GHz': return valueInHz / 1000000000;
      default: return valueInHz;
    }
  };
  
  // Konversi nilai dari unit yang dipilih ke Hz
  const convertToHz = (value, unit) => {
    switch(unit) {
      case 'Hz': return value;
      case 'kHz': return value * 1000;
      case 'MHz': return value * 1000000;
      case 'GHz': return value * 1000000000;
      default: return value;
    }
  };

  const parameters = [
    {
      key: "vibration",
      name: "Vibration",
      unit: "Hz",
      range: "0.001Hz ~ 1000MHz (1 GHz)",
      color: "#3b82f6",
      icon: "≈",
    },
    {
      key: "temperature",
      name: "Temperature",
      unit: "°C",
      range: "0-1024°C",
      color: "#ef4444",
      icon: "◐",
    },
    {
      key: "current",
      name: "Current",
      unit: "A",
      range: "0-100A",
      color: "#f59e0b",
      icon: "⚡",
    },
    {
      key: "power",
      name: "Power",
      unit: "kW",
      range: "0-23kW",
      color: "#8b5cf6",
      icon: "◆",
    },
    {
      key: "noise",
      name: "Noise",
      unit: "dB",
      range: "0-120dB",
      color: "#10b981",
      icon: "♪",
    },
  ];

  const handleChange = async (key, type, value) => {
    if (key === 'vibration') {
      // Konversi ke Hz sebelum disimpan
      const unit = type === 'min' ? vibrationMinUnit : vibrationMaxUnit;
      const valueInHz = convertToHz(parseFloat(value) || 0, unit);
      setThresholds({
        ...thresholds,
        [key]: { ...thresholds[key], [type]: valueInHz },
      });
    } else {
      setThresholds({
        ...thresholds,
        [key]: { ...thresholds[key], [type]: parseFloat(value) || 0 },
      });
    }
  };

  const handleSave = async () => {
    // Save to Firestore
    const thresholdsRef = doc(db, "monitoringSettings", "thresholds");
    try {
      await setDoc(thresholdsRef, thresholds);
      console.log(
        "[MonitoringThreshold] Thresholds saved to Firestore:",
        thresholds
      );
      alert("Threshold berhasil disimpan ke Firebase!");
      onBack();
    } catch (e) {
      console.error("Failed to save thresholds to Firestore:", e);
      alert("Gagal menyimpan threshold!");
    }
  };

  const handleReset = async () => {
    setThresholds(defaultThresholds);
    const thresholdsRef = doc(db, "monitoringSettings", "thresholds");
    try {
      await setDoc(thresholdsRef, defaultThresholds);
      console.log("[MonitoringThreshold] Thresholds reset to default in Firestore");
      alert("Threshold berhasil direset!");
    } catch (e) {
      console.error("Failed to reset thresholds:", e);
    }
  };

  return (
    <div style={{ padding: "32px", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: "8px",
            }}
          >
            SET THRESHOLD PARAMETER
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "16px",
              color: "#64748b",
              fontWeight: 500,
            }}
          >
            {selectedSubMotor || "Motor"}
          </p>
        </div>

        {/* Threshold Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          {parameters.map((param) => (
            <div
              key={param.key}
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                borderLeft: `4px solid ${param.color}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: `${param.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "16px",
                    fontSize: "24px",
                    color: param.color,
                  }}
                >
                  {param.icon}
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#1e293b",
                    }}
                  >
                    {param.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                    Unit: {param.unit} | Range: {param.range}
                  </p>
                </div>
              </div>

              {param.key === 'vibration' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Minimum Value */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#64748b",
                        marginBottom: "8px",
                      }}
                    >
                      Minimum Value
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        value={getVibrationDisplayValue(thresholds[param.key].min, vibrationMinUnit).toFixed(2)}
                        onChange={(e) =>
                          handleChange(param.key, "min", e.target.value)
                        }
                        min={0.001}
                        step={0.01}
                        style={{
                          flex: 1,
                          padding: "12px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      />
                      <select
                        value={vibrationMinUnit}
                        onChange={(e) => setVibrationMinUnit(e.target.value)}
                        style={{
                          padding: "12px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontWeight: 600,
                          background: '#fff',
                          cursor: 'pointer',
                          minWidth: '80px',
                        }}
                      >
                        <option value="Hz">Hz</option>
                        <option value="kHz">kHz</option>
                        <option value="MHz">MHz</option>
                        <option value="GHz">GHz</option>
                      </select>
                    </div>
                  </div>

                  {/* Maximum Value */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#64748b",
                        marginBottom: "8px",
                      }}
                    >
                      Maximum Value
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        value={getVibrationDisplayValue(thresholds[param.key].max, vibrationMaxUnit).toFixed(2)}
                        onChange={(e) =>
                          handleChange(param.key, "max", e.target.value)
                        }
                        min={0.001}
                        step={0.01}
                        style={{
                          flex: 1,
                          padding: "12px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      />
                      <select
                        value={vibrationMaxUnit}
                        onChange={(e) => setVibrationMaxUnit(e.target.value)}
                        style={{
                          padding: "12px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontWeight: 600,
                          background: '#fff',
                          cursor: 'pointer',
                          minWidth: '80px',
                        }}
                      >
                        <option value="Hz">Hz</option>
                        <option value="kHz">kHz</option>
                        <option value="MHz">MHz</option>
                        <option value="GHz">GHz</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#64748b",
                      marginBottom: "8px",
                    }}
                  >
                    Minimum Value
                  </label>
                  <input
                    type="number"
                    value={thresholds[param.key].min}
                    onChange={(e) =>
                      handleChange(param.key, "min", e.target.value)
                    }
                    min={param.key === "vibration" ? 0.001 : 0}
                    max={
                      param.key === "vibration"
                        ? 1000000000
                        : param.key === "temperature"
                        ? 1024
                        : param.key === "current"
                        ? 100
                        : param.key === "power"
                        ? 23
                        : 120
                    }
                    step={
                      param.key === "vibration"
                        ? 100000
                        : param.key === "power"
                        ? 0.1
                        : 1
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#1e293b",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#64748b",
                      marginBottom: "8px",
                    }}
                  >
                    Maximum Value
                  </label>
                  <input
                    type="number"
                    value={thresholds[param.key].max}
                    onChange={(e) =>
                      handleChange(param.key, "max", e.target.value)
                    }
                    min={param.key === "vibration" ? 0.001 : 0}
                    max={
                      param.key === "vibration"
                        ? 1000000000
                        : param.key === "temperature"
                        ? 1024
                        : param.key === "current"
                        ? 100
                        : param.key === "power"
                        ? 23
                        : 120
                    }
                    step={
                      param.key === "vibration"
                        ? 100000
                        : param.key === "power"
                        ? 0.1
                        : 1
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#1e293b",
                    }}
                  />
                </div>
              </div>
              )}

              {/* Visual Range Indicator */}
              <div style={{ marginTop: "16px" }}>
                <div
                  style={{
                    height: "8px",
                    background: "#e2e8f0",
                    borderRadius: "4px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "0",
                      right: "0",
                      height: "100%",
                      background: `linear-gradient(90deg, ${param.color}40 0%, ${param.color} 50%, ${param.color}40 100%)`,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    {param.key === "vibration"
                      ? formatVibrationValue(thresholds[param.key].min)
                      : `${thresholds[param.key].min} ${param.unit}`}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    {param.key === "vibration"
                      ? formatVibrationValue(thresholds[param.key].max)
                      : `${thresholds[param.key].max} ${param.unit}`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div
          style={{ display: "flex", gap: "16px", justifyContent: "flex-end" }}
        >
          <button
            onClick={handleReset}
            style={{
              padding: "14px 32px",
              background: "#e2e8f0",
              color: "#475569",
              border: "none",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "15px",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.background = "#cbd5e1")}
            onMouseOut={(e) => (e.target.style.background = "#e2e8f0")}
          >
            Reset to Default
          </button>
          <button
            onClick={onBack}
            style={{
              padding: "14px 32px",
              background: "#64748b",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "15px",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.background = "#475569")}
            onMouseOut={(e) => (e.target.style.background = "#64748b")}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "14px 32px",
              background: "linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "15px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.transform = "translateY(-2px)")}
            onMouseOut={(e) => (e.target.style.transform = "translateY(0)")}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonitoringThreshold;
