import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const logoStyle = {
    animation: 'fadeInOut 3s forwards, pulse 2s infinite',
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="text-center">
        {imageError ? (
          <p className="text-red-500">Image failed to load.</p>
        ) : (
          <img
            src="https://res.cloudinary.com/dzrnkgvts/image/upload/v1740057260/Hogis_Group_Logo_2-removebg_iokit5.png"
            alt="Hogis Logo"
            className="w-1/2 max-w-[200px] h-auto"
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
