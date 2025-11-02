import React from "react";
import "./AdminSparepartTable.css";
import { FaEdit, FaTrash, FaEye, FaEyeSlash, FaBoxOpen } from "react-icons/fa";

const AdminSparepartTable = ({
  loading,
  visibleSpareparts,
  formatDate,
  handleEdit,
  handleDelete,
  handleToggleHide,
  updateSparepart,
}) => {
  // Drag scroll logic
  const dragRef = React.useRef(null);
  const isDownRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const scrollLeftStartRef = React.useRef(0);

  const handleMouseDown = (e) => {
    const container = dragRef.current;
    isDownRef.current = true;
    startXRef.current = e.pageX - container.offsetLeft;
    scrollLeftStartRef.current = container.scrollLeft;
    container.style.cursor = "grabbing";
  };
  const handleMouseLeave = () => {
    isDownRef.current = false;
    if (dragRef.current) dragRef.current.style.cursor = "grab";
  };
  const handleMouseUp = () => {
    isDownRef.current = false;
    if (dragRef.current) dragRef.current.style.cursor = "grab";
  };
  const handleMouseMove = (e) => {
    if (!isDownRef.current) return;
    e.preventDefault();
    const container = dragRef.current;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    container.scrollLeft = scrollLeftStartRef.current - walk;
  };

  return (
    <div
      ref={dragRef}
      className="admin-table-container pm-drag-scroll"
      style={{ overflowX: "auto", cursor: "grab", userSelect: "none" }}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : visibleSpareparts.length === 0 ? (
        <div className="empty-state-admin">
          <div className="empty-icon-admin">
            <FaBoxOpen />
          </div>
          <h3>Tidak ada data</h3>
          <p>Tidak ada sparepart yang sesuai kriteria</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nama Sparepart</th>
              <th>Spesifikasi</th>
              <th>Mesin</th>
              <th>Jumlah</th>
              <th>Diorder Oleh</th>
              <th>Tanggal Order</th>
              <th>Vendor</th>
              <th>Work Order/Stock</th>
              <th>Keterangan</th>
              <th>Progress</th>
              <th>Catatan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {visibleSpareparts.map((sparepart) => (
              <tr key={sparepart.id}>
                <td>
                  <strong>{sparepart.name}</strong>
                </td>
                <td>{sparepart.specification}</td>
                <td>{sparepart.machine}</td>
                <td>
                  {sparepart.quantity} {sparepart.unit || ""}
                </td>
                <td>{sparepart.orderedBy}</td>
                <td>{formatDate(sparepart.orderDate)}</td>
                <td>{sparepart.vendor}</td>
                <td>{sparepart.workOrderNumber || "-"}</td>
                <td>
                  <span
                    className={`urgency-badge ${
                      sparepart.urgency === "urgent" ? "urgent" : "normal"
                    }`}
                  >
                    {sparepart.urgency === "urgent" ? "Urgent" : "Normal"}
                  </span>
                </td>
                <td>
                  {/* Progress Stepper: 4 kotak ala PreventiveMaintenancePage */}
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
                            cursor: "pointer",
                            position: "relative",
                            transition: "all 0.2s",
                            // Tidak ada animasi kelap-kelip, hanya warna merah statis
                            animation: "none",
                            verticalAlign: "middle",
                          }}
                          onClick={async () => {
                            const newSteps = [...docSteps];
                            if (documentDone) {
                              newSteps[newSteps.length - 1] = false;
                            } else {
                              newSteps[documentStepIdx] = true;
                            }
                            let paddedSteps = newSteps;
                            if (includeKelengkapanStep) {
                              paddedSteps = [...newSteps, false].slice(0, 5);
                            } else {
                              paddedSteps = [...newSteps, false, false].slice(
                                0,
                                5
                              );
                            }
                            await updateSparepart(sparepart.id, {
                              documentSteps: paddedSteps,
                            });
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
                      const docSteps =
                        sparepart.documentSteps ||
                        Array(sparepart.includeKelengkapanStep ? 5 : 4).fill(
                          false
                        );
                      const documentStepIdx = docSteps.findIndex(
                        (done) => !done
                      );
                      const documentDone = documentStepIdx === -1;
                      const orderSteps =
                        sparepart.orderSteps || Array(3).fill(false);
                      const orderStepIdx = orderSteps.findIndex(
                        (done) => !done
                      );
                      const orderDone = orderStepIdx === -1;
                      const isUrgent = sparepart.urgency === "urgent";
                      const canClickOrder = isUrgent || documentDone;
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
                              !orderDone && orderStepIdx >= 0 && canClickOrder
                                ? "#e5e7eb"
                                : orderDone
                                ? "#d1fae5"
                                : "#e5e7eb",
                            color:
                              !orderDone && orderStepIdx >= 0 && canClickOrder
                                ? "#1e293b"
                                : orderDone
                                ? "#059669"
                                : "#1e293b",
                            border: orderDone ? "1.5px solid #059669" : "none",
                            fontWeight: 600,
                            cursor: canClickOrder ? "pointer" : "not-allowed",
                            position: "relative",
                            transition: "all 0.2s",
                            // Tidak ada animasi kelap-kelip, hanya warna merah statis
                            animation: "none",
                            verticalAlign: "middle",
                          }}
                          onClick={async () => {
                            if (!canClickOrder) return;
                            const newSteps = [...orderSteps];
                            if (orderDone) {
                              newSteps[newSteps.length - 1] = false;
                            } else {
                              newSteps[orderStepIdx] = true;
                            }
                            await updateSparepart(sparepart.id, {
                              orderSteps: newSteps,
                            });
                          }}
                          title={
                            orderDone
                              ? "Klik untuk mundur ke step sebelumnya"
                              : isUrgent
                              ? "(Urgent) Klik untuk lanjut step order"
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
                              canClickOrder && (
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
                        cursor: "pointer",
                        position: "relative",
                        transition: "all 0.2s",
                        verticalAlign: "middle",
                      }}
                      onClick={async () => {
                        await updateSparepart(sparepart.id, {
                          arrivedComplete: !sparepart.arrivedComplete,
                        });
                      }}
                      title={
                        sparepart.arrivedComplete
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
                        cursor: "pointer",
                        position: "relative",
                        transition: "all 0.2s",
                        verticalAlign: "middle",
                      }}
                      onClick={async () => {
                        await updateSparepart(sparepart.id, {
                          installationComplete: !sparepart.installationComplete,
                        });
                      }}
                      title={
                        sparepart.installationComplete
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
                  {/* Step aktif di bawah progress utama */}
                  <div style={{ marginTop: "8px" }}>
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
                            <span style={{ marginLeft: 4, fontWeight: 700 }}>
                              !
                            </span>
                          </span>
                        );
                      }
                      return null;
                    })()}
                    {(() => {
                      const docSteps =
                        sparepart.documentSteps ||
                        Array(sparepart.includeKelengkapanStep ? 5 : 4).fill(
                          false
                        );
                      const documentStepIdx = docSteps.findIndex(
                        (done) => !done
                      );
                      const documentDone = documentStepIdx === -1;
                      const orderSteps =
                        sparepart.orderSteps || Array(3).fill(false);
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
                            <span style={{ marginLeft: 4, fontWeight: 700 }}>
                              !
                            </span>
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </td>
                <td>
                  <div className="notes-cell">
                    {sparepart.notes || (
                      <span style={{ color: "#bbb" }}>No notes</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="icon-button edit"
                      onClick={() => handleEdit(sparepart)}
                      title="Edit Data"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="icon-button delete"
                      onClick={() => handleDelete(sparepart.id)}
                      title="Delete Data"
                    >
                      <FaTrash />
                    </button>
                    <button
                      className={`icon-button toggle-hide ${
                        sparepart.hiddenFromOperator ? "hidden" : ""
                      }`}
                      onClick={() =>
                        handleToggleHide(
                          sparepart.id,
                          sparepart.hiddenFromOperator
                        )
                      }
                      title={
                        sparepart.hiddenFromOperator
                          ? "Tampilkan di Operator"
                          : "Sembunyikan dari Operator"
                      }
                    >
                      {sparepart.hiddenFromOperator ? (
                        <FaEyeSlash />
                      ) : (
                        <FaEye />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminSparepartTable;
