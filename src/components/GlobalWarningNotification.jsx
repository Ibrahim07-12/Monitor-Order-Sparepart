import React, { useState, useEffect, useRef } from "react";
import { subscribeToWarnings, dismissWarning } from "../globalWarnings";
import { subscribeToNotificationState } from "../notificationState";

const GlobalWarningNotification = () => {
  const [allWarnings, setAllWarnings] = useState({});
  const [currentWarningIndex, setCurrentWarningIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(true);

  const rotateIntervalRef = useRef(null);
  const hideTimerRef = useRef(null);

  // Subscribe to notification enabled state
  useEffect(() => {
    const unsubscribe = subscribeToNotificationState((enabled) => {
      setNotificationEnabled(enabled);
    });
    return unsubscribe;
  }, []);

  // Subscribe to global warnings
  useEffect(() => {
    console.log("[GlobalWarningNotification] Subscribing to warnings...");
    const unsubscribe = subscribeToWarnings((warnings) => {
      console.log(
        "[GlobalWarningNotification] Received warnings update:",
        warnings
      );
      setAllWarnings(warnings);
      // Reset index jika motor yang sedang ditampilkan hilang
      const warningKeys = Object.keys(warnings);
      if (warningKeys.length > 0) {
        setCurrentWarningIndex((prev) => {
          // Jika index melebihi jumlah warning, reset ke 0
          return prev >= warningKeys.length ? 0 : prev;
        });
      }
    });
    return unsubscribe;
  }, []);

  // Main notification loop: tampil 5 detik + hilang 2 detik = 7 detik per motor
  useEffect(() => {
    // Clear existing timers
    if (rotateIntervalRef.current) clearInterval(rotateIntervalRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    const warningKeys = Object.keys(allWarnings);
    console.log("[GlobalWarningNotification] Processing warnings:", {
      warningKeys,
      notificationEnabled,
      currentIndex: currentWarningIndex,
    });

    // Jika tidak ada warning atau notifikasi dimatikan, stop
    if (warningKeys.length === 0 || !notificationEnabled) {
      console.log(
        "[GlobalWarningNotification] No warnings or notification disabled, hiding..."
      );
      setShowNotification(false);
      return;
    }

    console.log("[GlobalWarningNotification] Starting notification cycle...");

    // Function untuk menjalankan cycle 5s tampil + 2s hilang
    const runCycle = () => {
      // Tampilkan notifikasi
      console.log("[GlobalWarningNotification] Showing notification");
      setShowNotification(true);

      // Setelah 5 detik, sembunyikan
      hideTimerRef.current = setTimeout(() => {
        console.log("[GlobalWarningNotification] Hiding notification");
        setShowNotification(false);
      }, 5000);
    };

    // Jalankan cycle pertama segera
    runCycle();

    // Rotate ke motor berikutnya setiap 7 detik
    rotateIntervalRef.current = setInterval(() => {
      const currentWarningKeys = Object.keys(allWarnings);
      if (currentWarningKeys.length > 0) {
        setCurrentWarningIndex((prev) => {
          const nextIndex = (prev + 1) % currentWarningKeys.length;
          console.log(
            "[GlobalWarningNotification] Rotating to motor index:",
            nextIndex
          );
          return nextIndex;
        });
        runCycle(); // Jalankan cycle baru untuk motor berikutnya
      }
    }, 7000);

    // Cleanup
    return () => {
      if (rotateIntervalRef.current) clearInterval(rotateIntervalRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [allWarnings, notificationEnabled]); // Re-run saat allWarnings atau notificationEnabled berubah

  // Get current warning to display
  const warningKeys = Object.keys(allWarnings);
  const currentWarning =
    warningKeys.length > 0
      ? {
          motorName: warningKeys[currentWarningIndex],
          data: allWarnings[warningKeys[currentWarningIndex]],
        }
      : null;

  // Generate warning message
  const getWarningMessage = (motorName, parameters) => {
    const paramNames = {
      vibration: "Getaran",
      temperature: "Suhu",
      current: "Arus",
      power: "Daya",
      noise: "Kebisingan",
    };

    const abnormalNames = parameters.map((p) => paramNames[p]).join(" dan ");
    return `Kondisi ${abnormalNames} ${motorName} dalam kondisi abnormal`;
  };

  // Handle dismiss
  const handleDismiss = () => {
    if (currentWarning) {
      dismissWarning(currentWarning.motorName);
      setCurrentWarningIndex(0);
    }
  };

  if (!currentWarning || !showNotification || !notificationEnabled) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 99999,
        maxWidth: "450px",
      }}
    >
      <div
        style={{
          background: "#dc2626",
          color: "#fff",
          padding: "18px 24px",
          borderRadius: "12px",
          boxShadow: "0 6px 20px rgba(220, 38, 38, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          border: "2px solid #ef4444",
          animation: "slideInRight 0.3s ease-out",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: "32px",
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            ⚠️
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{ fontWeight: 700, fontSize: "15px", marginBottom: "6px" }}
            >
              PERINGATAN ABNORMAL
            </div>
            <div style={{ fontSize: "13px", lineHeight: "1.5" }}>
              {getWarningMessage(
                currentWarning.motorName,
                currentWarning.data.parameters
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: "#fff",
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.2s",
          }}
          onMouseOver={(e) =>
            (e.target.style.background = "rgba(255, 255, 255, 0.35)")
          }
          onMouseOut={(e) =>
            (e.target.style.background = "rgba(255, 255, 255, 0.2)")
          }
        >
          ✕
        </button>
      </div>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default GlobalWarningNotification;
