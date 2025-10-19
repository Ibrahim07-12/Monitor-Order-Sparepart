import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { FaSignOutAlt, FaUserShield, FaArrowLeft, FaClipboardList } from 'react-icons/fa';
import './Header.css';

const Header = ({ isAdmin, onAdminLogin, onAdminLogout }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      alert('An error occurred during logout');
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <div className="header-logo">
            <img src="/logo-header.png" alt="Logo Komatsu" />
          </div>
        </div>

        <div className="header-center">
          <div className="header-title-wrapper">
            <FaClipboardList className="header-icon" />
            <h1>Sparepart Order Status Monitor</h1>
          </div>
          <p className="company-name">PT. Komatsu Indonesia - Foundry Plant</p>
        </div>

        <div className="header-right">
          {isAdmin ? (
            <button className="header-button logout" onClick={onAdminLogout}>
              <FaArrowLeft />
              <span>Back</span>
            </button>
          ) : (
            <>
              <button className="header-button admin" onClick={onAdminLogin}>
                <FaUserShield />
                <span>Admin</span>
              </button>
              <button className="header-button logout" onClick={handleLogout}>
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
