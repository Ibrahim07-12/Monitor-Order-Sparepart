import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./components/Login";
import Header from "./components/Header";
import OperatorView from "./components/OperatorView";
import AdminView from "./components/AdminView";
import AdminLogin from "./components/AdminLogin";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPlant, setAdminPlant] = useState(null);

  useEffect(() => {
    // Check Firebase authentication state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Check if admin was logged in previously
    const adminStatus = localStorage.getItem("isAdmin");
    if (adminStatus === "true") {
      setIsAdmin(true);
    }

    return () => unsubscribe();
  }, []);

  const handleAdminLoginSuccess = (plant) => {
    setIsAdmin(true);
    setShowAdminLogin(false);
    setAdminPlant(plant || localStorage.getItem("adminPlant") || null);
    localStorage.setItem("isAdmin", "true");
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem("isAdmin");
  };

  const handleMainLoginSuccess = () => {
    // User will be set automatically by onAuthStateChanged
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // If user is not authenticated, show login page
  if (!user) {
    return <Login onLoginSuccess={handleMainLoginSuccess} />;
  }

  // If user is authenticated, show the main application
  return (
    <div className="app">
      <Header
        isAdmin={isAdmin}
        onAdminLogin={() => setShowAdminLogin(true)}
        onAdminLogout={handleAdminLogout}
      />

      {isAdmin ? <AdminView adminPlant={adminPlant} /> : <OperatorView />}

      {showAdminLogin && (
        <AdminLogin
          onClose={() => setShowAdminLogin(false)}
          onLoginSuccess={handleAdminLoginSuccess}
        />
      )}
    </div>
  );
}

export default App;
