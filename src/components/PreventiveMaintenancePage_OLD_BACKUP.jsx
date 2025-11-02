import { useState } from "react";
import { FaSearch, FaPlus } from "react-icons/fa";
import React from "react";
import * as XLSX from "xlsx";
import { handleDownloadTemplateExcel, handleImportExcel } from "./PM/PMExcelUtils";
import PMPartsTable from "./PM/PMPartsTable";
import PMAddPartModal from "./PM/PMAddPartModal";
import PMEditPartModal from "./PM/PMEditPartModal";

const PLANTS = [
  "Foundry",
  "Assambly",
  "Fabrication",
  "Hydraulic",
  "KBN",
  "Cibitung",
];

const MESIN_FOUNDY = [
  "Shakeout Reguler",
  "Reclamation & Propulsor Reguler",
  "Shakeout Bigsize",
  "Reclamation & Propulsor Bigsize",
  "Mixer 30T",
];

const DOCUMENT_STEPS = [
  "Mengisi Permintaan",
  "Menunggu Problem Report",
  "Mengajukan Ke Vendor",
  "Proses Nego",
  "Kelengkapan data",
];
const ORDER_STEPS = ["Approval GA", "Approval PO", "PO Dikirim"];

// Data part per mesin, simpan di localStorage agar tidak hilang saat refresh
const STORAGE_KEY = "pm_parts_per_mesin";

