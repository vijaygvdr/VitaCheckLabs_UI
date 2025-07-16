import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Layout from './components/Layout';
import LabTests from './pages/LabTests';
import Reports from './pages/Reports';
import About from './pages/About';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar?: string;
  } | undefined>(undefined);

  const handleLogin = () => {
    // Mock login - in real app, this would handle actual authentication
    setIsAuthenticated(true);
    setUser({
      name: 'John Doe',
      email: 'john.doe@example.com',
    });
  };

  const handleRegister = () => {
    // Mock register - in real app, this would handle actual registration
    console.log('Register clicked');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(undefined);
  };

  const handleSettings = () => {
    console.log('Settings clicked');
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout
            showTabNavigation={true}
            stickyTabs={false}
            isAuthenticated={isAuthenticated}
            user={user}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onLogout={handleLogout}
            onSettings={handleSettings}
          />
        }
      >
        <Route index element={<Navigate to="/lab-tests" replace />} />
        <Route path="lab-tests" element={<LabTests />} />
        <Route path="reports" element={<Reports />} />
        <Route path="about" element={<About />} />
      </Route>
      
      {/* Fallback route for any unmatched paths */}
      <Route path="*" element={<Navigate to="/lab-tests" replace />} />
    </Routes>
  );
}

export default App;
