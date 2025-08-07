import React from "react";
import Navbar from "./components/Navbar";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Hotels from "./pages/Hotels";
import RoomDetails from "./pages/RoomDetails";
import BookingPage from "./pages/BookingPage";
import TestPage from "./pages/TestPage";


const App = () => {
  return (
    <div>
      <Navbar />
      <div className="min-h-[70vh]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<Hotels />} />
          <Route path="/detail" element={<RoomDetails />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/test" element={<TestPage />}/>
        </Routes>
      </div>
    </div>
  );
};

export default App;
