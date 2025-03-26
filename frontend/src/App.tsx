import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login'; 
import Redirect from './pages/Redirect';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/redirect" element={<Redirect />} />
      </Routes>
    </Router>
  );
};

export default App