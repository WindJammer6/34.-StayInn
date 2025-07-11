import React from 'react';
import ReactDOM from 'react-dom/client';
import './globals.css';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router';
import App from './App';
import Bookings from "./Bookings";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/bookings" element={<Bookings />} />
      </Routes>
    </Router>
  </React.StrictMode>,
  // document.querySelector('#root')
);
