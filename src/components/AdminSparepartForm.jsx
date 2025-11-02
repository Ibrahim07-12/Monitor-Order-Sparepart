import React from "react";
import "./AdminSparepartForm.css";
import { FaTimes } from "react-icons/fa";

const AdminSparepartForm = ({
  show,
  onClose,
  formData,
  setFormData,
  modalMode,
  handleSubmit,
  currentAdminPlant,
}) => {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {modalMode === "add" ? "Add Sparepart Data" : "Edit Sparepart Data"}
          </h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="name">Sparepart Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="specification">Specification *</label>
              <textarea
                id="specification"
                value={formData.specification}
                onChange={(e) =>
                  setFormData({ ...formData, specification: e.target.value })
                }
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="machine">Machine *</label>
              <input
                type="text"
                id="machine"
                value={formData.machine}
                onChange={(e) =>
                  setFormData({ ...formData, machine: e.target.value })
                }
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="quantity">Jumlah *</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  required
                  style={{ width: "60%" }}
                />
                <input
                  type="text"
                  id="unit"
                  placeholder="Satuan (misal: unit, pcs, box, dll)"
                  value={formData.unit || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  required
                  style={{ width: "40%" }}
                />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="orderedBy">Ordered By *</label>
              <input
                type="text"
                id="orderedBy"
                value={formData.orderedBy}
                onChange={(e) =>
                  setFormData({ ...formData, orderedBy: e.target.value })
                }
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="orderDate">Order Date *</label>
              <input
                type="date"
                id="orderDate"
                value={formData.orderDate}
                onChange={(e) =>
                  setFormData({ ...formData, orderDate: e.target.value })
                }
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="vendor">Vendor Company *</label>
              <input
                type="text"
                id="vendor"
                value={formData.vendor}
                onChange={(e) =>
                  setFormData({ ...formData, vendor: e.target.value })
                }
                required
              />
            </div>
            {/* PROGRESS MULTI-STEP */}
            <div className="form-field">
              <label
                style={{
                  fontWeight: 600,
                  color: "#2563eb",
                  marginTop: 8,
                  fontSize: "1.05em",
                }}
              >
                Step Opsional
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 2,
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.includeKelengkapanStep || false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      includeKelengkapanStep: e.target.checked,
                    })
                  }
                  style={{
                    width: 18,
                    height: 18,
                    accentColor: "#2563eb",
                    marginRight: 2,
                  }}
                />
                <span
                  style={{ fontSize: "15px", color: "#222", fontWeight: 500 }}
                >
                  Sertakan langkah kelengkapan data (opsional)
                </span>
              </div>
            </div>
            <label
              style={{
                fontWeight: 600,
                color: "#2563eb",
                marginTop: 8,
                fontSize: "1.05em",
              }}
            >
              Progress Step Dokumen
            </label>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                marginBottom: 8,
              }}
            >
              {[
                "Mengisi Permintaan",
                "Menunggu Problem Report",
                "Mengajukan Ke Vendor",
                "Proses Nego",
                "Kelengkapan data",
              ].map((step, idx) => (
                <div
                  key={step}
                  style={{
                    display:
                      formData.includeKelengkapanStep || idx < 4
                        ? "inline-flex"
                        : "none",
                    alignItems: "center",
                    gap: 6,
                    background: "#f3f4f6",
                    borderRadius: 7,
                    padding: "6px 12px",
                    boxShadow: "0 1px 4px rgba(37,99,235,0.04)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.documentSteps?.[idx] || false}
                    onChange={(e) => {
                      const newSteps = formData.documentSteps
                        ? [...formData.documentSteps]
                        : Array(5).fill(false);
                      newSteps[idx] = e.target.checked;
                      setFormData({ ...formData, documentSteps: newSteps });
                    }}
                    style={{ width: 16, height: 16, accentColor: "#2563eb" }}
                  />
                  <span
                    style={{ fontSize: "13px", fontWeight: 500, color: "#222" }}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>
            <label
              style={{
                fontWeight: 600,
                color: "#2563eb",
                marginTop: 8,
                fontSize: "1.05em",
              }}
            >
              Progress Step Order
            </label>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                marginBottom: 8,
              }}
            >
              {["Approval GA", "Approval PO", "PO Dikirim"].map((step, idx) => (
                <div
                  key={step}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#f3f4f6",
                    borderRadius: 7,
                    padding: "6px 12px",
                    boxShadow: "0 1px 4px rgba(37,99,235,0.04)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.orderSteps?.[idx] || false}
                    onChange={(e) => {
                      const newSteps = formData.orderSteps
                        ? [...formData.orderSteps]
                        : Array(3).fill(false);
                      newSteps[idx] = e.target.checked;
                      setFormData({ ...formData, orderSteps: newSteps });
                    }}
                    style={{ width: 16, height: 16, accentColor: "#2563eb" }}
                  />
                  <span
                    style={{ fontSize: "13px", fontWeight: 500, color: "#222" }}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>
            <label
              style={{
                fontWeight: 600,
                color: "#2563eb",
                marginTop: 8,
                fontSize: "1.05em",
              }}
            >
              Status Barang
            </label>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                marginBottom: 8,
              }}
            >
              {["Sudah Datang", "Pemasangan"].map((step, idx) => (
                <div
                  key={step}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#f3f4f6",
                    borderRadius: 7,
                    padding: "6px 12px",
                    boxShadow: "0 1px 4px rgba(37,99,235,0.04)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      idx === 0
                        ? formData.arrivedComplete || false
                        : formData.installationComplete || false
                    }
                    onChange={(e) => {
                      if (idx === 0)
                        setFormData({
                          ...formData,
                          arrivedComplete: e.target.checked,
                        });
                      else
                        setFormData({
                          ...formData,
                          installationComplete: e.target.checked,
                        });
                    }}
                    style={{ width: 16, height: 16, accentColor: "#2563eb" }}
                  />
                  <span
                    style={{ fontSize: "13px", fontWeight: 500, color: "#222" }}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>
            <div className="form-field">
              <label htmlFor="plant">Plant *</label>
              <select
                id="plant"
                value={formData.plant || currentAdminPlant}
                onChange={(e) =>
                  setFormData({ ...formData, plant: e.target.value })
                }
                required
              >
                <option value="Foundry">Foundry</option>
                <option value="Assambely">Assambely</option>
                <option value="Fabrication">Fabrication</option>
                <option value="Hydraulic">Hydraulic</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="workOrderNumber">Work Order / Stock Number</label>
              <input
                type="text"
                id="workOrderNumber"
                value={formData.workOrderNumber}
                onChange={(e) =>
                  setFormData({ ...formData, workOrderNumber: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
            <div className="form-field">
              <label htmlFor="urgency">Urgency *</label>
              <select
                id="urgency"
                value={formData.urgency}
                onChange={(e) =>
                  setFormData({ ...formData, urgency: e.target.value })
                }
                required
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Catatan khusus (optional)"
                rows={3}
              />
            </div>
            <div className="form-field"></div>
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="modal-button secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="modal-button primary">
              {modalMode === "add" ? "Save" : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSparepartForm;
