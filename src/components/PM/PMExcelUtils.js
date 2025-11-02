import * as XLSX from "xlsx";

// Fungsi parsing tanggal Indonesia ke ISO
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

export const parseIndoDate = (val) => {
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

// Excel: Download Template
export function handleDownloadTemplateExcel(selectedMesin) {
  // Template columns match table section
  const templateData = [
    {
      "Bagian Mesin": "Contoh: Kompresor AC 7",
      "Nama Sparepart": "Contoh: Extension Kontaktor",
      Spesifikasi: "250A",
      Merek: "Contoh Merek",
      Stock: 1,
      "Last PM": "2025-11-04",
      "Next PM": "2027-10-28",
      Keterangan: "Normal/Urgent",
      Document: false,
      ProsesOrder: false,
      SudahDatang: false,
      Pemasangan: false,
      "Dokumen - Mengisi Permintaan": false,
      "Dokumen - Menunggu Problem Report": false,
      "Dokumen - Mengajukan Ke Vendor": false,
      "Dokumen - Proses Nego": false,
      "Dokumen - Kelengkapan data": false,
      "Order - Approval GA": false,
      "Order - Approval PO": false,
      "Order - PO Dikirim": false,
      "Jadwal PM": "2027-10-28",
    },
  ];
  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
  worksheet["!cols"] = Object.keys(templateData[0]).map(() => ({ wch: 20 }));
  const filename = `Template_${selectedMesin || "Mesin"}.xlsx`;
  // XLSX.writeFile fallback for browser compatibility
  let downloadSuccess = false;
  try {
    XLSX.writeFile(workbook, filename);
    downloadSuccess = true;
    alert(`Template Excel berhasil didownload: ${filename}`);
  } catch (err) {
    downloadSuccess = false;
  }
  if (!downloadSuccess) {
    // Fallback: create blob and anchor
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
    alert(`Template Excel berhasil didownload: ${filename}`);
  }
}

// Excel: Import data part mesin
// Import Excel: export all part data for selected mesin to Excel
export function handleImportExcel(selectedMesin, partsPerMesin) {
  // MIGRASI: Normalisasi semua tanggal part sebelum export
  const migrateParts = (parts) => {
    return parts.map((p) => ({
      ...p,
      lastPM: parseIndoDate(p.lastPM || p["Last PM"]),
      nextPM: parseIndoDate(p.nextPM || p["Next PM"] || p["Jadwal PM"]),
    }));
  };
  let parts = partsPerMesin[selectedMesin] || [];
  // Migrasi tanggal sebelum export
  parts = migrateParts(parts);
  if (parts.length === 0) {
    alert("Tidak ada data part untuk mesin ini.");
    return;
  }
  const excelData = parts.map((p, idx) => {
    const docSteps = p.progress?.documentSteps || [];
    const orderSteps = p.progress?.orderSteps || [];
    // Helper untuk ambil tanggal dari berbagai field
    const getDateValue = (field, fallbackFields = []) => {
      if (p[field]) return parseIndoDate(p[field]);
      for (const f of fallbackFields) {
        if (p[f]) return parseIndoDate(p[f]);
      }
      return "";
    };
    // Paksa parsing semua tanggal ke ISO
    const lastPM = parseIndoDate(getDateValue("lastPM", ["Last PM"]));
    const nextPM = parseIndoDate(getDateValue("nextPM", ["Next PM"]));
    const jadwalPM = parseIndoDate(getDateValue("nextPM", ["Jadwal PM"]));
    return {
      No: idx + 1,
      "Bagian Mesin": p.bagian,
      "Nama Sparepart": p.nama,
      Spesifikasi: p.spesifikasi,
      Merek: p.merek,
      Stock: p.stock,
      "Last PM": lastPM,
      "Next PM": nextPM,
      Keterangan: p.keterangan || "Normal",
      Document: docSteps.length > 0,
      ProsesOrder: orderSteps.length > 0,
      SudahDatang: p.progress?.arrived || false,
      Pemasangan: p.progress?.pemasangan || false,
      "Dokumen - Mengisi Permintaan": docSteps[0] || false,
      "Dokumen - Menunggu Problem Report": docSteps[1] || false,
      "Dokumen - Mengajukan Ke Vendor": docSteps[2] || false,
      "Dokumen - Proses Nego": docSteps[3] || false,
      "Dokumen - Kelengkapan data": docSteps[4] || false,
      "Order - Approval GA": orderSteps[0] || false,
      "Order - Approval PO": orderSteps[1] || false,
      "Order - PO Dikirim": orderSteps[2] || false,
      "Jadwal PM": jadwalPM,
    };
  });
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Part Mesin");
  worksheet["!cols"] = Object.keys(excelData[0] || {}).map(() => ({ wch: 18 }));
  const filename = `Part_${selectedMesin || "Mesin"}.xlsx`;
  XLSX.writeFile(workbook, filename);
  alert(`Data berhasil di-import ke Excel: ${filename}`);
}
