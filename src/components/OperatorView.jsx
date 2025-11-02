import { useState, useEffect, useRef } from "react";
import {
  getAllSpareparts,
  subscribeToSpareparts,
  subscribeToAppSettings,
} from "../firestore";
import {
  FaClock,
  FaCheckCircle,
  FaCog,
  FaBoxes,
  FaUser,
  FaCalendarAlt,
  FaTruck,
  FaInbox,
} from "react-icons/fa";
import "./OperatorView.css";

const OperatorView = () => {
  // Notifikasi PM mendekati waktu
  const [showPmNotif, setShowPmNotif] = useState(false);
  const [pmNotifText, setPmNotifText] = useState("");
  // Setting H- (default 1 bulan sebelum PM)
  const notifSetting = 1;
  const [spareparts, setSpareparts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // all, waiting, arrived
  const [selectedPlant, setSelectedPlant] = useState("Foundry");
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);
  const containerRef = useRef(null);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(20); // px per second

  useEffect(() => {
    // Use real-time subscription so operator view updates automatically
    setLoading(true);
    const unsubscribe = subscribeToSpareparts((result) => {
      if (result.success) {
        setSpareparts(result.data);
      } else {
        console.error("Realtime subscribe error:", result.error);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  // Subscribe to app settings for auto-scroll
  useEffect(() => {
    const unsub = subscribeToAppSettings((res) => {
      console.debug("subscribeToAppSettings (operator) ->", res);
      if (res.success) {
        setAutoScrollEnabled(!!res.data.autoScrollEnabled);
        if (typeof res.data.autoScrollSpeed !== "undefined") {
          setAutoScrollSpeed(Number(res.data.autoScrollSpeed));
        }
      }
    });
    return () => unsub && unsub();
  }, []);
  // Deprecated - we keep getAllSpareparts for one-off fetches if needed

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    // Gunakan format bulan singkat (misal: "Okt" bukan "Oktober")
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filteredSpareparts = spareparts
    .filter((sp) => {
      // Filter by plant
      if (!sp.plant) return false; // ignore items without plant
      return sp.plant === selectedPlant;
    })
    .filter((sp) => {
      // Filter hidden items
      if (sp.hiddenFromOperator) return false;

      // Filter by tab based on progress status
      if (activeTab === "waiting") return !sp.arrivedComplete;
      if (activeTab === "arrived") return sp.arrivedComplete;
      return true;
    });

  // Cek sparepart yang mendekati waktu PM
  const pmWarningSparepart = filteredSpareparts.find((sp) => {
    if (!sp.nextPM) return false;
    const next = new Date(sp.nextPM);
    const now = new Date();
    const diffMonth =
      (next.getFullYear() - now.getFullYear()) * 12 +
      (next.getMonth() - now.getMonth());
    return diffMonth <= notifSetting;
  });

  useEffect(() => {
    if (pmWarningSparepart && pmWarningSparepart.machine) {
      setShowPmNotif(true);
      setPmNotifText(`${pmWarningSparepart.machine} Mendekati Waktu PM`);
    } else {
      setShowPmNotif(false);
      setPmNotifText("");
    }
  }, [pmWarningSparepart]);

  // Counts scoped to selected plant and excluding hidden items
  const plantSpareparts = spareparts.filter(
    (sp) => !sp.hiddenFromOperator && sp.plant === selectedPlant
  );
  const waitingCount = plantSpareparts.filter(
    (sp) => !sp.arrivedComplete
  ).length;
  const arrivedCount = plantSpareparts.filter(
    (sp) => sp.arrivedComplete
  ).length;
  const totalCount = plantSpareparts.length;

  // Auto-scroll behavior: slowly scroll table container up and down when enabled
  useEffect(() => {
    if (!autoScrollEnabled) return;
    const container =
      containerRef.current ||
      document.querySelector(".operator-table-container");
    console.debug("AutoScroll start - container:", container);
    if (!container) return;

    // log sizes
    console.debug(
      "container clientHeight, scrollHeight",
      container.clientHeight,
      container.scrollHeight
    );

    let restoredStyle = null;
    let forced = false;
    let max = container.scrollHeight - container.clientHeight;
    if (max <= 0) {
      // force a maxHeight to create overflow so scroll can occur
      restoredStyle = {
        maxHeight: container.style.maxHeight || "",
        overflowY: container.style.overflowY || "",
      };
      container.style.maxHeight = "50vh";
      container.style.overflowY = "auto";
      forced = true;
      // recompute
      max = container.scrollHeight - container.clientHeight;
      console.debug(
        "After forcing style, sizes:",
        container.clientHeight,
        container.scrollHeight
      );
    }

    if (max <= 0) {
      console.debug(
        "AutoScroll aborted: no scrollable area even after forcing styles."
      );
      // restore if we forced
      if (forced && restoredStyle) {
        container.style.maxHeight = restoredStyle.maxHeight;
        container.style.overflowY = restoredStyle.overflowY;
      }
      return;
    }

    let rafId = null;
    let direction = 1; // 1 down, -1 up
    let lastTs = null;

    const step = (ts) => {
      if (!lastTs) lastTs = ts;
      const delta = (ts - lastTs) / 1000; // seconds
      lastTs = ts;
      const maxNow = container.scrollHeight - container.clientHeight;
      const deltaPx = autoScrollSpeed * delta; // px to move this frame
      let next = container.scrollTop + direction * deltaPx;
      if (next >= maxNow) {
        next = maxNow;
        direction = -1;
      } else if (next <= 0) {
        next = 0;
        direction = 1;
      }
      container.scrollTop = next;
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (forced && restoredStyle) {
        container.style.maxHeight = restoredStyle.maxHeight;
        container.style.overflowY = restoredStyle.overflowY;
      }
      console.debug("AutoScroll RAF cancelled and styles restored");
    };
  }, [autoScrollEnabled, filteredSpareparts]);

  if (loading) {
    return (
      <div className="operator-view" style={{ position: "relative" }}>
        {/* Notifikasi PM mendekati waktu, kotak kuning di pojok kanan atas */}
        {showPmNotif && (
          <div
            style={{
              position: "fixed",
              top: 70,
              right: 32,
              zIndex: 1000,
              background: "#fef08a",
              color: "#92400e",
              borderRadius: 12,
              boxShadow: "0 2px 12px rgba(202,138,4,0.10)",
              padding: "14px 28px 14px 22px",
              fontWeight: 700,
              fontSize: "1.08em",
              display: "flex",
              alignItems: "center",
              gap: 12,
              border: "1.5px solid #fde047",
              minWidth: "max-content",
              maxWidth: "350px",
              animation: "pmNotifFadeIn 0.7s",
            }}
          >
            <span style={{ fontSize: "1.3em", color: "#eab308" }}>⚠️</span>
            <span>{pmNotifText}</span>
          </div>
        )}
        <style>{`
          @keyframes pmNotifFadeIn {
            0% { opacity: 0; transform: translateY(-16px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="operator-view" style={{ position: "relative" }}>
      {/* Notifikasi PM mendekati waktu, kotak kuning di pojok kanan atas */}
      {showPmNotif && (
        <div
          style={{
            position: "fixed",
            top: 70,
            right: 32,
            zIndex: 1000,
            background: "#fef08a",
            color: "#92400e",
            borderRadius: 12,
            boxShadow: "0 2px 12px rgba(202,138,4,0.10)",
            padding: "14px 28px 14px 22px",
            fontWeight: 700,
            fontSize: "1.08em",
            display: "flex",
            alignItems: "center",
            gap: 12,
            border: "1.5px solid #fde047",
            minWidth: "max-content",
            maxWidth: "350px",
            animation: "pmNotifFadeIn 0.7s",
          }}
        >
          <span style={{ fontSize: "1.3em", color: "#eab308" }}>⚠️</span>
          <span>{pmNotifText}</span>
        </div>
      )}
      <style>{`
        @keyframes pmNotifFadeIn {
          0% { opacity: 0; transform: translateY(-16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="operator-container">
        <div className="status-tabs">
          <div
            className="plant-buttons"
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              marginBottom: "10px",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            onWheel={(e) => {
              const el = e.currentTarget;
              if (e.deltaX === 0 && Math.abs(e.deltaY) > 0) {
                el.scrollLeft += e.deltaY;
                e.preventDefault();
              }
            }}
          >
            <style>{`
              .plant-buttons::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {[
              "Foundry",
              "Assambly",
              "Fabrication",
              "Hydraulic",
              "KBN",
              "Cibitung",
            ].map((plant) => (
              <button
                key={plant}
                className={`status-tab ${
                  selectedPlant === plant ? "active" : ""
                }`}
                onClick={() => setSelectedPlant(plant)}
                style={{ minWidth: "100px", whiteSpace: "nowrap" }}
              >
                {plant}
              </button>
            ))}
          </div>
          <button
            className={`status-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <FaInbox />
            Semua
            <span className="status-count">{totalCount}</span>
          </button>
          <button
            className={`status-tab ${activeTab === "waiting" ? "active" : ""}`}
            onClick={() => setActiveTab("waiting")}
          >
            <FaClock />
            Menunggu Kedatangan
            <span className="status-count">{waitingCount}</span>
          </button>
          <button
            className={`status-tab ${activeTab === "arrived" ? "active" : ""}`}
            onClick={() => setActiveTab("arrived")}
          >
            <FaCheckCircle />
            Sudah Datang
            <span className="status-count">{arrivedCount}</span>
          </button>
        </div>

        {filteredSpareparts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {activeTab === "waiting" ? (
                <FaClock />
              ) : activeTab === "arrived" ? (
                <FaCheckCircle />
              ) : (
                <FaInbox />
              )}
            </div>
            <h3>Tidak ada data</h3>
            <p>
              {activeTab === "waiting"
                ? "Tidak ada sparepart yang menunggu kedatangan"
                : activeTab === "arrived"
                ? "Belum ada sparepart yang datang"
                : "Belum ada data sparepart yang tercatat"}
            </p>
          </div>
        ) : (
          <div className="operator-table-container" ref={containerRef}>
            <table className="operator-table responsive-table">
              <thead>
                <tr>
                  <th>Nama Sparepart</th>
                  <th>Spesifikasi</th>
                  <th>Mesin</th>
                  <th>Jumlah</th>
                  <th>Diorder Oleh</th>
                  <th>Tanggal Order</th>
                  <th>Keterangan</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {filteredSpareparts.map((sparepart) => (
                  <tr key={sparepart.id}>
                    <td className="sparepart-name" data-label="Nama Sparepart">
                      {sparepart.name}
                    </td>
                    <td className="specification" data-label="Spesifikasi">
                      {sparepart.specification}
                    </td>
                    <td className="machine" data-label="Mesin">
                      {sparepart.machine}
                    </td>
                    <td className="quantity" data-label="Jumlah">
                      {sparepart.quantity} {sparepart.unit || "unit"}
                    </td>
                    <td className="ordered-by" data-label="Diorder Oleh">
                      {sparepart.orderedBy}
                    </td>
                    <td className="order-date" data-label="Tanggal Order">
                      {formatDate(sparepart.orderDate)}
                    </td>
                    <td data-label="Keterangan">
                      <span
                        className={`order-status-badge ${
                          sparepart.urgency === "urgent" ? "urgent" : "normal"
                        }`}
                      >
                        {sparepart.urgency === "urgent" ? "Urgent" : "Normal"}
                      </span>
                    </td>
                    <td data-label="Progress">
                      {/* Progress Stepper: 4/5 kotak ala AdminView, read-only */}
                      <style>{`
                        @keyframes pmBlinkRed {
                          0% { background: #e5e7eb; color: #1e293b; border: none; }
                          40% { background: #fee2e2; color: #dc2626; border: 2px solid #dc2626; }
                          60% { background: #fee2e2; color: #dc2626; border: 2px solid #dc2626; }
                          100% { background: #e5e7eb; color: #1e293b; border: none; }
                        }
                      `}</style>
                      <div className="stepper-row" style={{ gap: "4px" }}>
                        {/* Step Document */}
                        {(() => {
                          const includeKelengkapanStep =
                            sparepart.includeKelengkapanStep !== false;
                          const DOCUMENT_STEPS = [
                            "Mengisi Permintaan",
                            "Menunggu Problem Report",
                            "Mengajukan Ke Vendor",
                            "Proses Nego Purchasing",
                            "Kelengkapan data",
                          ];
                          const stepCount = includeKelengkapanStep ? 5 : 4;
                          const docSteps = sparepart.documentSteps
                            ? sparepart.documentSteps.slice(0, stepCount)
                            : Array(stepCount).fill(false);
                          const documentStepIdx = docSteps.findIndex(
                            (done) => !done
                          );
                          const documentDone = documentStepIdx === -1;
                          return (
                            <span
                              className="step-toggle-table pm-small-badge"
                              style={{
                                fontSize: "12px",
                                padding: "4px 10px",
                                minWidth: "max-content",
                                height: "26px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background:
                                  !documentDone && documentStepIdx >= 0
                                    ? "#e5e7eb"
                                    : documentDone
                                    ? "#d1fae5"
                                    : "#e5e7eb",
                                color:
                                  !documentDone && documentStepIdx >= 0
                                    ? "#1e293b"
                                    : documentDone
                                    ? "#059669"
                                    : "#1e293b",
                                border: documentDone
                                  ? "1.5px solid #059669"
                                  : "none",
                                fontWeight: 600,
                                cursor: "default",
                                position: "relative",
                                transition: "all 0.2s",
                                // Tidak ada animasi kelap-kelip, hanya warna merah statis
                                animation: "none",
                                verticalAlign: "middle",
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                Document
                                {!documentDone && documentStepIdx >= 0 && (
                                  <span
                                    style={{
                                      color: "#dc2626",
                                      fontWeight: 700,
                                      marginLeft: 4,
                                    }}
                                  >
                                    !
                                  </span>
                                )}
                              </span>
                            </span>
                          );
                        })()}
                        {/* Step Proses Order */}
                        {(() => {
                          const includeKelengkapanStep =
                            sparepart.includeKelengkapanStep !== false;
                          const stepCount = includeKelengkapanStep ? 5 : 4;
                          const docSteps = sparepart.documentSteps
                            ? sparepart.documentSteps.slice(0, stepCount)
                            : Array(stepCount).fill(false);
                          const documentStepIdx = docSteps.findIndex(
                            (done) => !done
                          );
                          const documentDone = documentStepIdx === -1;
                          const orderSteps = sparepart.orderSteps
                            ? sparepart.orderSteps.slice(0, 3)
                            : Array(3).fill(false);
                          const orderStepIdx = orderSteps.findIndex(
                            (done) => !done
                          );
                          const orderDone = orderStepIdx === -1;
                          return (
                            <span
                              className="step-toggle-table pm-small-badge"
                              style={{
                                fontSize: "12px",
                                padding: "4px 10px",
                                minWidth: "max-content",
                                height: "26px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background:
                                  !orderDone &&
                                  orderStepIdx >= 0 &&
                                  documentDone
                                    ? "#e5e7eb"
                                    : orderDone
                                    ? "#d1fae5"
                                    : "#e5e7eb",
                                color:
                                  !orderDone &&
                                  orderStepIdx >= 0 &&
                                  documentDone
                                    ? "#1e293b"
                                    : orderDone
                                    ? "#059669"
                                    : "#1e293b",
                                border: orderDone
                                  ? "1.5px solid #059669"
                                  : "none",
                                fontWeight: 600,
                                cursor: "default",
                                position: "relative",
                                transition: "all 0.2s",
                                // Tidak ada animasi kelap-kelip, hanya warna merah statis
                                animation: "none",
                                verticalAlign: "middle",
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                Proses Order
                                {!orderDone &&
                                  orderStepIdx >= 0 &&
                                  documentDone && (
                                    <span
                                      style={{
                                        color: "#dc2626",
                                        fontWeight: 700,
                                        marginLeft: 4,
                                      }}
                                    >
                                      !
                                    </span>
                                  )}
                              </span>
                            </span>
                          );
                        })()}
                        {/* Step Sudah Datang */}
                        <span
                          className="step-toggle-table pm-small-badge"
                          style={{
                            fontSize: "12px",
                            padding: "4px 10px",
                            minWidth: "max-content",
                            height: "26px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: sparepart.arrivedComplete
                              ? "#d1fae5"
                              : "#e5e7eb",
                            color: sparepart.arrivedComplete
                              ? "#059669"
                              : "#1e293b",
                            border: sparepart.arrivedComplete
                              ? "1.5px solid #059669"
                              : "none",
                            fontWeight: 600,
                            cursor: "default",
                            position: "relative",
                            transition: "all 0.2s",
                            verticalAlign: "middle",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            Sudah Datang
                          </span>
                        </span>
                        {/* Step Pemasangan */}
                        <span
                          className="step-toggle-table pm-small-badge"
                          style={{
                            fontSize: "12px",
                            padding: "4px 10px",
                            minWidth: "max-content",
                            height: "26px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: sparepart.installationComplete
                              ? "#d1fae5"
                              : "#e5e7eb",
                            color: sparepart.installationComplete
                              ? "#059669"
                              : "#1e293b",
                            border: sparepart.installationComplete
                              ? "1.5px solid #059669"
                              : "none",
                            fontWeight: 600,
                            cursor: "default",
                            position: "relative",
                            transition: "all 0.2s",
                            verticalAlign: "middle",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            Pemasangan
                          </span>
                        </span>
                      </div>
                      {/* Step aktif di bawah progress utama */}
                      <div style={{ marginTop: "8px" }}>
                        {/* Progress utama Document aktif */}
                        {(() => {
                          const includeKelengkapanStep =
                            sparepart.includeKelengkapanStep !== false;
                          const DOCUMENT_STEPS = [
                            "Mengisi Permintaan",
                            "Menunggu Problem Report",
                            "Mengajukan Ke Vendor",
                            "Proses Nego Purchasing",
                            "Kelengkapan data",
                          ];
                          const stepCount = includeKelengkapanStep ? 5 : 4;
                          const docSteps = sparepart.documentSteps
                            ? sparepart.documentSteps.slice(0, stepCount)
                            : Array(stepCount).fill(false);
                          const documentStepIdx = docSteps.findIndex(
                            (done) => !done
                          );
                          const documentDone = documentStepIdx === -1;
                          if (!documentDone && documentStepIdx >= 0) {
                            return (
                              <span
                                style={{
                                  background: "#fee2e2",
                                  color: "#dc2626",
                                  borderRadius: "8px",
                                  padding: "2px 8px",
                                  fontWeight: 600,
                                  fontSize: "11px",
                                  boxShadow: "0 2px 8px rgba(220,38,38,0.08)",
                                  border: "1px solid #dc2626",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  minWidth: "max-content",
                                  height: "20px",
                                }}
                              >
                                {DOCUMENT_STEPS[documentStepIdx]}
                                <span
                                  style={{ marginLeft: 4, fontWeight: 700 }}
                                >
                                  !
                                </span>
                              </span>
                            );
                          }
                          return null;
                        })()}
                        {/* Progress utama Proses Order aktif */}
                        {(() => {
                          const includeKelengkapanStep =
                            sparepart.includeKelengkapanStep !== false;
                          const stepCount = includeKelengkapanStep ? 5 : 4;
                          const docSteps = sparepart.documentSteps
                            ? sparepart.documentSteps.slice(0, stepCount)
                            : Array(stepCount).fill(false);
                          const documentStepIdx = docSteps.findIndex(
                            (done) => !done
                          );
                          const documentDone = documentStepIdx === -1;
                          const orderSteps = sparepart.orderSteps
                            ? sparepart.orderSteps.slice(0, 3)
                            : Array(3).fill(false);
                          const orderStepIdx = orderSteps.findIndex(
                            (done) => !done
                          );
                          const orderDone = orderStepIdx === -1;
                          const ORDER_STEPS = [
                            "Approval GA",
                            "Approval PO",
                            "PO Dikirimkan",
                          ];
                          if (documentDone && !orderDone && orderStepIdx >= 0) {
                            return (
                              <span
                                style={{
                                  background: "#fee2e2",
                                  color: "#dc2626",
                                  borderRadius: "8px",
                                  padding: "2px 8px",
                                  fontWeight: 600,
                                  fontSize: "11px",
                                  boxShadow: "0 2px 8px rgba(220,38,38,0.08)",
                                  border: "1px solid #dc2626",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  minWidth: "max-content",
                                  height: "20px",
                                }}
                              >
                                {ORDER_STEPS[orderStepIdx]}
                                <span
                                  style={{ marginLeft: 4, fontWeight: 700 }}
                                >
                                  !
                                </span>
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default OperatorView;
