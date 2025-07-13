import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import HomePage from "./Home";
import AboutPage from "./About";
import RoomDetails from "./RoomDetails";

const App = () => {
  return (
    <Router>
      <nav>
        <Link to="/">Home</Link> | <Link to="/about">About</Link> |{" "}
        <Link to="/room">Room</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/room" element={<RoomDetails />} />
      </Routes>
    </Router>
  );
};

export default App;
