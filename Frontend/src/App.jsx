import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AppSplashScreen from './components/common/AppSplashScreen';

import './styles/index.css';
import './styles/auth.css';
import './styles/dashboard.css';
import './styles/splash.css';

// Route entry redirect: authenticated users go directly to dashboard (new chat), others to login
const RootRedirect = () => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
};

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Show branded animated splash on every initial load / refresh
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 600);

    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 950);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <>
      {showSplash && <AppSplashScreen isFadingOut={isFadingOut} />}
      <Router>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
