import { useState, useEffect } from 'react';
import { 
  getAllSpareparts, 
  addSparepart, 
  updateSparepart, 
  markAsArrived, 
  deleteSparepart,
  searchSpareparts 
} from '../firestore';
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
  FaEyeSlash
} from 'react-icons/fa';
import { Timestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import './AdminView.css';

const AdminView = () => {
  const [spareparts, setSpareparts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add or edit
  const [editingId, setEditingId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const [searchFilters, setSearchFilters] = useState({
    name: '',
    specification: '',
    machine: '',
    vendor: ''
  });
  
  const [formData, setFormData] = useState({
    name: '',
    specification: '',
    machine: '',
    quantity: '',
    orderedBy: '',
    orderDate: '',
    vendor: '',
    status: 'menunggu'
  });

  useEffect(() => {
    loadSpareparts();
  }, []);

  // Auto-reload when all search filters are cleared
  useEffect(() => {
    const allEmpty = Object.values(searchFilters).every(value => value.trim() === '');
    if (allEmpty && isSearching) {
      loadSpareparts();
    }
  }, [searchFilters]);

  const loadSpareparts = async () => {
    setLoading(true);
    setIsSearching(false);
    setSearchFilters({
      name: '',
      specification: '',
      machine: '',
      vendor: ''
    });
    const result = await getAllSpareparts();
    if (result.success) {
      // Filter out hidden items from default view
      const visibleItems = result.data.filter(item => !item.hiddenFromOperator);
      setSpareparts(visibleItems);
    } else {
      alert('Failed to load data: ' + result.error);
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    // Check if any filter has value
    const hasFilter = Object.values(searchFilters).some(value => value.trim() !== '');
    
    if (!hasFilter) {
      loadSpareparts();
      return;
    }
    
    setLoading(true);
    setIsSearching(true);
    
    // Get all spareparts first
    const result = await getAllSpareparts();
    if (result.success) {
      // Filter locally based on multiple criteria
      let filtered = result.data;
      
      if (searchFilters.name.trim()) {
        filtered = filtered.filter(item => 
          item.name.toLowerCase().includes(searchFilters.name.toLowerCase())
        );
      }
      
      if (searchFilters.specification.trim()) {
        filtered = filtered.filter(item => 
          item.specification.toLowerCase().includes(searchFilters.specification.toLowerCase())
        );
      }
      
      if (searchFilters.machine.trim()) {
        filtered = filtered.filter(item => 
          item.machine.toLowerCase().includes(searchFilters.machine.toLowerCase())
        );
      }
      
      if (searchFilters.vendor.trim()) {
        filtered = filtered.filter(item => 
          item.vendor.toLowerCase().includes(searchFilters.vendor.toLowerCase())
        );
      }
      
      setSpareparts(filtered);
    } else {
      alert('Failed to search data: ' + result.error);
    }
    setLoading(false);
  };

  const handleAddNew = () => {
    setModalMode('add');
    setEditingId(null);
    setFormData({
      name: '',
      specification: '',
      machine: '',
      quantity: '',
      orderedBy: '',
      orderDate: new Date().toISOString().split('T')[0],
      vendor: '',
      status: 'menunggu'
    });
    setShowModal(true);
  };

  const handleEdit = (sparepart) => {
    setModalMode('edit');
    setEditingId(sparepart.id);
    
    // Convert Firestore Timestamp to date string
    const orderDate = sparepart.orderDate?.toDate ? 
      sparepart.orderDate.toDate().toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0];
    
    setFormData({
      name: sparepart.name,
      specification: sparepart.specification,
      machine: sparepart.machine,
      quantity: sparepart.quantity.toString(),
      orderedBy: sparepart.orderedBy,
      orderDate: orderDate,
      vendor: sparepart.vendor,
      status: sparepart.status
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
      status: formData.status
    };

    let result;
    if (modalMode === 'add') {
      result = await addSparepart(sparepartData);
    } else {
      result = await updateSparepart(editingId, sparepartData);
    }

    if (result.success) {
      setShowModal(false);
      loadSpareparts();
      alert(modalMode === 'add' ? 'Data successfully added' : 'Data successfully updated');
    } else {
      alert('Failed to save data: ' + result.error);
    }
  };

  const handleMarkAsArrived = async (id) => {
    if (window.confirm('Mark this sparepart as arrived?')) {
      const result = await markAsArrived(id);
      if (result.success) {
        loadSpareparts();
        alert('Status successfully updated');
      } else {
        alert('Failed to update status: ' + result.error);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this data?')) {
      const result = await deleteSparepart(id);
      if (result.success) {
        loadSpareparts();
        alert('Data successfully deleted');
      } else {
        alert('Failed to delete data: ' + result.error);
      }
    }
  };

  const handleToggleHide = async (id, currentHiddenState) => {
    const updateData = {
      hiddenFromOperator: !currentHiddenState
    };
    
    const result = await updateSparepart(id, updateData);
    if (result.success) {
      loadSpareparts();
    } else {
      alert('Failed to toggle visibility: ' + result.error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleExportToExcel = () => {
    if (spareparts.length === 0) {
      alert('No data to export');
      return;
    }

    // Prepare data for Excel
    const excelData = spareparts.map((item, index) => ({
      'No': index + 1,
      'Sparepart Name': item.name,
      'Specification': item.specification,
      'Machine': item.machine,
      'QTY': item.quantity,
      'Ordered By': item.orderedBy,
      'Order Date': formatDate(item.orderDate),
      'Vendor Company': item.vendor,
      'Status': item.status === 'menunggu' ? 'Waiting' : 'Arrived',
      'Arrival Date': item.arrivedDate ? formatDate(item.arrivedDate) : '-'
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sparepart Data');

    // Auto-size columns
    const maxWidth = 30;
    const columnWidths = Object.keys(excelData[0]).map(key => ({
      wch: Math.min(
        Math.max(
          key.length,
          ...excelData.map(row => String(row[key]).length)
        ) + 2,
        maxWidth
      )
    }));
    worksheet['!cols'] = columnWidths;

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `Sparepart_Data_${currentDate}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
    alert(`Data successfully exported to ${filename}`);
  };

  return (
    <div className="admin-view">
      <div className="admin-container">
        <div className="admin-header">
          <div className="admin-header-left">
            <h2>Sparepart Data Management</h2>
          </div>
          <div className="admin-actions">
            <button 
              className="action-button export" 
              onClick={handleExportToExcel}
              disabled={spareparts.length === 0}
              title="Export data to Excel"
            >
              <FaFileExcel />
              Export Excel
            </button>
            <button className="action-button primary" onClick={handleAddNew}>
              <FaPlus />
              Add Data
            </button>
            {isSearching && (
              <button className="action-button secondary" onClick={loadSpareparts}>
                <FaHistory />
                Show All
              </button>
            )}
          </div>
        </div>

        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="Sparepart Name..."
              value={searchFilters.name}
              onChange={(e) => setSearchFilters({...searchFilters, name: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <input
              type="text"
              className="search-input"
              placeholder="Specification..."
              value={searchFilters.specification}
              onChange={(e) => setSearchFilters({...searchFilters, specification: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <input
              type="text"
              className="search-input"
              placeholder="Machine..."
              value={searchFilters.machine}
              onChange={(e) => setSearchFilters({...searchFilters, machine: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <input
              type="text"
              className="search-input"
              placeholder="Vendor..."
              value={searchFilters.vendor}
              onChange={(e) => setSearchFilters({...searchFilters, vendor: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="search-button" onClick={handleSearch}>
              <FaSearch />
              Search
            </button>
          </div>
        </div>

        <div className="admin-table-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          ) : spareparts.length === 0 ? (
            <div className="empty-state-admin">
              <div className="empty-icon-admin">
                <FaBoxOpen />
              </div>
              <h3>{isSearching ? 'Tidak ada hasil' : 'Belum ada data'}</h3>
              <p>
                {isSearching ? 
                  'Tidak ada sparepart yang cocok dengan pencarian Anda' : 
                  'Tambahkan data sparepart pertama Anda'}
              </p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sparepart Name</th>
                  <th>Specification</th>
                  <th>Machine</th>
                  <th>QTY</th>
                  <th>Ordered By</th>
                  <th>Order Date</th>
                  <th>Vendor</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {spareparts.map((sparepart) => (
                  <tr key={sparepart.id}>
                    <td><strong>{sparepart.name}</strong></td>
                    <td>{sparepart.specification}</td>
                    <td>{sparepart.machine}</td>
                    <td>{sparepart.quantity} unit</td>
                    <td>{sparepart.orderedBy}</td>
                    <td>{formatDate(sparepart.orderDate)}</td>
                    <td>{sparepart.vendor}</td>
                    <td>
                      <span className={`status-badge-admin ${sparepart.status === 'menunggu' ? 'waiting' : 'arrived'}`}>
                        {sparepart.status === 'menunggu' ? (
                          <>
                            <FaClock />
                            Waiting
                          </>
                        ) : (
                          <>
                            <FaCheckCircle />
                            Arrived
                          </>
                        )}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {sparepart.status === 'menunggu' ? (
                          <button
                            className="icon-button check"
                            onClick={() => handleMarkAsArrived(sparepart.id)}
                            title="Mark as Arrived"
                          >
                            <FaCheckCircle />
                          </button>
                        ) : (
                          <button
                            className={`icon-button toggle-hide ${sparepart.hiddenFromOperator ? 'hidden' : 'visible'}`}
                            onClick={() => handleToggleHide(sparepart.id, sparepart.hiddenFromOperator)}
                            title={sparepart.hiddenFromOperator ? 'Show in Operator View' : 'Hide from Operator View'}
                          >
                            {sparepart.hiddenFromOperator ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        )}
                        <button
                          className="icon-button edit"
                          onClick={() => handleEdit(sparepart)}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="icon-button delete"
                          onClick={() => handleDelete(sparepart.id)}
                          title="Delete"
                        >
                          <FaTrash />
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
              <h3>{modalMode === 'add' ? 'Add Sparepart Data' : 'Edit Sparepart Data'}</h3>
              <button className="close-button" onClick={() => setShowModal(false)}>
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
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="specification">Specification *</label>
                  <textarea
                    id="specification"
                    value={formData.specification}
                    onChange={(e) => setFormData({...formData, specification: e.target.value})}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="machine">Machine *</label>
                  <input
                    type="text"
                    id="machine"
                    value={formData.machine}
                    onChange={(e) => setFormData({...formData, machine: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="orderedBy">Ordered By *</label>
                  <input
                    type="text"
                    id="orderedBy"
                    value={formData.orderedBy}
                    onChange={(e) => setFormData({...formData, orderedBy: e.target.value})}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="orderDate">Order Date *</label>
                  <input
                    type="date"
                    id="orderDate"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({...formData, orderDate: e.target.value})}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="vendor">Vendor Company *</label>
                  <input
                    type="text"
                    id="vendor"
                    value={formData.vendor}
                    onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="status">Status *</label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    required
                  >
                    <option value="menunggu">Waiting for Arrival</option>
                    <option value="sudah datang">Arrived</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-button secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-button primary">
                  {modalMode === 'add' ? 'Save' : 'Update'}
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
