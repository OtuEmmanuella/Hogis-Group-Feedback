import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';
import { Camera, ChevronDown, Loader2, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, storage, auth } from '../../firebase/config';
import Modal from '../../components/Modal';
import ReactionButton from '../../components/ReactionButton';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import VoiceRecorder from './voice-recorder';

const venues = [
  "Hogis Royale and Apartments",
  "Hogis Luxury Suites",
  "Hogis Exclusive Suites",
];

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/.netlify/functions/sendFeedbackEmail' 
  : '/.netlify/functions/sendFeedbackEmail';

const FeedbackPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    feedback: '',
    reaction: null,
    venue: '',
    photo: null,
    audio: null
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);
  const [submittedName, setSubmittedName] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const compressImage = (dataUrl, maxWidth = 800) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Compress with reduced quality
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    });
  };

  const handlePhotoCapture = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setModalMessage('Image size must be less than 10MB');
        setIsModalOpen(true);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressedImage = await compressImage(reader.result);
          setFormData(prev => ({ ...prev, photo: compressedImage }));
        } catch (error) {
          console.error('Error compressing image:', error);
          setModalMessage('Error processing image. Please try again.');
          setIsModalOpen(true);
        }
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
      let audioURL = null;

      if (formData.photo) {
        const fileName = `${Date.now()}_${formData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
        const photoRef = ref(storage, `feedback-photos/${fileName}`);
        await uploadString(photoRef, formData.photo, 'data_url');
        photoURL = await getDownloadURL(photoRef);
      }

      if (formData.audio) {
        try {
          const fileName = `${Date.now()}_${formData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.wav`;
          const audioRef = ref(storage, `feedback-audio/${fileName}`);
          
          // Convert base64 to blob
          const base64Response = await fetch(formData.audio);
          const audioBlob = await base64Response.blob();
          
          // Create new blob with correct MIME type
          const audioFile = new Blob([audioBlob], { type: 'audio/wav' });
          
          // Upload the blob
          await uploadBytes(audioRef, audioFile);
          audioURL = await getDownloadURL(audioRef);
        } catch (error) {
          console.error('Error uploading audio:', error);
          throw new Error('Failed to upload audio recording. Please try again.');
        }
      }

      await addDoc(collection(db, 'feedback'), {
        ...formData,
        photoURL,
        audioURL,
        createdAt: serverTimestamp(),
        userId: auth.currentUser.uid
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, photoURL, audioURL }),
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

      setModalMessage("Your feedback is valuable to us. We'll review it right away!");
      setSubmittedName(formData.name);
      setIsModalOpen(true);
      
      // Play success sound
      const audio = new Audio('/hogis successful audio.wav');
      audio.pause();
      audio.currentTime = 0;
      await audio.play().catch(error => {
        console.error("Audio play failed:", error);
      });
    
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        feedback: '',
        reaction: null,
        venue: '',
        photo: null,
        audio: null
      });

    } catch (error) {
      console.error('Error submitting feedback:', error);
      setModalMessage(
        error.code === 'storage/unauthorized' 
          ? 'Unable to upload audio. Please try again.'
          : 'An error occurred. Please try again.'
      );
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="max-w-md mx-auto bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-8">
          <div className="flex justify-center">
            <img src="https://res.cloudinary.com/dzrnkgvts/image/upload/v1740057260/Hogis_Group_Logo_2-removebg_iokit5.png" alt="Hogis Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-1xl font-bold text-center text-white">Share Your Thoughts</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-gray-300">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your name"
                required
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Your email"
                required
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-gray-300">Phone (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Your phone number"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 pl-10"
                />
              </div>
            </div>

            <div className="relative">
              <Label htmlFor="venue" className="text-gray-300">Venue</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                onClick={() => setIsVenueDropdownOpen(!isVenueDropdownOpen)}
              >
                {formData.venue || "Select Location"}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
              <AnimatePresence>
                {isVenueDropdownOpen && (
                  <motion.ul
                    className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {venues.map((venue) => (
                      <li
                        key={venue}
                        className="px-4 py-2 text-white hover:bg-gray-700 cursor-pointer"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, venue }));
                          setIsVenueDropdownOpen(false);
                        }}
                      >
                        {venue}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            <div>
              <Label htmlFor="feedback" className="text-gray-300">Feedback</Label>
              <Textarea
                id="feedback"
                name="feedback"
                value={formData.feedback}
                onChange={handleInputChange}
                placeholder="Share your experience"
                required
                className="min-h-[120px] bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label className="text-gray-300">How was your experience?</Label>
              <div className="flex justify-center gap-4 mt-2">
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

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Add a photo</Label>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('photo-input').click()}
                    className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Take a photo
                  </Button>
                  <input
                    id="photo-input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                </div>
                <AnimatePresence>
                  {formData.photo && (
                    <motion.div 
                      className="mt-4"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <img
                        src={formData.photo}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border border-gray-700"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <Label className="text-gray-300">Add voice note</Label>
                <div className="mt-2">
                  <VoiceRecorder
                    onRecordingComplete={(audioData) =>
                      setFormData(prev => ({ ...prev, audio: audioData }))
                    }
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-gray-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </form>
        </div>
      </motion.div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        message={modalMessage}
        userName={submittedName}
      />
    </div>
  );
};

export default FeedbackPage;