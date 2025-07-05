import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Race from './components/Race';
import Login from './components/Login';
import Register from './components/Register';
import authService from './services/authService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuth, setShowAuth] = useState('login'); // 'login' or 'register'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        const isValid = await authService.validateToken();
        setIsAuthenticated(isValid);
        if (!isValid) {
          authService.logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowAuth('login');
  };

  const handleRegisterSuccess = () => {
    setIsAuthenticated(true);
    setShowAuth('login');
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  const switchToRegister = () => {
    setShowAuth('register');
  };

  const switchToLogin = () => {
    setShowAuth('login');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="App">
        {showAuth === 'login' ? (
          <Login 
            onLoginSuccess={handleLoginSuccess} 
            onSwitchToRegister={switchToRegister} 
          />
        ) : (
          <Register 
            onRegisterSuccess={handleRegisterSuccess} 
            onSwitchToLogin={switchToLogin} 
          />
        )}
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Navbar onLogout={handleLogout} username={authService.getUsername()} />
        <main>
          <Routes>
            <Route path="/" element={<Race />} />
            <Route path="/race" element={<Race />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
