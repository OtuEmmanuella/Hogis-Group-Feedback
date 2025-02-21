import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const SplashPage = () => {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (animationComplete) {
      navigate('/feedback');
    }
  }, [animationComplete, navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black min-h-screen">
      <div className="text-center p-4 relative">
        {imageError ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-red-500">Image failed to load</p>
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        ) : (
          <img
            src="https://res.cloudinary.com/dzrnkgvts/image/upload/v1740057260/Hogis_Group_Logo_2-removebg_iokit5.png"
            alt="Hogis Logo"
            className="w-48 h-auto md:w-56 lg:w-64 animate-fade-pulse"
            onError={() => setImageError(true)}
          />
        )}
      </div>
    </div>
  );
}

export default SplashPage;