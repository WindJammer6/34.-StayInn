// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <h1>🏠 Home Page</h1>
      <p>This is the home page of your site.</p>
      <Link to="/about">Go to About Page →</Link>
      <Link to="/test">Go to Test Page →</Link>
    </div>
  );
}

export default Home;