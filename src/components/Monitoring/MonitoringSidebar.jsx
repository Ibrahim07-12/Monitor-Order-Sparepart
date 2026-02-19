import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaChevronLeft, FaCog } from "react-icons/fa";
import {
  setNotificationEnabled,
  subscribeToNotificationState,
} from "../../notificationState";

const MonitoringSidebar = ({
  machineName,
  onBack,
  onSelectSubMotor,
  onSetThreshold,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [notificationEnabled, setLocalNotificationEnabled] = useState(true);

  // Subscribe to global notification state
  useEffect(() => {
    const unsubscribe = subscribeToNotificationState((enabled) => {
      setLocalNotificationEnabled(enabled);
    });
    return unsubscribe;
  }, []);

  // Toggle notification function
  const handleToggleNotification = () => {
    setNotificationEnabled(!notificationEnabled);
  };
  const [components, setComponents] = useState([
    {
      id: 1,
      name: "Motor",
      subComponents: [
        { id: "motor-1", name: "Motor Mainshakeout" },
        { id: "motor-2", name: "Motor Vibrating Screen" },
        { id: "motor-3", name: "Motor Bucket Elevator" },
      ],
    },
  ]);

  const [selectedComponent, setSelectedComponent] = useState(null);
  const [selectedSubComponent, setSelectedSubComponent] = useState(null);
  const [expandedComponent, setExpandedComponent] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newComponentName, setNewComponentName] = useState("");

  const handleSelectSubComponent = (compId, subComp) => {
    setSelectedComponent(compId);
    setSelectedSubComponent(subComp.id);
    onSelectSubMotor(subComp.name);
  };

  const handleAddComponent = () => {
    if (newComponentName.trim()) {
      const newComp = {
        id: Date.now(),
        name: newComponentName.trim(),
        subComponents: [],
      };
      setComponents([...components, newComp]);
      setNewComponentName("");
      setShowAddModal(false);
    }
  };

  const handleDeleteComponent = (id) => {
    setComponents(components.filter((c) => c.id !== id));
    if (selectedComponent === id) {
      setSelectedComponent(null);
      setSelectedSubComponent(null);
    }
    setShowDeleteModal(false);
  };

  if (isCollapsed) {
    return (
      <div
        style={{
          width: "60px",
          background: "#1e293b",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px 0",
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
        }}
      >
        <button
          onClick={onToggleCollapse}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: "20px",
            cursor: "pointer",
            padding: "10px",
          }}
        >
          ☰
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "280px",
        background: "#1e293b",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
        position: "relative",
      }}
    >
      {/* Header */}
      <div style={{ padding: "24px", borderBottom: "1px solid #334155" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "#fff",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            Menu
          </h3>
          <button
            onClick={onToggleCollapse}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              fontSize: "18px",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ fontSize: "14px", color: "#94a3b8", fontWeight: 500 }}>
          {machineName}
        </div>
      </div>

      {/* Back Button */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #334155" }}>
        <button
          onClick={onBack}
          style={{
            width: "100%",
            padding: "12px 16px",
            background: "#dc2626",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.background = "#b91c1c")}
          onMouseOut={(e) => (e.target.style.background = "#dc2626")}
        >
          <FaChevronLeft /> Back
        </button>
      </div>

      {/* Components List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 0" }}>
        {components.map((comp) => (
          <div key={comp.id} style={{ marginBottom: "8px" }}>
            <button
              onClick={() =>
                setExpandedComponent(
                  expandedComponent === comp.id ? null : comp.id
                )
              }
              style={{
                width: "100%",
                padding: "12px 24px",
                background:
                  expandedComponent === comp.id ? "#334155" : "transparent",
                color: "#fff",
                border: "none",
                textAlign: "left",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => {
                if (expandedComponent !== comp.id)
                  e.target.style.background = "#2d3748";
              }}
              onMouseOut={(e) => {
                if (expandedComponent !== comp.id)
                  e.target.style.background = "transparent";
              }}
            >
              <span>{comp.name}</span>
              <span style={{ fontSize: "12px" }}>
                {expandedComponent === comp.id ? "▼" : "▶"}
              </span>
            </button>

            {/* Sub Components */}
            {expandedComponent === comp.id && comp.subComponents.length > 0 && (
              <div style={{ paddingLeft: "16px" }}>
                {comp.subComponents.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectSubComponent(comp.id, sub)}
                    style={{
                      width: "100%",
                      padding: "10px 24px",
                      background:
                        selectedSubComponent === sub.id
                          ? "#3b82f6"
                          : "transparent",
                      color:
                        selectedSubComponent === sub.id ? "#fff" : "#94a3b8",
                      border: "none",
                      textAlign: "left",
                      fontSize: "13px",
                      cursor: "pointer",
                      borderLeft:
                        selectedSubComponent === sub.id
                          ? "3px solid #60a5fa"
                          : "3px solid transparent",
                      transition: "all 0.2s",
                      fontWeight: selectedSubComponent === sub.id ? 600 : 400,
                    }}
                    onMouseOver={(e) => {
                      if (selectedSubComponent !== sub.id) {
                        e.target.style.background = "#2d3748";
                        e.target.style.color = "#fff";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedSubComponent !== sub.id) {
                        e.target.style.background = "transparent";
                        e.target.style.color = "#94a3b8";
                      }
                    }}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Threshold Button */}
      {selectedSubComponent && (
        <div style={{ padding: "16px 24px", borderTop: "1px solid #334155" }}>
          <button
            onClick={onSetThreshold}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "#f59e0b",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.background = "#d97706")}
            onMouseOut={(e) => (e.target.style.background = "#f59e0b")}
          >
            <FaCog /> Set Threshold
          </button>
        </div>
      )}

      {/* Notification Toggle Button */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid #334155" }}>
        <button
          onClick={handleToggleNotification}
          style={{
            width: "100%",
            padding: "12px 16px",
            background: notificationEnabled ? "#10b981" : "#64748b",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) =>
            (e.target.style.background = notificationEnabled
              ? "#059669"
              : "#475569")
          }
          onMouseOut={(e) =>
            (e.target.style.background = notificationEnabled
              ? "#10b981"
              : "#64748b")
          }
        >
          {notificationEnabled ? "🔔" : "🔕"}{" "}
          {notificationEnabled ? "Notifikasi Aktif" : "Notifikasi Mati"}
        </button>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          padding: "16px 24px",
          borderTop: "1px solid #334155",
          display: "flex",
          gap: "8px",
        }}
      >
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            flex: 1,
            padding: "10px",
            background: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.background = "#059669")}
          onMouseOut={(e) => (e.target.style.background = "#10b981")}
        >
          <FaPlus /> Add
        </button>
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={components.length <= 1}
          style={{
            flex: 1,
            padding: "10px",
            background: components.length <= 1 ? "#475569" : "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "13px",
            cursor: components.length <= 1 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            justifyContent: "center",
            opacity: components.length <= 1 ? 0.5 : 1,
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => {
            if (components.length > 1) e.target.style.background = "#dc2626";
          }}
          onMouseOut={(e) => {
            if (components.length > 1) e.target.style.background = "#ef4444";
          }}
        >
          <FaTrash /> Delete
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "24px",
              minWidth: "400px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "18px",
                fontWeight: 700,
                color: "#1e293b",
              }}
            >
              Tambah Komponen Baru
            </h3>
            <input
              type="text"
              placeholder="Nama komponen..."
              value={newComponentName}
              onChange={(e) => setNewComponentName(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                fontSize: "14px",
                marginBottom: "16px",
              }}
              onKeyPress={(e) => e.key === "Enter" && handleAddComponent()}
            />
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: "10px 20px",
                  background: "#e2e8f0",
                  color: "#475569",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                onClick={handleAddComponent}
                style={{
                  padding: "10px 20px",
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "24px",
              minWidth: "400px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "18px",
                fontWeight: 700,
                color: "#1e293b",
              }}
            >
              Pilih Komponen untuk Dihapus
            </h3>
            <div style={{ marginBottom: "16px" }}>
              {components.slice(1).map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => handleDeleteComponent(comp.id)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#fee2e2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor: "pointer",
                    marginBottom: "8px",
                    fontWeight: 500,
                    textAlign: "left",
                  }}
                >
                  <FaTrash style={{ marginRight: "8px" }} />
                  {comp.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowDeleteModal(false)}
              style={{
                width: "100%",
                padding: "10px 20px",
                background: "#e2e8f0",
                color: "#475569",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringSidebar;
