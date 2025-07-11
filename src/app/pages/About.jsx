// src/pages/About.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function About() {
  return (
    <div>
      <h1>ℹ️ About Page</h1>
      <p>This page contains information about the site.</p>
      <Link to="/">← Back to Home</Link>
      <Link to="/test">← Go to Test Page</Link>
    </div>
  );
}

export default About;