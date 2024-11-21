import React from 'react';
import { motion } from 'framer-motion';
import { Smile, Meh, Frown } from 'lucide-react';
import styles from './modalStyles/ReactionButton.module.css';

const icons = {
  positive: Smile,
  neutral: Meh,
  negative: Frown
};

const ReactionButton = ({ type, isActive, onClick }) => {
  const Icon = icons[type];

  return (
    <motion.button
      type="button"
      onClick={() => onClick(type)}
      className={`${styles.button} ${isActive ? styles.active : ''}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className={styles.icon} />
      <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
    </motion.button>
  );
};

export default ReactionButton;