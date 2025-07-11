// src/pages/Test.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function Test() {
  return (
    <div>
      <h1>Test Page</h1>
      <p>This is the test page of your site.</p>
      <Link to="/">← Back to Home</Link>
      <Link to="/about">Go to About Page →</Link>
    </div>
  );
}

export default Test;