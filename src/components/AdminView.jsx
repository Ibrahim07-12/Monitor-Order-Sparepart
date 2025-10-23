import { useState, useEffect } from "react";
import {
  subscribeToSpareparts,
  addSparepart,
  updateSparepart,
  markAsArrived,
  deleteSparepart,
  bulkAddSpareparts,
  subscribeToAppSettings,
  setAppSetting,
} from "../firestore";
import {
  FaPlus,
  FaHistory,
  FaSearch,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaTrash,
  FaTimes,
  FaBoxOpen,
  FaFileExcel,
  FaDownload,
  FaEye,
  FaEyeSlash,
  FaFileAlt,
  FaTools,
  FaWrench,
  FaUpload,
  FaExclamationCircle,
} from "react-icons/fa";
import { Timestamp } from "firebase/firestore";
import * as XLSX from "xlsx";
import "./AdminView.css";

const AdminView = ({ adminPlant }) => {
  const [spareparts, setSpareparts] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // add or edit
  const [editingId, setEditingId] = useState(null);
  const [showHiddenItems, setShowHiddenItems] = useState(false);
  const currentAdminPlant =
    adminPlant || localStorage.getItem("adminPlant") || "Foundry";

  const [searchFilters, setSearchFilters] = useState({
    name: "",
    specification: "",
    machine: "",
    vendor: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    specification: "",
    machine: "",
    quantity: "",
    orderedBy: "",
    orderDate: "",
    vendor: "",
    status: "menunggu",
    workOrderNumber: "",
    urgency: "normal",
    notes: "",
    documentComplete: false,
    onProcessComplete: false,
    arrivedComplete: false,
    installationComplete: false,
    installationStatus: "not_installed",
  });

  // Auto-scroll settings (admin controls)
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(20);
  useEffect(() => {
    const unsub = subscribeToAppSettings((res) => {
      console.debug("subscribeToAppSettings (admin) ->", res);
      if (res.success) {
        setAutoScrollEnabled(!!res.data.autoScrollEnabled);
        if (typeof res.data.autoScrollSpeed !== "undefined") {
          setAutoScrollSpeed(Number(res.data.autoScrollSpeed));
        }
      }
    });
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = subscribeToSpareparts((result) => {
      if (result.success) {
        setSpareparts(result.data);
        // Apply currentAdminPlant filter immediately
        const plantFiltered = result.data.filter(
          (item) => (item.plant || "") === currentAdminPlant
        );
        setFilteredData(plantFiltered);
      } else {
        alert("Failed to load data: " + result.error);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Re-filter when currentAdminPlant or spareparts change
  useEffect(() => {
    const plantFiltered = spareparts.filter(
      (item) => (item.plant || "") === currentAdminPlant
    );
    // Also respect search filters
    setFilteredData(plantFiltered);
  }, [currentAdminPlant, spareparts]);

  // Auto-reload when all search filters are cleared
  useEffect(() => {
    const allEmpty = Object.values(searchFilters).every(
      (value) => value.trim() === ""
    );
    if (allEmpty) {
      setFilteredData(spareparts);
    }
  }, [searchFilters, spareparts]);

  const handleSearch = () => {
    const hasFilter = Object.values(searchFilters).some(
      (value) => value.trim() !== ""
    );

    if (!hasFilter) {
      // If no search filters, show items for current plant
      const plantFiltered = spareparts.filter(
        (item) => (item.plant || "") === currentAdminPlant
      );
      setFilteredData(plantFiltered);
      return;
    }

    let filtered = spareparts.filter(
      (item) => (item.plant || "") === currentAdminPlant
    );

    if (searchFilters.name.trim()) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchFilters.name.toLowerCase())
      );
    }

    if (searchFilters.specification.trim()) {
      filtered = filtered.filter((item) =>
        item.specification
          .toLowerCase()
          .includes(searchFilters.specification.toLowerCase())
      );
    }

    if (searchFilters.machine.trim()) {
      filtered = filtered.filter((item) =>
        item.machine.toLowerCase().includes(searchFilters.machine.toLowerCase())
      );
    }

    if (searchFilters.vendor.trim()) {
      filtered = filtered.filter((item) =>
        item.vendor.toLowerCase().includes(searchFilters.vendor.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  const handleAddNew = () => {
    setModalMode("add");
    setEditingId(null);
    setFormData({
      name: "",
      specification: "",
      machine: "",
      quantity: "",
      orderedBy: "",
      orderDate: new Date().toISOString().split("T")[0],
      vendor: "",
      plant: currentAdminPlant,
      status: "menunggu",
      workOrderNumber: "",
      urgency: "normal",
      notes: "",
      documentComplete: false,
      onProcessComplete: false,
      arrivedComplete: false,
      installationComplete: false,
    });
    setShowModal(true);
  };

  const handleEdit = (sparepart) => {
    setModalMode("edit");
    setEditingId(sparepart.id);

    // Convert Firestore Timestamp to date string
    const orderDate = sparepart.orderDate?.toDate
      ? sparepart.orderDate.toDate().toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    setFormData({
      name: sparepart.name,
      plant: sparepart.plant || currentAdminPlant,
      specification: sparepart.specification,
      machine: sparepart.machine,
      quantity: sparepart.quantity?.toString() || "",
      orderedBy: sparepart.orderedBy,
      orderDate: orderDate,
      vendor: sparepart.vendor,
      status: sparepart.status,
      workOrderNumber: sparepart.workOrderNumber || "",
      urgency: sparepart.urgency || "normal",
      notes: sparepart.notes || "",
      documentComplete: !!sparepart.documentComplete,
      onProcessComplete: !!sparepart.onProcessComplete,
      arrivedComplete: !!sparepart.arrivedComplete,
      installationComplete: !!sparepart.installationComplete,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const sparepartData = {
      name: formData.name,
      specification: formData.specification,
      machine: formData.machine,
      quantity: parseInt(formData.quantity),
      orderedBy: formData.orderedBy,
      orderDate: Timestamp.fromDate(new Date(formData.orderDate)),
      vendor: formData.vendor,
      status: formData.status,
      workOrderNumber: formData.workOrderNumber,
      urgency: formData.urgency,
      plant: formData.plant || currentAdminPlant,
      notes: formData.notes,
      documentComplete: !!formData.documentComplete,
      onProcessComplete: !!formData.onProcessComplete,
      arrivedComplete: !!formData.arrivedComplete,
      installationComplete: !!formData.installationComplete,
    };

    let result;
    if (modalMode === "add") {
      result = await addSparepart(sparepartData);
    } else {
      result = await updateSparepart(editingId, sparepartData);
    }

    if (result.success) {
      setShowModal(false);
      alert(
        modalMode === "add"
          ? "Data successfully added"
          : "Data successfully updated"
      );
    } else {
      alert("Failed to save data: " + result.error);
    }
  };

  const handleMarkAsArrived = async (id) => {
    if (window.confirm("Mark this sparepart as arrived?")) {
      const result = await markAsArrived(id);
      if (result.success) {
        alert("Status successfully updated");
      } else {
        alert("Failed to update status: " + result.error);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this data?")) {
      const result = await deleteSparepart(id);
      if (result.success) {
        alert("Data successfully deleted");
      } else {
        alert("Failed to delete data: " + result.error);
      }
    }
  };

  const handleToggleHide = async (id, currentHiddenState) => {
    const updateData = {
      hiddenFromOperator: !currentHiddenState,
    };

    const result = await updateSparepart(id, updateData);
    if (!result.success) {
      alert("Failed to toggle visibility: " + result.error);
    }
  };

  const handleToggleDocumentStatus = async (id, currentStatus) => {
    const newStatus =
      currentStatus === "complete" ? "waiting_docs" : "complete";
    const result = await updateSparepart(id, { documentStatus: newStatus });
    if (!result.success) {
      alert("Failed to update document status: " + result.error);
    }
  };

  const handleToggleInstallationStatus = async (id, currentStatus) => {
    let newStatus;
    if (currentStatus === "not_installed") newStatus = "installing";
    else if (currentStatus === "installing") newStatus = "installed";
    else newStatus = "not_installed";

    const result = await updateSparepart(id, { installationStatus: newStatus });
    if (!result.success) {
      alert("Failed to update installation status: " + result.error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleDownloadTemplate = () => {
    // Create template data
    const templateData = [
      {
        "Sparepart Name": "Example: Ball Valve",
        Specification: "1/2 inch",
        Machine: "Mixer 30T",
        QTY: 2,
        "Ordered By": "John Doe",
        "Order Date": "2025-10-20",
        Vendor: "PT Example Vendor",
        "Work Order/Stock": "WO12345",
        Document: true,
        "On Process": false,
        Arrived: false,
        Installation: false,
        Notes: "Catatan contoh",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    // Auto-size columns
    const maxWidth = 20;
    const wscols = Object.keys(templateData[0]).map(() => ({ wch: maxWidth }));
    worksheet["!cols"] = wscols;

    // Generate filename with date
    const date = new Date().toISOString().split("T")[0];
    const filename = `Sparepart_Template_${date}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
  };

  const handleUploadExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert("Excel file is empty!");
        return;
      }

      // Convert Excel data to sparepart format
      const sparepartsToAdd = jsonData.map((row) => {
        // Parse order date from dd/mm/yyyy or yyyy-mm-dd
        let orderDateRaw = row["Order Date"];
        let orderDateObj = new Date();
        if (orderDateRaw) {
          if (typeof orderDateRaw === "string") {
            // Try dd/mm/yyyy first
            const match = orderDateRaw.match(
              /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
            );
            if (match) {
              // dd/mm/yyyy
              const day = parseInt(match[1], 10);
              const month = parseInt(match[2], 10) - 1; // JS months 0-based
              const year = parseInt(match[3], 10);
              orderDateObj = new Date(year, month, day);
            } else {
              // Try ISO (yyyy-mm-dd)
              const isoMatch = orderDateRaw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
              if (isoMatch) {
                orderDateObj = new Date(orderDateRaw);
              } else {
                // fallback: try Date parse
                const tryDate = new Date(orderDateRaw);
                if (!isNaN(tryDate.getTime())) orderDateObj = tryDate;
              }
            }
          } else if (orderDateRaw instanceof Date) {
            orderDateObj = orderDateRaw;
          }
        }
        return {
          name: row["Sparepart Name"] || "",
          specification: row["Specification"] || "",
          machine: row["Machine"] || "",
          quantity: parseInt(row["QTY"]) || 1,
          orderedBy: row["Ordered By"] || "",
          orderDate: Timestamp.fromDate(orderDateObj),
          vendor: row["Vendor"] || "",
          workOrderNumber: row["Work Order/Stock"] || "",
          documentComplete: Boolean(row["Document"]),
          onProcessComplete: Boolean(row["On Process"]),
          arrivedComplete: Boolean(row["Arrived"]),
          installationComplete: Boolean(row["Installation"]),
          notes: row["Notes"] || "",
          status: "menunggu",
          urgency: "normal",
          plant: row["Plant"] || currentAdminPlant,
        };
      });

      // Bulk add to Firestore
      const result = await bulkAddSpareparts(sparepartsToAdd);
      if (result.success) {
        alert(`Successfully imported ${result.count} spareparts!`);
        event.target.value = ""; // Reset file input
      } else {
        alert("Failed to import data: " + result.error);
      }
    } catch (error) {
      alert("Error reading Excel file: " + error.message);
    }
  };

  const handleExportToExcel = () => {
    if (spareparts.length === 0) {
      alert("No data to export");
      return;
    }

    // Prepare data for Excel
    const excelData = spareparts.map((item, index) => ({
      No: index + 1,
      "Sparepart Name": item.name,
      Specification: item.specification,
      Machine: item.machine,
      QTY: item.quantity,
      "Ordered By": item.orderedBy,
      "Order Date": formatDate(item.orderDate),
      Vendor: item.vendor,
      Plant: item.plant || "",
      "Work Order/Stock": item.workOrderNumber || "-",
      Document: item.documentComplete ? true : false,
      "On Process": item.onProcessComplete ? true : false,
      Arrived: item.arrivedComplete ? true : false,
      Installation: item.installationComplete ? true : false,
      Notes: item.notes || "",
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sparepart Data");

    // Auto-size columns
    const maxWidth = 30;
    const columnWidths = Object.keys(excelData[0]).map((key) => ({
      wch: Math.min(
        Math.max(
          key.length,
          ...excelData.map((row) => String(row[key]).length)
        ) + 2,
        maxWidth
      ),
    }));
    worksheet["!cols"] = columnWidths;

    // Generate filename with current date
    const currentDate = new Date().toISOString().split("T")[0];
    const filename = `Sparepart_Data_${currentDate}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
    alert(`Data successfully exported to ${filename}`);
  };

  // Filter data based on showHiddenItems toggle
  const visibleSpareparts = showHiddenItems
    ? filteredData
    : filteredData.filter((item) => !item.hiddenFromOperator);

  return (
    <div className="admin-view">
      <div className="admin-container">
        <div className="admin-header">
          <div className="admin-header-left">
            <h2>Manajemen Data Sparepart</h2>
          </div>
          <div className="admin-actions">
            <input
              type="file"
              id="excel-upload"
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              onChange={handleUploadExcel}
            />
            <button
              className="action-button template"
              onClick={handleDownloadTemplate}
              title="Unduh Template Excel"
            >
              <FaDownload />
              Template
            </button>
            <button
              className="action-button upload"
              onClick={() => document.getElementById("excel-upload").click()}
              title="Unggah File Excel"
            >
              <FaUpload />
              Import Excel
            </button>
            <button
              className="action-button export"
              onClick={handleExportToExcel}
              disabled={spareparts.length === 0}
              title="Ekspor data ke Excel"
            >
              <FaFileExcel />
              Export Excel
            </button>
            <button
              className={`action-button toggle-auto-scroll ${
                autoScrollEnabled ? "on" : "off"
              }`}
              onClick={async () => {
                const newVal = !autoScrollEnabled;
                const res = await setAppSetting("autoScrollEnabled", newVal);
                if (res.success) setAutoScrollEnabled(newVal);
                else alert("Gagal menyimpan setting: " + res.error);
              }}
              title={
                autoScrollEnabled
                  ? "Matikan Auto Scroll"
                  : "Nyalakan Auto Scroll"
              }
            >
              {autoScrollEnabled ? "Auto Scroll: On" : "Auto Scroll: Off"}
            </button>
            <div
              className="action-control speed-control"
              style={{ display: "inline-block", marginLeft: 12 }}
            >
              <label
                style={{ display: "block", fontSize: 12, marginBottom: 4 }}
              >
                Kecepatan Scroll: {autoScrollSpeed} px/s
              </label>
              <input
                type="range"
                min={5}
                max={200}
                value={autoScrollSpeed}
                onChange={async (e) => {
                  const v = Number(e.target.value);
                  setAutoScrollSpeed(v);
                  const res = await setAppSetting("autoScrollSpeed", v);
                  if (!res.success)
                    alert("Gagal menyimpan kecepatan: " + res.error);
                }}
              />
            </div>
            <button
              className="action-button toggle-hidden"
              onClick={() => setShowHiddenItems(!showHiddenItems)}
              title={showHiddenItems ? "Sembunyikan arsip" : "Tampilkan arsip"}
            >
              {showHiddenItems ? <FaEyeSlash /> : <FaEye />}
              {showHiddenItems ? "Sembunyikan Arsip" : "Tampilkan Arsip"}
            </button>
            <button className="action-button primary" onClick={handleAddNew}>
              <FaPlus />
              Tambah Data
            </button>
          </div>
        </div>

        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="Nama Sparepart..."
              value={searchFilters.name}
              onChange={(e) =>
                setSearchFilters({ ...searchFilters, name: e.target.value })
              }
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <input
              type="text"
              className="search-input"
              placeholder="Spesifikasi..."
              value={searchFilters.specification}
              onChange={(e) =>
                setSearchFilters({
                  ...searchFilters,
                  specification: e.target.value,
                })
              }
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <input
              type="text"
              className="search-input"
              placeholder="Mesin..."
              value={searchFilters.machine}
              onChange={(e) =>
                setSearchFilters({ ...searchFilters, machine: e.target.value })
              }
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <input
              type="text"
              className="search-input"
              placeholder="Vendor..."
              value={searchFilters.vendor}
              onChange={(e) =>
                setSearchFilters({ ...searchFilters, vendor: e.target.value })
              }
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <button className="search-button" onClick={handleSearch}>
              <FaSearch />
              Cari
            </button>
          </div>
        </div>

        <div className="admin-table-container">
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
                    <td>{sparepart.quantity} unit</td>
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
                      <div className="stepper-row">
                        <button
                          type="button"
                          className={`step-toggle-table ${
                            sparepart.documentComplete
                              ? "step-complete"
                              : "step-pending"
                          }`}
                          onClick={() =>
                            updateSparepart(sparepart.id, {
                              documentComplete: !sparepart.documentComplete,
                            })
                          }
                        >
                          Document
                        </button>
                        <button
                          type="button"
                          className={`step-toggle-table ${
                            sparepart.onProcessComplete ||
                            (sparepart.urgency === "urgent" &&
                              (sparepart.onProcessComplete ||
                                sparepart.arrivedComplete))
                              ? "step-complete"
                              : "step-pending"
                          }`}
                          onClick={() =>
                            updateSparepart(sparepart.id, {
                              onProcessComplete: !sparepart.onProcessComplete,
                            })
                          }
                          // Untuk urgent, tombol tidak disable
                          disabled={
                            sparepart.urgency !== "urgent" &&
                            !sparepart.documentComplete
                          }
                        >
                          On Process
                        </button>
                        <button
                          type="button"
                          className={`step-toggle-table ${
                            sparepart.arrivedComplete ||
                            (sparepart.urgency === "urgent" &&
                              sparepart.arrivedComplete)
                              ? "step-complete"
                              : "step-pending"
                          }`}
                          onClick={() =>
                            updateSparepart(sparepart.id, {
                              arrivedComplete: !sparepart.arrivedComplete,
                            })
                          }
                          // Untuk urgent, tombol tidak disable
                          disabled={
                            sparepart.urgency !== "urgent" &&
                            !sparepart.onProcessComplete
                          }
                        >
                          Arrived
                        </button>
                        <button
                          type="button"
                          className={`step-toggle-table ${
                            sparepart.installationComplete
                              ? "step-complete"
                              : "step-pending"
                          }`}
                          onClick={() =>
                            updateSparepart(sparepart.id, {
                              installationComplete:
                                !sparepart.installationComplete,
                            })
                          }
                          disabled={!sparepart.arrivedComplete}
                        >
                          Installation
                        </button>
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
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalMode === "add"
                  ? "Add Sparepart Data"
                  : "Edit Sparepart Data"}
              </h3>
              <button
                className="close-button"
                onClick={() => setShowModal(false)}
              >
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
                      setFormData({
                        ...formData,
                        specification: e.target.value,
                      })
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
                  <label htmlFor="quantity">QTY *</label>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    required
                  />
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
                  <label htmlFor="workOrderNumber">
                    Work Order / Stock Number
                  </label>
                  <input
                    type="text"
                    id="workOrderNumber"
                    value={formData.workOrderNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        workOrderNumber: e.target.value,
                      })
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

                <div className="form-field">
                  <label>Order Progress Steps</label>
                  <div className="step-toggle-group">
                    <button
                      type="button"
                      className={`step-toggle ${
                        formData.documentComplete
                          ? "step-complete"
                          : "step-pending"
                      }`}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          documentComplete: !formData.documentComplete,
                        })
                      }
                    >
                      Document
                    </button>
                    <button
                      type="button"
                      className={`step-toggle ${
                        formData.onProcessComplete
                          ? "step-complete"
                          : "step-pending"
                      }`}
                      onClick={() =>
                        formData.documentComplete &&
                        setFormData({
                          ...formData,
                          onProcessComplete: !formData.onProcessComplete,
                        })
                      }
                      disabled={!formData.documentComplete}
                    >
                      On Process Order
                    </button>
                    <button
                      type="button"
                      className={`step-toggle ${
                        formData.arrivedComplete
                          ? "step-complete"
                          : "step-pending"
                      }`}
                      onClick={() =>
                        formData.onProcessComplete &&
                        setFormData({
                          ...formData,
                          arrivedComplete: !formData.arrivedComplete,
                        })
                      }
                      disabled={!formData.onProcessComplete}
                    >
                      Part Arrived
                    </button>
                    <button
                      type="button"
                      className={`step-toggle ${
                        formData.installationComplete
                          ? "step-complete"
                          : "step-pending"
                      }`}
                      onClick={() =>
                        formData.arrivedComplete &&
                        setFormData({
                          ...formData,
                          installationComplete: !formData.installationComplete,
                        })
                      }
                      disabled={!formData.arrivedComplete}
                    >
                      Installation
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-button secondary"
                  onClick={() => setShowModal(false)}
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
      )}
    </div>
  );
};

export default AdminView;
