import React from "react";
import "./PMAddPartModal.css";

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

const PMAddPartModal = ({
  showAddModal,
  setShowAddModal,
  handleAddPart,
  addHasKelengkapanStep,
  setAddHasKelengkapanStep,
}) => {
  if (!showAddModal) return null;

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
          Tambah Part Mesin
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target;
            // Ambil status step dokumen
            const documentSteps = [];
            for (
              let i = 0;
              i <
              (addHasKelengkapanStep
                ? DOCUMENT_STEPS.length
                : DOCUMENT_STEPS.length - 1);
              i++
            ) {
              documentSteps.push(form[`documentStep${i}`].checked);
            }
            // Ambil status step order
            const orderSteps = [];
            for (let i = 0; i < ORDER_STEPS.length; i++) {
              orderSteps.push(form[`orderStep${i}`].checked);
            }
            handleAddPart({
              bagian: form.bagian.value,
              nama: form.nama.value,
              spesifikasi: form.spesifikasi.value,
              merek: form.merek.value,
              stock: Number(form.stock.value),
              lastPM: form.lastPM.value,
              nextPM: form.nextPM.value,
              jadwalPM: form.jadwalPM.value,
              keterangan: form.keterangan.value,
              progress: {
                documentSteps,
                orderSteps,
                arrived: form.arrivedStep.checked,
                pemasangan: form.pemasanganStep.checked,
                hasKelengkapanStep: addHasKelengkapanStep,
              },
            });
            setAddHasKelengkapanStep(true); // reset state
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
                checked={addHasKelengkapanStep}
                onChange={(e) => setAddHasKelengkapanStep(e.target.checked)}
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
                    addHasKelengkapanStep || idx < DOCUMENT_STEPS.length - 1
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
                  defaultChecked={false}
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
                  defaultChecked={false}
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
                defaultChecked={false}
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
                defaultChecked={false}
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
            />
            <input
              name="nama"
              placeholder="Nama Sparepart"
              required
              style={{ ...inputStyle, marginBottom: 6 }}
            />
            <input
              name="spesifikasi"
              placeholder="Spesifikasi"
              required
              style={{ ...inputStyle, marginBottom: 6 }}
            />
            <input
              name="merek"
              placeholder="Merek"
              required
              style={{ ...inputStyle, marginBottom: 6 }}
            />
            <input
              name="stock"
              type="number"
              min="0"
              placeholder="Stock"
              required
              style={{ ...inputStyle, marginBottom: 6 }}
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
              defaultValue="Normal"
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
            />
          </div>
          <input
            name="jadwalPM"
            placeholder="Jadwal PM (misal: 6 Bulan)"
            required
            style={{ ...inputStyle, marginBottom: 6 }}
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
                setShowAddModal(false);
                setAddHasKelengkapanStep(true);
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

export default PMAddPartModal;
