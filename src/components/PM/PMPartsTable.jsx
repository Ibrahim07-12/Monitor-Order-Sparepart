import React from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import "./PMPartsTable.css";

const DOCUMENT_STEPS = [
  "Mengisi Permintaan",
  "Menunggu Problem Report",
  "Mengajukan Ke Vendor",
  "Proses Nego",
  "Kelengkapan data",
];
const ORDER_STEPS = ["Approval GA", "Approval PO", "PO Dikirim"];

const PMPartsTable = ({
  filteredParts,
  handleToggleStep,
  handleEditPart,
  handleDeletePart,
}) => {
  return (
    <div
      className="admin-table-container pm-drag-scroll"
      style={{
        padding: "10px 0",
        overflowX: "auto",
        cursor: "grab",
        userSelect: "none",
      }}
      onMouseDown={(e) => {
        const container = e.currentTarget;
        container.isDown = true;
        container.startX = e.pageX - container.offsetLeft;
        container.scrollLeftStart = container.scrollLeft;
        container.style.cursor = "grabbing";
      }}
      onMouseLeave={(e) => {
        const container = e.currentTarget;
        container.isDown = false;
        container.style.cursor = "grab";
      }}
      onMouseUp={(e) => {
        const container = e.currentTarget;
        container.isDown = false;
        container.style.cursor = "grab";
      }}
      onMouseMove={(e) => {
        const container = e.currentTarget;
        if (!container.isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - container.startX) * 1.5;
        container.scrollLeft = container.scrollLeftStart - walk;
      }}
    >
      <table
        className="admin-table pm-small-table"
        style={{ fontSize: "13px" }}
      >
        <thead>
          <tr style={{ height: "36px" }}>
            <th style={{ padding: "8px 6px" }}>Bagian Mesin</th>
            <th style={{ padding: "8px 6px" }}>Nama Sparepart</th>
            <th style={{ padding: "8px 6px" }}>Spesifikasi</th>
            <th style={{ padding: "8px 6px" }}>Merek</th>
            <th style={{ padding: "8px 6px" }}>Stock</th>
            <th style={{ padding: "8px 6px" }}>Last PM</th>
            <th style={{ padding: "8px 6px" }}>Next PM</th>
            <th style={{ padding: "8px 6px" }}>Keterangan</th>
            <th style={{ padding: "8px 6px" }}>Progress</th>
            <th style={{ padding: "8px 6px" }}>Jadwal PM</th>
            <th style={{ padding: "8px 6px" }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {filteredParts.length === 0 ? (
            <tr>
              <td colSpan={11} style={{ textAlign: "center", color: "#888" }}>
                Tidak ada data part untuk mesin ini.
              </td>
            </tr>
          ) : (
            filteredParts.map((part) => {
              // Progress logic
              // Step opsional: cek apakah step Kelengkapan data diaktifkan
              const hasKelengkapanStep =
                part.progress?.hasKelengkapanStep !== false;
              // Step Document
              const docSteps =
                part.progress?.documentSteps ||
                Array(
                  hasKelengkapanStep
                    ? DOCUMENT_STEPS.length
                    : DOCUMENT_STEPS.length - 1
                ).fill(false);
              const documentStepIdx = docSteps.findIndex((done) => !done);
              const documentDone = documentStepIdx === -1;
              // Step Order
              const orderSteps =
                part.progress?.orderSteps ||
                Array(ORDER_STEPS.length).fill(false);
              const orderStepIdx = orderSteps.findIndex((done) => !done);
              const orderDone = orderStepIdx === -1;
              return (
                <tr key={part.id} style={{ height: "32px" }}>
                  <td style={{ padding: "6px 4px" }}>
                    <strong style={{ fontSize: "13px" }}>{part.bagian}</strong>
                  </td>
                  <td style={{ padding: "6px 4px" }}>{part.nama}</td>
                  <td style={{ padding: "6px 4px" }}>{part.spesifikasi}</td>
                  <td style={{ padding: "6px 4px" }}>{part.merek}</td>
                  <td style={{ padding: "6px 4px", textAlign: "center" }}>
                    {part.stock}
                  </td>
                  <td style={{ padding: "6px 4px" }}>{part.lastPM}</td>
                  <td style={{ padding: "6px 4px" }}>{part.nextPM}</td>
                  <td style={{ padding: "6px 4px" }}>
                    <span
                      style={{
                        background:
                          part.keterangan === "Urgent" ? "#fee2e2" : "#dbeafe",
                        color:
                          part.keterangan === "Urgent" ? "#dc2626" : "#2563eb",
                        fontWeight: 600,
                        fontSize: "12px",
                        borderRadius: "8px",
                        padding: "4px 12px",
                        display: "inline-block",
                      }}
                    >
                      {part.keterangan || "Normal"}
                    </span>
                  </td>
                  <td style={{ padding: "6px 4px" }}>
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
                      <span
                        className={`step-toggle-table pm-small-badge`}
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
                          border: documentDone ? "1.5px solid #059669" : "none",
                          fontWeight: 600,
                          cursor: "pointer",
                          position: "relative",
                          transition: "all 0.2s",
                          animation: "none",
                          verticalAlign: "middle",
                        }}
                        onClick={() => {
                          if (documentDone) {
                            handleToggleStep(
                              part.id,
                              "document",
                              docSteps.length - 1
                            );
                          } else {
                            handleToggleStep(
                              part.id,
                              "document",
                              documentStepIdx
                            );
                          }
                        }}
                        title={
                          documentDone
                            ? "Klik untuk mundur ke step sebelumnya"
                            : "Klik untuk lanjut step dokumen"
                        }
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          Dokumen
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
                      {/* Step Proses Order */}
                      <span
                        className={`step-toggle-table pm-small-badge`}
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
                            (documentDone || part.keterangan === "Urgent")
                              ? "#e5e7eb"
                              : orderDone
                              ? "#d1fae5"
                              : "#e5e7eb",
                          color:
                            !orderDone &&
                            orderStepIdx >= 0 &&
                            (documentDone || part.keterangan === "Urgent")
                              ? "#1e293b"
                              : orderDone
                              ? "#059669"
                              : "#1e293b",
                          border: orderDone ? "1.5px solid #059669" : "none",
                          fontWeight: 600,
                          cursor: "pointer",
                          position: "relative",
                          transition: "all 0.2s",
                          animation: "none",
                          verticalAlign: "middle",
                        }}
                        onClick={() => {
                          if (orderDone) {
                            handleToggleStep(
                              part.id,
                              "order",
                              orderSteps.length - 1
                            );
                          } else if (
                            documentDone ||
                            part.keterangan === "Urgent"
                          ) {
                            handleToggleStep(part.id, "order", orderStepIdx);
                          }
                        }}
                        title={
                          orderDone
                            ? "Klik untuk mundur ke step sebelumnya"
                            : "Klik untuk lanjut step order"
                        }
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
                            (documentDone || part.keterangan === "Urgent") && (
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
                      {/* Step Sudah Datang */}
                      <span
                        className={`step-toggle-table pm-small-badge`}
                        style={{
                          fontSize: "12px",
                          padding: "4px 10px",
                          minWidth: "max-content",
                          height: "26px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: part.progress?.arrived
                            ? "#d1fae5"
                            : "#e5e7eb",
                          color: part.progress?.arrived ? "#059669" : "#1e293b",
                          border: part.progress?.arrived
                            ? "1.5px solid #059669"
                            : "none",
                          fontWeight: 600,
                          cursor: "pointer",
                          position: "relative",
                          transition: "all 0.2s",
                          verticalAlign: "middle",
                        }}
                        onClick={() => handleToggleStep(part.id, "arrived")}
                        title={
                          part.progress?.arrived
                            ? "Barang sudah datang"
                            : "Klik jika barang sudah datang"
                        }
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
                        className={`step-toggle-table pm-small-badge`}
                        style={{
                          fontSize: "12px",
                          padding: "4px 10px",
                          minWidth: "max-content",
                          height: "26px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: part.progress?.pemasangan
                            ? "#d1fae5"
                            : "#e5e7eb",
                          color: part.progress?.pemasangan
                            ? "#059669"
                            : "#1e293b",
                          border: part.progress?.pemasangan
                            ? "1.5px solid #059669"
                            : "none",
                          fontWeight: 600,
                          cursor: "pointer",
                          position: "relative",
                          transition: "all 0.2s",
                          verticalAlign: "middle",
                        }}
                        onClick={() => handleToggleStep(part.id, "pemasangan")}
                        title={
                          part.progress?.pemasangan
                            ? "Barang sudah terpasang"
                            : "Klik jika barang sudah terpasang"
                        }
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
                    {/* Multi step di bawah progress utama, hanya tampil step aktif sesuai progress utama */}
                    <div style={{ marginTop: "8px" }}>
                      {/* Progress utama Document aktif */}
                      {!documentDone && (
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
                          <span style={{ marginLeft: 4, fontWeight: 700 }}>
                            !
                          </span>
                        </span>
                      )}
                      {/* Progress utama Proses Order aktif */}
                      {documentDone && !orderDone && (
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
                          <span style={{ marginLeft: 4, fontWeight: 700 }}>
                            !
                          </span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "6px 4px", textAlign: "center" }}>
                    {part.jadwalPM}
                  </td>
                  <td style={{ padding: "6px 4px" }}>
                    <div
                      className="action-buttons"
                      style={{
                        gap: "8px",
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <button
                        className="icon-button edit"
                        style={{
                          background: "#e0e7ff",
                          color: "#2563eb",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                        onClick={() => handleEditPart(part.id)}
                        title="Edit Data"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        className="icon-button delete"
                        style={{
                          background: "#fee2e2",
                          color: "#dc2626",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                        onClick={() => handleDeletePart(part.id)}
                        title="Hapus Data"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PMPartsTable;
