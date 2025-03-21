import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";

const Home = () => {
  return (
    <div>
      <h1>CNH Brain - Home</h1>
      <p>Welcome to the application. You are authenticated!</p>
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      {/* Add other routes here */}
    </Routes>
  );
};

export default App;
