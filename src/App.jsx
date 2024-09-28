import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SplashPage from './pages/SplashPage';
import FeedbackPage from './pages/FeedbackPage';
import './App.css';
import FeedbackDashboard from './components/Feedback-Dashboard/FeedbackDashboard';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<SplashPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/feedback-dashboard" element={<FeedbackDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;