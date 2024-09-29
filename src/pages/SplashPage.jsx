import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SplashPage = () => {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (animationComplete) {
      navigate('/feedback');
    }
  }, [animationComplete, navigate]);

  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#000',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  const logoContainerStyle = {
    textAlign: 'center',
  };

  const logoStyle = {
    width: '200px',
    height: 'auto',
    animation: 'fadeInOut 3s forwards, pulse 2s infinite',
  };

  return (
    <div style={containerStyle}>
      <div style={logoContainerStyle}>
        {imageError ? (
          <p style={{ color: 'red' }}>Image failed to load.</p>
        ) : (
          <img
            src="Hogis.jpg" // Ensure this points to the public folder
            alt="Hogis Logo"
            style={logoStyle}
            onError={() => setImageError(true)}
          />
        )}
      </div>
      <style>
        {`
          @keyframes fadeInOut {
            0%, 100% { opacity: 0; }
            50% { opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `}
      </style>
    </div>
  );
};

export default SplashPage;
