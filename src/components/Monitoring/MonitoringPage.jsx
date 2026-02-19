import React, { useState, useEffect } from "react";
import MonitoringSidebar from "./MonitoringSidebar";
import MonitoringDashboard from "./MonitoringDashboard";
import MonitoringThreshold from "./MonitoringThreshold";

const MonitoringPage = ({ machineName, onBack }) => {
  const [selectedSubMotor, setSelectedSubMotor] = useState(null);
  const [showThreshold, setShowThreshold] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#f8f9fa",
      }}
    >
      {/* Sidebar */}
      <MonitoringSidebar
        machineName={machineName}
        onBack={onBack}
        onSelectSubMotor={setSelectedSubMotor}
        onSetThreshold={() => setShowThreshold(true)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
        {showThreshold ? (
          <MonitoringThreshold
            selectedSubMotor={selectedSubMotor}
            onBack={() => setShowThreshold(false)}
          />
        ) : (
          <MonitoringDashboard
            selectedMotor={machineName}
            selectedSubMotor={selectedSubMotor}
          />
        )}
      </div>
    </div>
  );
};

export default MonitoringPage;
