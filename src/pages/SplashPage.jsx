import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import splashlogo from "/public/images/hogislogo.JPG"


const SplashPage = () => {
  const [animationComplete, setAnimationComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 3000); // Duration of the splash animation

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
    width: '200px', // Adjust as needed
    height: 'auto',
    animation: 'fadeInOut 3s forwards, pulse 2s infinite',
  };

  return (
    <div style={containerStyle}>
      <div style={logoContainerStyle}>
        <img src={splashlogo} alt="Hogis Group Logo" style={logoStyle} />
        <svg width="100%" height="100%">
          <text 
            x="50%" 
            y="50%" 
            dominantBaseline="middle" 
            textAnchor="middle" 
            fontSize="18" 
            fontWeight={700} 
            fill="#DAA520"
            style={{ whiteSpace: 'nowrap' }} // Prevent line breaks
          >
            {/* Hogis Group */}
          </text>
        </svg>
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
