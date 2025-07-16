import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './components/Header';
import LabTests from './pages/LabTests';
import Reports from './pages/Reports';
import About from './pages/About';

function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/lab-tests" replace />} />
        <Route path="/lab-tests" element={<LabTests />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Box>
  );
}

export default App;
