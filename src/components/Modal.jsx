import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import confetti from 'canvas-confetti';

const Modal = ({ isOpen, onClose, message, userName }) => {
  const modalRef = useRef(null);

  const triggerConfetti = () => {
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      const originY = (rect.top + rect.height / 2) / window.innerHeight;
      const originX = 0.5; // Center horizontally

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: originY, x: originX },
        colors: ['#FFD700', '#FFA500', '#FF69B4', '#00FF00', '#4169E1'],
        zIndex: 150,
        disableForReducedMotion: true
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      triggerConfetti();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] px-4 py-6 sm:p-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative z-[200] w-full max-w-sm mx-auto bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden"
          >
            <div className="p-6 sm:p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-3 bg-green-500/10 rounded-full"
                >
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <h3 className="text-2xl font-semibold text-white">
                    Thank you, {userName || 'Guest'}!
                  </h3>
                  <p className="text-gray-300 text-base sm:text-lg">
                    {message || "Your feedback has been submitted successfully!"}
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="w-full pt-2"
                >
                  <Button 
                    onClick={onClose}
                    className="w-full bg-white text-black hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;


{/* THIS IS CONFETTI FROM MAGIC UI - IT WORKS SAME */}

/* import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Confetti } from './magicui/confetti';

const Modal = ({ isOpen, onClose, message, userName }) => {
  const modalRef = useRef(null);
  const confettiRef = useRef(null);

  useEffect(() => {
    if (isOpen && confettiRef.current) {
      confettiRef.current.fire({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5, x: 0.5 },
        colors: ['#FFD700', '#FFA500', '#FF69B4', '#00FF00', '#4169E1'],
        zIndex: 150,
        disableForReducedMotion: true
      });
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] px-4 py-6 sm:p-0">
          <Confetti
            ref={confettiRef}
            className="fixed inset-0 pointer-events-none"
            manualstart={true}
          />
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative z-[200] w-full max-w-sm mx-auto bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden"
          >
            <div className="p-6 sm:p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-3 bg-green-500/10 rounded-full"
                >
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <h3 className="text-2xl font-semibold text-white">
                    Thank you, {userName || 'Guest'}!
                  </h3>
                  <p className="text-gray-300 text-base sm:text-lg">
                    {message || "Your feedback has been submitted successfully!"}
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="w-full pt-2"
                >
                  <Button 
                    onClick={onClose}
                    className="w-full bg-white text-black hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
*/