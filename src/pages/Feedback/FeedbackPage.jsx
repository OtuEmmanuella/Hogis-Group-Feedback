import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Camera, ChevronDown, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, storage, auth } from '../../firebase/config';
import Modal from '../../components/Modal';
import ReactionButton from '../../components/ReactionButton';
import styles from './feedbackStyles/FeedbackPage.module.css';
import hogislogo from '/hogisgroup.png';

const venues = [
  "Hogis Royale and Apartments",
  "Hogis Luxury Suites",
  "Hogis Exclusive Suites",
  "Club Voltage",
  "Hogis Cinema"
];

// Update the API URL to use the full Netlify function URL in production
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/.netlify/functions/sendFeedbackEmail' 
  : '/.netlify/functions/sendFeedbackEmail';

  
const FeedbackPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    feedback: '',
    reaction: null,
    venue: '',
    photo: null
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setModalMessage('Image size must be less than 5MB');
        setIsModalOpen(true);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reaction || !formData.venue) {
      setModalMessage('Please fill in all required fields.');
      setIsModalOpen(true);
      return;
    }

    if (!auth.currentUser) {
      setModalMessage('Please wait while we initialize the system...');
      setIsModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      let photoURL = null;
      if (formData.photo) {
        const fileName = `${Date.now()}_${formData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
        const photoRef = ref(storage, `feedback-photos/${fileName}`);
        await uploadString(photoRef, formData.photo, 'data_url');
        photoURL = await getDownloadURL(photoRef);
      }

      await addDoc(collection(db, 'feedback'), {
        ...formData,
        photoURL,
        createdAt: serverTimestamp(), 
        userId: auth.currentUser.uid
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, photoURL }),
      });
      
      if (!response.ok) {
        const contentType = response.headers.get('Content-Type');
        let errorMessage = 'An error occurred. Please try again.';
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          console.error('Unexpected response format:', await response.text());
        }
        throw new Error(errorMessage);
      }
      

      setModalMessage('Feedback submitted successfully!');
      setIsModalOpen(true);

      const audio = new Audio('/hogis successful audio.wav');
      audio.pause();
      audio.currentTime = 0;
      audio.play().catch(error => {
        console.error("Audio play failed:", error);
      });
      

      setFormData({
        name: '',
        email: '',
        feedback: '',
        reaction: null,
        venue: '',
        photo: null
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setModalMessage(
        error.code === 'storage/unauthorized' 
          ? 'Unable to upload image. Please try again.'
          : 'An error occurred. Please try again.'
      );
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.feedbackPage}>
      <motion.div 
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.logoContainer}>
          <img src={hogislogo} alt="Hogis Logo" className={styles.logo} />
        </div>
        <h1 className={styles.title}>Share Your Thoughts</h1>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Your Name"
              required
              className={styles.input}
            />
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
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
              {formData.venue || "Select Location"}
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
                  {venues.map((venue) => (
                    <motion.li
                      key={venue}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, venue }));
                        setIsVenueDropdownOpen(false);
                      }}
                      whileHover={{ backgroundColor: "#f0f0f0" }}
                    >
                      {venue}
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          <motion.textarea
            whileFocus={{ scale: 1.01 }}
            name="feedback"
            value={formData.feedback}
            onChange={handleInputChange}
            placeholder="Your Feedback"
            required
            className={styles.textarea}
          />

          <div className={styles.reactionContainer}>
            <p className={styles.reactionLabel}>How was your experience?</p>
            <div className={styles.reactionButtons}>
              {['positive', 'neutral', 'negative'].map((type) => (
                <ReactionButton
                  key={type}
                  type={type}
                  isActive={formData.reaction === type}
                  onClick={(reaction) => setFormData(prev => ({ ...prev, reaction }))}
                />
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
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                hidden
              />
            </motion.label>
            <AnimatePresence>
              {formData.photo && (
                <motion.img 
                  src={formData.photo}
                  alt="Preview"
                  className={styles.preview}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                />
              )}
            </AnimatePresence>
          </div>

          <motion.button 
            type="submit" 
            className={styles.submitButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isLoading}
          >
            {isLoading ? <Loader className={styles.loaderIcon} /> : "Submit Feedback"}
          </motion.button>
        </form>
      </motion.div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {modalMessage}
      </Modal>
    </div>
  );
};

export default FeedbackPage;