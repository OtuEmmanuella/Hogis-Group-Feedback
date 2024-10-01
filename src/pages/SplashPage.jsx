import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '/hogisgroup.png';
import '../pages/AnimatedSplashPageScreen.module.css';

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
    alignItems: 'flex-start', 
    height: '100vh',
    width: '100vw', 
    backgroundColor: '#000',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: '30vh', 
  };

  const logoContainerStyle = {
    textAlign: 'center',
    width: '100%', 
  };

  const logoStyle = {
    width: '50%', 
    maxWidth: '200px', 
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
            src={logo}
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

          @media (max-width: 768px) {
            img {
              width: 70%; /* Makes the logo larger on smaller screens */
            }
          }

          @media (max-width: 480px) {
            img {
              width: 80%; /* Further adjustment for smaller screens */
            }
          }
        `}
      </style>
    </div>
  );
};

export default SplashPage;
