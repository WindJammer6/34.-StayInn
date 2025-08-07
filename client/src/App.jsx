import React from "react";
import Navbar from "./components/Navbar";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Hotels from "./pages/Hotels";
import RoomDetails from "./pages/RoomDetails";
import BookingPage from "./pages/BookingPage"; //Booking and payment page
import MyBookingsPage from "./pages/MyBookingsPage"; //My Bookings page


const App = () => {
  return (
    <div>
      <Navbar />
      <div className="min-h-[70vh]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<Hotels />} />
          <Route path="/detail" element={<RoomDetails />} />
          <Route path="/book" element={<BookingPage />} /> feature4
          <Route path="/my-bookings" element={<MyBookingsPage />} /> {/* My bookings page */}
        </Routes>
      </div>
    </div>
  );
};

export default App;