const PreventiveMaintenancePage = () => {
  const [selectedPlant, setSelectedPlant] = useState("Foundry");
  const [selectedMesin, setSelectedMesin] = useState("");
  const [search, setSearch] = useState("");
  // State part per mesin
  // State untuk notifikasi PM mendekati
  const [showPmNotif, setShowPmNotif] = useState(false);
  const [pmNotifText, setPmNotifText] = useState("");
  const [partsPerMesin, setPartsPerMesin] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  // State untuk edit part
  const [editPartId, setEditPartId] = useState(null);
  const [editPartData, setEditPartData] = useState(null);
  const [pmInterval, setPmInterval] = useState("2024-07-10"); // tanggal next PM
  const [notifSetting, setNotifSetting] = useState(1); // bulan sebelum PM
  const [showAddModal, setShowAddModal] = useState(false);
  // State for add part modal: kelengkapan step
  const [addHasKelengkapanStep, setAddHasKelengkapanStep] = useState(true);
  const [mesinList, setMesinList] = useState(MESIN_FOUNDY);
  const [showAddMesinModal, setShowAddMesinModal] = useState(false);

  // Export Excel: import parts from uploaded Excel file (template)
  const handleExportExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      if (jsonData.length === 0) {
        alert("File Excel kosong!");
        return;
      }
      // Convert Excel data to part format
      // Normalisasi tanggal pada import Excel
      const MONTHS_ID = {
        januari: "01",
        Januari: "01",
        februari: "02",
        Februari: "02",
        maret: "03",
        Maret: "03",
        april: "04",
        April: "04",
        mei: "05",
        Mei: "05",
        juni: "06",
        Juni: "06",
        juli: "07",
        Juli: "07",
        agustus: "08",
        Agustus: "08",
        september: "09",
        September: "09",
        oktober: "10",
        Oktober: "10",
        november: "11",
        November: "11",
        desember: "12",
        Desember: "12",
      };
      const parseIndoDate = (val) => {
        if (!val) return "";
        if (typeof val === "string") {
          const regex = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/;
          const match = val.match(regex);
          if (match) {
            const day = match[1].padStart(2, "0");
            const monthRaw = match[2];
            const month =
              MONTHS_ID[monthRaw] || MONTHS_ID[monthRaw.toLowerCase()] || "01";
            const year = match[3];
            return `${year}-${month}-${day}`;
          }
          if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
        }
        if (val instanceof Date) {
          return val.toISOString().split("T")[0];
        }
        return String(val);
      };
      const importedParts = jsonData.map((row) => ({
        id: Date.now() + Math.random(),
        bagian: row["Bagian Mesin"] || "",
        nama: row["Nama Sparepart"] || "",
        spesifikasi: row["Spesifikasi"] || "",
        merek: row["Merek"] || "",
        stock: row["Stock"] || 0,
        lastPM: parseIndoDate(row["Last PM"] || ""),
        nextPM: parseIndoDate(row["Next PM"] || row["Jadwal PM"] || ""),
        keterangan: row["Keterangan"] || "Normal",
        progress: {
          document:
            row["Document"] === true ||
            row["Document"] === "TRUE" ||
            row["Document"] === "true",
          prosesOrder:
            row["ProsesOrder"] === true ||
            row["ProsesOrder"] === "TRUE" ||
            row["ProsesOrder"] === "true",
          arrived:
            row["SudahDatang"] === true ||
            row["SudahDatang"] === "TRUE" ||
            row["SudahDatang"] === "true",
          pemasangan:
            row["Pemasangan"] === true ||
            row["Pemasangan"] === "TRUE" ||
            row["Pemasangan"] === "true",
          documentSteps: [
            row["Dokumen - Mengisi Permintaan"] === true ||
              row["Dokumen - Mengisi Permintaan"] === "TRUE" ||
              row["Dokumen - Mengisi Permintaan"] === "true",
            row["Dokumen - Menunggu Problem Report"] === true ||
              row["Dokumen - Menunggu Problem Report"] === "TRUE" ||
              row["Dokumen - Menunggu Problem Report"] === "true",
            row["Dokumen - Mengajukan Ke Vendor"] === true ||
              row["Dokumen - Mengajukan Ke Vendor"] === "TRUE" ||
              row["Dokumen - Mengajukan Ke Vendor"] === "true",
            row["Dokumen - Proses Nego"] === true ||
              row["Dokumen - Proses Nego"] === "TRUE" ||
              row["Dokumen - Proses Nego"] === "true",
            row["Dokumen - Kelengkapan data"] === true ||
              row["Dokumen - Kelengkapan data"] === "TRUE" ||
              row["Dokumen - Kelengkapan data"] === "true",
          ],
          orderSteps: [
            row["Order - Approval GA"] === true ||
              row["Order - Approval GA"] === "TRUE" ||
              row["Order - Approval GA"] === "true",
            row["Order - Approval PO"] === true ||
              row["Order - Approval PO"] === "TRUE" ||
              row["Order - Approval PO"] === "true",
            row["Order - PO Dikirim"] === true ||
              row["Order - PO Dikirim"] === "TRUE" ||
              row["Order - PO Dikirim"] === "true",
          ],
        },
      }));
      const newList = [
        ...(partsPerMesin[selectedMesin] || []),
        ...importedParts,
      ];
      const updated = { ...partsPerMesin, [selectedMesin]: newList };
      setPartsPerMesin(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      alert(
        `Berhasil menambahkan ${importedParts.length} part ke mesin ${selectedMesin}`
      );
    } catch (error) {
      alert("Gagal membaca file Excel: " + error.message);
    }
    event.target.value = "";
  };

  // Hapus deklarasi mesinList lama, gunakan versi dinamis

  // Ambil list part untuk mesin yang dipilih
  // Handler untuk update progress step per part
  const handleToggleStep = (partId, type, stepIdx) => {
    const newList = (partsPerMesin[selectedMesin] || []).map((p) => {
      if (p.id !== partId) return p;
      let newProgress = { ...p.progress };
      if (type === "document") {
        let steps = newProgress.documentSteps
          ? [...newProgress.documentSteps]
          : Array(DOCUMENT_STEPS.length).fill(false);
        steps[stepIdx] = !steps[stepIdx];
        // Jika Urgent, semua step Document langsung true dan Order step pertama true
        if (p.keterangan === "Urgent") {
          steps = Array(DOCUMENT_STEPS.length).fill(true);
          let orderSteps = newProgress.orderSteps
            ? [...newProgress.orderSteps]
            : Array(ORDER_STEPS.length).fill(false);
          orderSteps[0] = true;
          newProgress.orderSteps = orderSteps;
        }
        newProgress.documentSteps = steps;
      } else if (type === "order") {
        let steps = newProgress.orderSteps
          ? [...newProgress.orderSteps]
          : Array(ORDER_STEPS.length).fill(false);
        steps[stepIdx] = !steps[stepIdx];
        newProgress.orderSteps = steps;
      } else if (type === "arrived") {
        newProgress.arrived = !newProgress.arrived;
      } else if (type === "pemasangan") {
        newProgress.pemasangan = !newProgress.pemasangan;
      }
      return { ...p, progress: newProgress };
    });
    const updated = { ...partsPerMesin, [selectedMesin]: newList };
    setPartsPerMesin(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };
  const parts = partsPerMesin[selectedMesin] || [];
  const filteredParts = parts.filter(
    (p) =>
      p.bagian?.toLowerCase().includes(search.toLowerCase()) ||
      p.nama?.toLowerCase().includes(search.toLowerCase())
  );

  // Notifikasi PM mendekati
  const showNotif = filteredParts.some((p) => {
    if (!p.nextPM) return false;
    const next = new Date(p.nextPM);
    const now = new Date();
    const diffMonth =
      (next.getFullYear() - now.getFullYear()) * 12 +
      (next.getMonth() - now.getMonth());
    return diffMonth <= notifSetting;
  });

  // Update notifikasi PM mendekati (di pojok kanan atas)
  // Notif muncul jika showNotif true dan mesin dipilih
  React.useEffect(() => {
    if (showNotif && selectedMesin) {
      setShowPmNotif(true);
      setPmNotifText(`${selectedMesin} Mendekati Waktu PM`);
    } else {
      setShowPmNotif(false);
      setPmNotifText("");
    }
  }, [showNotif, selectedMesin]);

  // Handler dummy
  // Tambah part ke mesin yang dipilih dan simpan ke localStorage
  const handleAddPart = (newPart) => {
    // Normalisasi tanggal
    const normalizedPart = {
      ...newPart,
      lastPM: parseIndoDate(newPart.lastPM || newPart["Last PM"]),
      nextPM: parseIndoDate(
        newPart.nextPM || newPart["Next PM"] || newPart["Jadwal PM"]
      ),
      keterangan: newPart.keterangan || "Normal",
      id: Date.now(),
    };
    const newList = [...(partsPerMesin[selectedMesin] || []), normalizedPart];
    const updated = { ...partsPerMesin, [selectedMesin]: newList };
    setPartsPerMesin(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setShowAddModal(false);
  };
  // Buka modal edit part
  const handleEditPart = (id) => {
    const part = (partsPerMesin[selectedMesin] || []).find((p) => p.id === id);
    setEditPartId(id);
    setEditPartData(part ? { ...part } : null);
  };
  // Simpan perubahan edit part
  const handleSaveEditPart = () => {
    if (!editPartData) return;
    const normalizedEdit = {
      ...editPartData,
      lastPM: parseIndoDate(editPartData.lastPM || editPartData["Last PM"]),
      nextPM: parseIndoDate(
        editPartData.nextPM ||
          editPartData["Next PM"] ||
          editPartData["Jadwal PM"]
      ),
      keterangan: editPartData.keterangan || "Normal",
    };
    const newList = (partsPerMesin[selectedMesin] || []).map((p) =>
      p.id === editPartId ? normalizedEdit : p
    );
    const updated = { ...partsPerMesin, [selectedMesin]: newList };
    setPartsPerMesin(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setEditPartId(null);
    setEditPartData(null);
  };
  // Hapus part dari mesin yang dipilih dan simpan ke localStorage
  const handleDeletePart = (id) => {
    if (window.confirm("Yakin ingin menghapus part ini?")) {
      const newList = (partsPerMesin[selectedMesin] || []).filter(
        (p) => p.id !== id
      );
      const updated = { ...partsPerMesin, [selectedMesin]: newList };
      setPartsPerMesin(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  return (
    <div className="pm-page" style={{ position: "relative" }}>
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
      <div className="pm-plant-select" style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 700, fontSize: "1.08em", marginRight: 10 }}>
          Pilih Plant:
        </label>
        <select
          value={selectedPlant}
          onChange={(e) => {
            setSelectedPlant(e.target.value);
            setSelectedMesin("");
          }}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "1.5px solid #2563eb",
            fontSize: "1em",
            fontWeight: 500,
            background: "#f3f4f6",
            color: "#222",
            outline: "none",
            boxShadow: "0 1px 6px rgba(37,99,235,0.07)",
            marginRight: 18,
            minWidth: 140,
            transition: "border 0.2s",
          }}
        >
          {PLANTS.map((plant) => (
            <option key={plant} value={plant}>
              {plant}
            </option>
          ))}
        </select>
      </div>
      <div className="pm-mesin-select" style={{ marginBottom: 32 }}>
        <label style={{ fontWeight: 700, fontSize: "1.08em", marginRight: 10 }}>
          Pilih Mesin:
        </label>
        <select
          value={selectedMesin}
          onChange={(e) => setSelectedMesin(e.target.value)}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "1.5px solid #2563eb",
            fontSize: "1em",
            fontWeight: 500,
            background: "#f3f4f6",
            color: "#222",
            outline: "none",
            boxShadow: "0 1px 6px rgba(37,99,235,0.07)",
            minWidth: 180,
            transition: "border 0.2s",
          }}
        >
          <option value="">-- Pilih Mesin --</option>
          {mesinList.map((mesin) => (
            <option key={mesin} value={mesin}>
              {mesin}
            </option>
          ))}
        </select>
        <div style={{ marginTop: 18 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 16,
              marginTop: 18,
            }}
          >
            <button
              className="action-button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 700,
                fontSize: "1.08em",
                padding: "12px 32px",
                borderRadius: 16,
                background: "linear-gradient(90deg,#1e3a8a 0%,#2563eb 100%)",
                color: "#fff",
                boxShadow: "0 2px 12px rgba(37,99,235,0.15)",
                border: "2px solid #1e3a8a",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onClick={() => setShowAddMesinModal(true)}
            >
              <FaPlus style={{ marginRight: "6px", fontSize: "1.2em" }} />
              Tambah Mesin
            </button>
            <button
              className="action-button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 700,
                fontSize: "1.08em",
                padding: "12px 32px",
                borderRadius: 16,
                background: "linear-gradient(90deg,#1e3a8a 0%,#2563eb 100%)",
                color: "#fff",
                boxShadow: "0 2px 12px rgba(37,99,235,0.15)",
                border: "2px solid #1e3a8a",
                cursor: selectedMesin ? "pointer" : "not-allowed",
                opacity: selectedMesin ? 1 : 0.6,
                transition: "background 0.2s",
              }}
              disabled={!selectedMesin}
              onClick={() => {
                if (selectedMesin) {
                  setMesinList(mesinList.filter((m) => m !== selectedMesin));
                  setSelectedMesin("");
                }
              }}
            >
              Hapus Mesin
            </button>
          </div>
        </div>
        {showAddMesinModal && (
          <div className="pm-modal">
            <div className="pm-modal-content">
              <h4>Tambah Mesin Baru</h4>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const namaMesin = e.target.namaMesin.value.trim();
                  if (namaMesin && !mesinList.includes(namaMesin)) {
                    setMesinList([...mesinList, namaMesin]);
                    setShowAddMesinModal(false);
                  }
                }}
              >
                <input name="namaMesin" placeholder="Nama Mesin" required />
                <div style={{ marginTop: "1rem" }}>
                  <button type="submit" className="pm-action-btn">
                    Simpan
                  </button>
                  <button
                    type="button"
                    className="pm-action-btn danger"
                    onClick={() => setShowAddMesinModal(false)}
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      {selectedMesin && (
        <div className="pm-mesin-card">
          <h3 className="pm-mesin-title">{selectedMesin}</h3>
          <img
            src={`/public/${selectedMesin}.png`}
            alt={selectedMesin}
            className="pm-mesin-img"
            style={{
              width: "100%",
              maxWidth: "700px",
              height: "auto",
              objectFit: "contain",
              margin: "0 auto 1.5rem auto",
              display: "block",
              borderRadius: "18px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
            }}
          />
          <div className="pm-settings-row">
            <div className="pm-setting">
              <label>Jadwal Next PM:</label>
              <input
                type="date"
                value={pmInterval}
                onChange={(e) => setPmInterval(e.target.value)}
              />
            </div>
            <div className="pm-setting">
              <label>Notif H- (bulan sebelum PM):</label>
              <input
                type="number"
                min={1}
                value={notifSetting}
                onChange={(e) => setNotifSetting(Number(e.target.value))}
              />
            </div>
          </div>
          {showNotif && (
            <div className="pm-notif">
              <span style={{ fontSize: "1.2em", marginRight: "0.5em" }}>
                ⚠️
              </span>
              Mesin ini mendekati jadwal PM!
            </div>
          )}
          <div
            className="pm-search-row"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <div
              className="pm-search-box"
              style={{ flex: "1 1 100%", minWidth: "250px" }}
            >
              <FaSearch className="pm-search-icon" />
              <input
                type="text"
                placeholder="Cari bagian/nama sparepart..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="pm-search-reset"
                  onClick={() => setSearch("")}
                >
                  Reset
                </button>
              )}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 12,
                width: "100%",
              }}
            >
              <button
                className="action-button primary"
                style={{
                  padding: "12px 18px",
                  fontWeight: 700,
                  fontSize: "1em",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flex: "1 1 auto",
                  minWidth: "150px",
                }}
                onClick={() => setShowAddModal(true)}
              >
                <FaPlus style={{ marginRight: "6px" }} />
                Tambah Part
              </button>
              <button
                className="action-button template"
                style={{
                  padding: "12px 18px",
                  fontWeight: 700,
                  fontSize: "1em",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  justifyContent: "center",
                  flex: "1 1 auto",
                  minWidth: "150px",
                }}
                onClick={() => {
                  if (!selectedMesin) {
                    alert("Pilih mesin terlebih dahulu!");
                    return;
                  }
                  try {
                    handleDownloadTemplateExcel(selectedMesin);
                  } catch (err) {
                    alert("Gagal download template: " + err.message);
                  }
                }}
                title="Unduh Template Excel"
                disabled={!selectedMesin}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Template
              </button>
              <label style={{ flex: "1 1 auto", minWidth: "150px" }}>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: "none" }}
                  onChange={handleExportExcel}
                  id="pm-export-excel-input"
                />
                <button
                  className="action-button export"
                  style={{
                    width: "100%",
                    padding: "12px 18px",
                    fontWeight: 700,
                    fontSize: "1em",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    justifyContent: "center",
                  }}
                  onClick={() =>
                    document.getElementById("pm-export-excel-input").click()
                  }
                  type="button"
                  title="Tambah List Part dari Excel"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <text x="7" y="16" fontSize="8" fill="white">
                      X
                    </text>
                  </svg>
                  Export Excel
                </button>
              </label>
              <button
                className="action-button upload"
                style={{
                  padding: "12px 18px",
                  fontWeight: 700,
                  fontSize: "1em",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  justifyContent: "center",
                  flex: "1 1 auto",
                  minWidth: "150px",
                }}
                onClick={() => {
                  if (!selectedMesin) {
                    alert("Pilih mesin terlebih dahulu!");
                    return;
                  }
                  try {
                    handleImportExcel(selectedMesin, partsPerMesin);
                  } catch (err) {
                    alert("Gagal export data part: " + err.message);
                  }
                }}
                type="button"
                title="Export semua data part ke Excel"
                disabled={!selectedMesin}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Import Excel
              </button>
            </div>
          </div>
          
          <PMPartsTable
            filteredParts={filteredParts}
            handleToggleStep={handleToggleStep}
            handleEditPart={handleEditPart}
            handleDeletePart={handleDeletePart}
          />
          
          {showAddModal && (
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
                        onChange={(e) =>
                          setAddHasKelengkapanStep(e.target.checked)
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
                            addHasKelengkapanStep ||
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
          )}
          {/* Modal Edit Part */}
          {editPartId && editPartData && (
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
                        checked={
                          editPartData.progress?.hasKelengkapanStep !== false
                        }
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
                            editPartData.progress?.hasKelengkapanStep !==
                              false || idx < DOCUMENT_STEPS.length - 1
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
                            const newSteps = editPartData.progress
                              ?.documentSteps
                              ? [...editPartData.progress.documentSteps]
                              : Array(
                                  editPartData.progress?.hasKelengkapanStep !==
                                    false
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
          )}
        </div>
      )}
    </div>
  );
};

// Style input modern
const inputStyle = {
  padding: "12px 14px",
  borderRadius: "8px",
  border: "1.5px solid #e5e7eb",
  fontSize: "15px",
  fontWeight: 500,
  outline: "none",
  marginBottom: 0,
};

export default PreventiveMaintenancePage;
