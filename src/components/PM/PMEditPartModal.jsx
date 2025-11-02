import React from "react";
import "./PMEditPartModal.css";

const DOCUMENT_STEPS = [
  "Mengisi Permintaan",
  "Menunggu Problem Report",
  "Mengajukan Ke Vendor",
  "Proses Nego",
  "Kelengkapan data",
];
const ORDER_STEPS = ["Approval GA", "Approval PO", "PO Dikirim"];

const inputStyle = {
  padding: "12px 14px",
  borderRadius: "8px",
  border: "1.5px solid #e5e7eb",
  fontSize: "15px",
  fontWeight: 500,
  outline: "none",
  marginBottom: 0,
};

const PMEditPartModal = ({
  editPartId,
  editPartData,
  setEditPartData,
  handleSaveEditPart,
  setEditPartId,
}) => {
  if (!editPartId || !editPartData) return null;

  return (
    <div
      className="pm-modal"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="pm-modal-content"
        style={{
          padding: "36px 32px",
          borderRadius: 18,
          boxShadow: "0 8px 32px rgba(37,99,235,0.10)",
          maxHeight: "80vh",
          overflowY: "auto",
          minWidth: "370px",
          background: "#fff",
          border: "1.5px solid #2563eb",
          position: "relative",
        }}
      >
        <h2
          style={{
            color: "#2563eb",
            fontWeight: 800,
            marginBottom: 22,
            letterSpacing: "-1px",
            fontSize: "1.45rem",
            textAlign: "center",
          }}
        >
          Edit Part Mesin
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveEditPart();
          }}
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 8,
            }}
          >
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
                name="hasKelengkapanStep"
                checked={editPartData.progress?.hasKelengkapanStep !== false}
                onChange={(e) =>
                  setEditPartData({
                    ...editPartData,
                    progress: {
                      ...editPartData.progress,
                      hasKelengkapanStep: e.target.checked,
                    },
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
                style={{
                  fontSize: "15px",
                  color: "#222",
                  fontWeight: 500,
                }}
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
            {DOCUMENT_STEPS.map((step, idx) => (
              <div
                key={step}
                style={{
                  display:
                    editPartData.progress?.hasKelengkapanStep !== false ||
                    idx < DOCUMENT_STEPS.length - 1
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
                  name={`documentStep${idx}`}
                  checked={
                    editPartData.progress?.documentSteps
                      ? editPartData.progress.documentSteps[idx]
                      : false
                  }
                  onChange={(e) => {
                    const newSteps = editPartData.progress?.documentSteps
                      ? [...editPartData.progress.documentSteps]
                      : Array(
                          editPartData.progress?.hasKelengkapanStep !== false
                            ? DOCUMENT_STEPS.length
                            : DOCUMENT_STEPS.length - 1
                        ).fill(false);
                    newSteps[idx] = e.target.checked;
                    setEditPartData({
                      ...editPartData,
                      progress: {
                        ...editPartData.progress,
                        documentSteps: newSteps,
                      },
                    });
                  }}
                  style={{
                    width: 16,
                    height: 16,
                    accentColor: "#2563eb",
                  }}
                />
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#222",
                  }}
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
            {ORDER_STEPS.map((step, idx) => (
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
                  name={`orderStep${idx}`}
                  checked={
                    editPartData.progress?.orderSteps
                      ? editPartData.progress.orderSteps[idx]
                      : false
                  }
                  onChange={(e) => {
                    const newSteps = editPartData.progress?.orderSteps
                      ? [...editPartData.progress.orderSteps]
                      : Array(ORDER_STEPS.length).fill(false);
                    newSteps[idx] = e.target.checked;
                    setEditPartData({
                      ...editPartData,
                      progress: {
                        ...editPartData.progress,
                        orderSteps: newSteps,
                      },
                    });
                  }}
                  style={{
                    width: 16,
                    height: 16,
                    accentColor: "#2563eb",
                  }}
                />
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#222",
                  }}
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
            <div
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
                name="arrivedStep"
                checked={editPartData.progress?.arrived || false}
                onChange={(e) =>
                  setEditPartData({
                    ...editPartData,
                    progress: {
                      ...editPartData.progress,
                      arrived: e.target.checked,
                    },
                  })
                }
                style={{
                  width: 16,
                  height: 16,
                  accentColor: "#2563eb",
                }}
              />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#222",
                }}
              >
                Sudah Datang
              </span>
            </div>
            <div
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
                name="pemasanganStep"
                checked={editPartData.progress?.pemasangan || false}
                onChange={(e) =>
                  setEditPartData({
                    ...editPartData,
                    progress: {
                      ...editPartData.progress,
                      pemasangan: e.target.checked,
                    },
                  })
                }
                style={{
                  width: 16,
                  height: 16,
                  accentColor: "#2563eb",
                }}
              />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#222",
                }}
              >
                Pemasangan
              </span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <input
              name="bagian"
              placeholder="Bagian Mesin"
              required
              style={{ ...inputStyle, marginBottom: 6 }}
              value={editPartData.bagian}
              onChange={(e) =>
                setEditPartData({
                  ...editPartData,
                  bagian: e.target.value,
                })
              }
            />
            <input
              name="nama"
              placeholder="Nama Sparepart"
              required
              style={{ ...inputStyle, marginBottom: 6 }}
              value={editPartData.nama}
              onChange={(e) =>
                setEditPartData({
                  ...editPartData,
                  nama: e.target.value,
                })
              }
            />
            <input
              name="spesifikasi"
              placeholder="Spesifikasi"
              required
              style={{ ...inputStyle, marginBottom: 6 }}
              value={editPartData.spesifikasi}
              onChange={(e) =>
                setEditPartData({
                  ...editPartData,
                  spesifikasi: e.target.value,
                })
              }
            />
            <input
              name="merek"
              placeholder="Merek"
              required
              style={{ ...inputStyle, marginBottom: 6 }}
              value={editPartData.merek}
              onChange={(e) =>
                setEditPartData({
                  ...editPartData,
                  merek: e.target.value,
                })
              }
            />
            <input
              name="stock"
              type="number"
              min="0"
              placeholder="Stock"
              required
              style={{ ...inputStyle, marginBottom: 6 }}
              value={editPartData.stock}
              onChange={(e) =>
                setEditPartData({
                  ...editPartData,
                  stock: e.target.value,
                })
              }
            />
            <label
              style={{
                fontWeight: 600,
                color: "#2563eb",
                marginBottom: 4,
              }}
            >
              Keterangan
            </label>
            <select
              name="keterangan"
              required
              style={{
                ...inputStyle,
                fontWeight: 600,
                marginBottom: 6,
              }}
              value={editPartData.keterangan || "Normal"}
              onChange={(e) =>
                setEditPartData({
                  ...editPartData,
                  keterangan: e.target.value,
                })
              }
            >
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <label
              style={{
                fontWeight: 600,
                color: "#2563eb",
                marginBottom: 4,
              }}
            >
              Tanggal Last PM
            </label>
            <input
              name="lastPM"
              type="date"
              required
              style={{ ...inputStyle, marginBottom: 6 }}
              value={editPartData.lastPM}
              onChange={(e) =>
                setEditPartData({
                  ...editPartData,
                  lastPM: e.target.value,
                })
              }
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <label
              style={{
                fontWeight: 600,
                color: "#2563eb",
                marginBottom: 4,
              }}
            >
              Tanggal Next PM
            </label>
            <input
              name="nextPM"
              type="date"
              required
              style={{ ...inputStyle, marginBottom: 6 }}
              value={editPartData.nextPM}
              onChange={(e) =>
                setEditPartData({
                  ...editPartData,
                  nextPM: e.target.value,
                })
              }
            />
          </div>
          <input
            name="jadwalPM"
            placeholder="Jadwal PM (misal: 6 Bulan)"
            required
            style={{ ...inputStyle, marginBottom: 6 }}
            value={editPartData.jadwalPM}
            onChange={(e) =>
              setEditPartData({
                ...editPartData,
                jadwalPM: e.target.value,
              })
            }
          />
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 22,
              justifyContent: "center",
            }}
          >
            <button
              type="submit"
              className="pm-action-btn"
              style={{
                background: "#2563eb",
                color: "#fff",
                fontWeight: 700,
                padding: "12px 32px",
                borderRadius: 10,
                fontSize: "1.08em",
                boxShadow: "0 2px 8px rgba(37,99,235,0.08)",
                border: "none",
                letterSpacing: "0.5px",
              }}
            >
              Simpan
            </button>
            <button
              type="button"
              className="pm-action-btn danger"
              style={{
                background: "#fff",
                color: "#dc2626",
                fontWeight: 700,
                padding: "12px 32px",
                borderRadius: 10,
                fontSize: "1.08em",
                border: "1.5px solid #fee2e2",
                boxShadow: "0 2px 8px rgba(220,38,38,0.08)",
                letterSpacing: "0.5px",
              }}
              onClick={() => {
                setEditPartId(null);
                setEditPartData(null);
              }}
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PMEditPartModal;
