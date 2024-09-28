import React, { useState, useEffect } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Camera, Smile, Meh, Frown, Loader, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase/config';
import Modal from '../../components/Modal';
import styles from "./Feedbackpage.module.css";


const venues = [
  "Hogis Royale and Apartments",
  "Hogis Luxury Suites",
  "Hogis Exclusive Suites",
  "Club Voltage",
  "Hogis Cinema"
];

const FeedbackPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [reaction, setReaction] = useState(null);
  const [venue, setVenue] = useState('');
  const [photo, setPhoto] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [isLoading, setIsLoading] = useState(false);
  const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reaction) {
      setModalMessage('Please select a reaction before submitting.');
      setIsModalOpen(true);
      return;
    }
    if (!venue) {
      setModalMessage('Please select a venue before submitting.');
      setIsModalOpen(true);
      return;
    }
    setIsLoading(true);
    try {
      let photoURL = null;
      if (photo) {
        const storage = getStorage();
        const photoRef = ref(storage, `photos/${Date.now()}_${name}.jpg`);
        await uploadString(photoRef, photo, 'data_url');
        photoURL = await getDownloadURL(photoRef);
      }

      await addDoc(collection(db, 'feedback'), {
        name,
        email,
        feedback,
        reaction,
        venue,
        photoURL,
        createdAt: new Date()
      });
      setModalMessage('Feedback submitted successfully!');
      setIsModalOpen(true);
      resetForm();
    } catch (error) {
      console.error('Error submitting feedback: ', error);
      setModalMessage('An error occurred while submitting feedback.');
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setFeedback('');
    setReaction(null);
    setVenue('');
    setPhoto(null);
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result);
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={styles.feedbackPage} style={{ minHeight: windowHeight }}>
      <motion.div 
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.logoContainer}>
          <img src="/hogislogo.JPG" alt="Hogis Logo" className={styles.logo} />
        </div>
        <h1 className={styles.title}>Share Your Thoughts</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              required
              className={styles.input}
            />
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your Email"
              required
              className={styles.input}
            />
          </div>
          <div className={styles.venueDropdown}>
            <motion.button
              type="button"
              className={styles.venueButton}
              onClick={() => setIsVenueDropdownOpen(!isVenueDropdownOpen)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {venue || "Select Location"}
              <ChevronDown className={styles.dropdownIcon} />
            </motion.button>
            <AnimatePresence>
              {isVenueDropdownOpen && (
                <motion.ul
                  className={styles.venueList}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {venues.map((v) => (
                    <motion.li
                      key={v}
                      onClick={() => {
                        setVenue(v);
                        setIsVenueDropdownOpen(false);
                      }}
                      whileHover={{ backgroundColor: "#f0f0f0" }}
                    >
                      {v}
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
          <motion.textarea
            whileFocus={{ scale: 1.01 }}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Your Feedback"
            required
            className={styles.textarea}
          />
          <div className={styles.reactionContainer}>
            <p className={styles.reactionLabel}>How was your experience?</p>
            <div className={styles.reactionButtons}>
              {['positive', 'neutral', 'negative'].map((type) => (
                <motion.button
                  key={type}
                  type="button"
                  onClick={() => setReaction(type)}
                  className={`${styles.reactionButton} ${reaction === type ? styles.active : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {type === 'positive' && <Smile className={styles.icon} />}
                  {type === 'neutral' && <Meh className={styles.icon} />}
                  {type === 'negative' && <Frown className={styles.icon} />}
                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </motion.button>
              ))}
            </div>
          </div>
          <div className={styles.photoUpload}>
            <motion.label 
              className={styles.photoLabel}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Camera className={styles.cameraIcon} />
              <span>Take a photo</span>
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} hidden />
            </motion.label>
            <AnimatePresence>
              {photo && (
                <motion.img 
                  src={photo} 
                  alt="Captured" 
                  className={styles.preview}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </AnimatePresence>
          </div>
          <motion.button 
            type="submit" 
            className={styles.submitButton}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader className={styles.loader} />
            ) : (
              'Submit Feedback'
            )}
          </motion.button>
        </form>
      </motion.div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2>{modalMessage}</h2>
      </Modal>
    </div>
  );
};

export default FeedbackPage;