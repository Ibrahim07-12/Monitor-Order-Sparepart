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
      <div className="operator-view">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="operator-view">
      <div className="operator-container">
        <div className="status-tabs">
          <div className="plant-buttons">
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
                    <td className="sparepart-name" data-label="Nama Sparepart">{sparepart.name}</td>
                    <td className="specification" data-label="Spesifikasi">{sparepart.specification}</td>
                    <td className="machine" data-label="Mesin">{sparepart.machine}</td>
                    <td className="quantity" data-label="Jumlah">{sparepart.quantity} unit</td>
                    <td className="ordered-by" data-label="Diorder Oleh">{sparepart.orderedBy}</td>
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
                      <div className="stepper-row small">
                        <span
                          className={`step-toggle-table small ${
                            sparepart.documentComplete
                              ? "step-complete"
                              : "step-pending"
                          }`}
                        >
                          Dokumen
                        </span>
                        <span
                          className={`step-toggle-table small ${
                            sparepart.onProcessComplete
                              ? "step-complete"
                              : "step-pending"
                          }`}
                        >
                          Proses Order
                        </span>
                        <span
                          className={`step-toggle-table small ${
                            sparepart.arrivedComplete
                              ? "step-complete"
                              : "step-pending"
                          }`}
                        >
                          Sudah Datang
                        </span>
                        <span
                          className={`step-toggle-table small ${
                            sparepart.installationComplete
                              ? "step-complete"
                              : "step-pending"
                          }`}
                        >
                          Pemasangan
                        </span>
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
