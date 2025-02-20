import React from 'react';
import { motion } from 'framer-motion';
import { Smile, Meh, Frown } from 'lucide-react';

const icons = {
  positive: Smile,
  neutral: Meh,
  negative: Frown
};

const ReactionButton = ({ type, isActive, onClick }) => {
  const Icon = icons[type];
  
  const baseClasses = "flex items-center gap-1 rounded-lg px-2 sm:px-4 py-1 sm:py-2 transition-colors duration-200";
  
  const colorClasses = {
    positive: `hover:bg-green-600 active:bg-green-700 ${isActive ? 'bg-green-600' : ''}`,
    neutral: `hover:bg-yellow-600 active:bg-yellow-700 ${isActive ? 'bg-yellow-600' : ''}`,
    negative: `hover:bg-red-600 active:bg-red-700 ${isActive ? 'bg-red-600' : ''}`
  };

  return (
    <motion.button
      type="button"
      onClick={() => onClick(type)}
      className={`${baseClasses} ${colorClasses[type]} ${isActive ? 'ring-2 ring-white' : 'bg-gray-700'}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className="text-white h-5 w-5 transition-colors duration-200" />
      <span className="text-white text-sm">
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    </motion.button>
  );
};

export default ReactionButton;