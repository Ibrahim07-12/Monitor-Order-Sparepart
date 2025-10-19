import { useState, useEffect } from 'react';
import { getAllSpareparts } from '../firestore';
import { 
  FaClock, 
  FaCheckCircle, 
  FaCog, 
  FaBoxes, 
  FaUser, 
  FaCalendarAlt, 
  FaTruck,
  FaInbox,
  FaSearch
} from 'react-icons/fa';
import './OperatorView.css';

const OperatorView = () => {
  const [spareparts, setSpareparts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, waiting, arrived
  const [isSearching, setIsSearching] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    name: '',
    specification: '',
    machine: '',
    vendor: ''
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
      setSpareparts(result.data);
    } else {
      alert('Gagal memuat data: ' + result.error);
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

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const filteredSpareparts = spareparts.filter(sp => {
    // Filter hidden items
    if (sp.hiddenFromOperator) return false;
    
    // Filter by tab
    if (activeTab === 'waiting') return sp.status === 'menunggu';
    if (activeTab === 'arrived') return sp.status === 'sudah datang';
    return true;
  });

  const waitingCount = spareparts.filter(sp => sp.status === 'menunggu').length;
  const arrivedCount = spareparts.filter(sp => sp.status === 'sudah datang').length;

  if (loading) {
    return (
      <div className="operator-view">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="operator-view">
      <div className="operator-container">
        <div className="operator-header">
          <h2>Sparepart Status Monitor</h2>
          <p>Track arrival status of ordered spareparts</p>
        </div>

        <div className="search-section-operator">
          <div className="search-grid-operator">
            <input
              type="text"
              className="search-input-operator"
              placeholder="Search by Name..."
              value={searchFilters.name}
              onChange={(e) => setSearchFilters({...searchFilters, name: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <input
              type="text"
              className="search-input-operator"
              placeholder="Search by Specification..."
              value={searchFilters.specification}
              onChange={(e) => setSearchFilters({...searchFilters, specification: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <input
              type="text"
              className="search-input-operator"
              placeholder="Search by Machine..."
              value={searchFilters.machine}
              onChange={(e) => setSearchFilters({...searchFilters, machine: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <input
              type="text"
              className="search-input-operator"
              placeholder="Search by Vendor..."
              value={searchFilters.vendor}
              onChange={(e) => setSearchFilters({...searchFilters, vendor: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="search-button-operator" onClick={handleSearch}>
              <FaSearch />
              Search
            </button>
          </div>
        </div>

        <div className="status-tabs">
          <button 
            className={`status-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <FaInbox />
            All
            <span className="status-count">{spareparts.length}</span>
          </button>
          <button 
            className={`status-tab ${activeTab === 'waiting' ? 'active' : ''}`}
            onClick={() => setActiveTab('waiting')}
          >
            <FaClock />
            Waiting for Arrival
            <span className="status-count">{waitingCount}</span>
          </button>
          <button 
            className={`status-tab ${activeTab === 'arrived' ? 'active' : ''}`}
            onClick={() => setActiveTab('arrived')}
          >
            <FaCheckCircle />
            Arrived
            <span className="status-count">{arrivedCount}</span>
          </button>
        </div>

        {filteredSpareparts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {activeTab === 'waiting' ? <FaClock /> : 
               activeTab === 'arrived' ? <FaCheckCircle /> : <FaInbox />}
            </div>
            <h3>{isSearching ? 'No results found' : 'No data available'}</h3>
            <p>
              {isSearching ? 'No spareparts match your search criteria' :
               activeTab === 'waiting' ? 'No spareparts waiting for arrival' :
               activeTab === 'arrived' ? 'No spareparts have arrived yet' :
               'No sparepart data recorded yet'}
            </p>
          </div>
        ) : (
          <div className="spareparts-grid">
            {filteredSpareparts.map((sparepart) => (
              <div 
                key={sparepart.id} 
                className={`sparepart-card ${sparepart.status === 'sudah datang' ? 'arrived' : ''}`}
              >
                <div className="card-header">
                  <div className="card-title">
                    <h3>{sparepart.name}</h3>
                    <p className="specification">{sparepart.specification}</p>
                  </div>
                  <div className={`status-badge ${sparepart.status === 'menunggu' ? 'waiting' : 'arrived'}`}>
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
                  </div>
                </div>

                <div className="card-content">
                  <div className="info-row">
                    <FaCog className="info-icon" />
                    <span className="info-label">Machine:</span>
                    <span className="info-value">{sparepart.machine}</span>
                  </div>

                  <div className="info-row">
                    <FaBoxes className="info-icon" />
                    <span className="info-label">QTY:</span>
                    <span className="info-value">{sparepart.quantity} unit</span>
                  </div>

                  <div className="info-row">
                    <FaUser className="info-icon" />
                    <span className="info-label">Ordered By:</span>
                    <span className="info-value">{sparepart.orderedBy}</span>
                  </div>

                  <div className="info-row">
                    <FaCalendarAlt className="info-icon" />
                    <span className="info-label">Order Date:</span>
                    <span className="info-value">{formatDate(sparepart.orderDate)}</span>
                  </div>

                  <div className="info-row">
                    <FaTruck className="info-icon" />
                    <span className="info-label">Vendor:</span>
                    <span className="info-value">{sparepart.vendor}</span>
                  </div>

                  {sparepart.status === 'sudah datang' && sparepart.arrivedDate && (
                    <div className="info-row">
                      <FaCheckCircle className="info-icon" style={{color: '#10b981'}} />
                      <span className="info-label">Arrival Date:</span>
                      <span className="info-value">{formatDate(sparepart.arrivedDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorView;
