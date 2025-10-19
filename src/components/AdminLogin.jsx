import { useState } from 'react';
import { FaEye, FaEyeSlash, FaExclamationCircle } from 'react-icons/fa';
import './AdminLogin.css';

const ADMIN_CREDENTIALS = {
  id: 'sparepartfoundry',
  password: 'KomatsuNumber1'
};

const AdminLogin = ({ onClose, onLoginSuccess }) => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate a small delay for better UX
    setTimeout(() => {
      if (adminId === ADMIN_CREDENTIALS.id && password === ADMIN_CREDENTIALS.password) {
        onLoginSuccess();
      } else {
        setError('Invalid ID or password. Please try again.');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="admin-login-modal" onClick={onClose}>
      <div className="admin-login-content" onClick={(e) => e.stopPropagation()}>
        <div className="admin-login-header">
          <h2>Admin Login</h2>
          <p>Sparepart Supervisor</p>
        </div>

        {error && (
          <div className="admin-error-message">
            <FaExclamationCircle />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label htmlFor="admin-id">Admin ID</label>
            <input
              type="text"
              id="admin-id"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="Enter Admin ID"
              required
              autoFocus
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="admin-password">Password</label>
            <div className="admin-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="admin-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="admin-buttons">
            <button type="button" className="admin-button cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-button submit" disabled={loading}>
              {loading ? 'Processing...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
