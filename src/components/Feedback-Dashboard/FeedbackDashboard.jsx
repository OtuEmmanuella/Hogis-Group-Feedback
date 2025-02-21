import { useState, useEffect, useRef } from "react";
import { collection, getDocs, orderBy, query, limit, getCountFromServer, startAfter } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js";
import Stats from "./components/Stats";
import Charts from "./components/Charts";
import FeedbackList from "./components/FeedbackList";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const FEEDBACK_PER_PAGE = 10;

export default function FeedbackDashboard() {
  const [feedbackData, setFeedbackData] = useState([]);
  const [sentimentData, setSentimentData] = useState({ positive: 0, negative: 0, neutral: 0 });
  const [keywordData, setKeywordData] = useState({});
  const [venueData, setVenueData] = useState({});
  const [loading, setLoading] = useState(false);
  const [totalFeedback, setTotalFeedback] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [audioStates, setAudioStates] = useState({});
  const [allFeedback, setAllFeedback] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const audioRefs = useRef({});

  useEffect(() => {
    fetchTotalFeedbackCount();
    fetchAllFeedback();
    fetchFeedback(1);
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.src = '';
          audio.load();
        }
      });
      audioRefs.current = {};
    };
  }, []);

  const fetchTotalFeedbackCount = async () => {
    try {
      const feedbackCollection = collection(db, "feedback");
      const snapshot = await getCountFromServer(feedbackCollection);
      const total = snapshot.data().count;
      setTotalFeedback(total);
      setTotalPages(Math.ceil(total / FEEDBACK_PER_PAGE));
    } catch (error) {
      console.error("Error fetching feedback count:", error);
    }
  };

  const fetchAllFeedback = async () => {
    try {
      const feedbackQuery = query(
        collection(db, "feedback"),
        orderBy("createdAt", "desc")
      );
      const feedbackSnapshot = await getDocs(feedbackQuery);
      const allFeedbacks = feedbackSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAllFeedback(allFeedbacks);
      analyzeSentiment(allFeedbacks);
      analyzeKeywords(allFeedbacks);
      analyzeVenues(allFeedbacks);
    } catch (error) {
      console.error("Error fetching all feedback:", error);
    }
  };

  const fetchFeedback = async (page) => {
    setLoading(true);
    try {
      let feedbackQuery;
      
      if (page === 1) {
        feedbackQuery = query(
          collection(db, "feedback"),
          orderBy("createdAt", "desc"),
          limit(FEEDBACK_PER_PAGE)
        );
      } else if (lastDoc) {
        feedbackQuery = query(
          collection(db, "feedback"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(FEEDBACK_PER_PAGE)
        );
      } else {
        return;
      }

      const feedbackSnapshot = await getDocs(feedbackQuery);
      const paginatedFeedbacks = feedbackSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      setLastDoc(feedbackSnapshot.docs[feedbackSnapshot.docs.length - 1]);
      setFeedbackData(paginatedFeedbacks);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeAudio = async (audioUrl, feedbackId) => {
    if (!audioRefs.current[feedbackId]) {
      const audio = new Audio();
      
      // Set audio attributes for better iOS compatibility
      audio.preload = "metadata"; // Changed from "auto" to "metadata" for iOS
      audio.playsInline = true;
      audio.controls = true;
      audio.volume = 1.0;
      
      // Add event listeners
      audio.addEventListener("ended", () => {
        setAudioStates(prev => ({ ...prev, [feedbackId]: false }));
      });
      
      audio.addEventListener("error", (e) => {
        console.error("Audio playback error:", e);
        setAudioStates(prev => ({ ...prev, [feedbackId]: false }));
      });

      // Set source and load
      audio.src = audioUrl;
      
      try {
        await audio.load();
        audioRefs.current[feedbackId] = audio;
      } catch (error) {
        console.error("Error loading audio:", error);
      }
    }
  };

  const handleAudioPlay = async (audioUrl, feedbackId) => {
    try {
      // Initialize audio if not already initialized
      await initializeAudio(audioUrl, feedbackId);
      
      // Stop all other playing audio
      Object.entries(audioRefs.current).forEach(([id, audio]) => {
        if (id !== feedbackId && audio) {
          audio.pause();
          audio.currentTime = 0;
          setAudioStates(prev => ({ ...prev, [id]: false }));
        }
      });

      const audio = audioRefs.current[feedbackId];
      
      if (!audio) {
        console.error("Audio not initialized");
        return;
      }

      if (!audioStates[feedbackId]) {
        try {
          // Set volume and attempt to play
          audio.volume = 1.0;
          
          // Use user interaction to trigger play on iOS
          const playPromise = audio.play();
          
          if (playPromise !== undefined) {
            await playPromise;
            setAudioStates(prev => ({ ...prev, [feedbackId]: true }));
          }
        } catch (error) {
          console.error("Playback failed:", error);
          setAudioStates(prev => ({ ...prev, [feedbackId]: false }));
        }
      } else {
        audio.pause();
        audio.currentTime = 0;
        setAudioStates(prev => ({ ...prev, [feedbackId]: false }));
      }
    } catch (error) {
      console.error("Error in handleAudioPlay:", error);
      setAudioStates(prev => ({ ...prev, [feedbackId]: false }));
    }
  };

  const handleAudioDownload = async (audioUrl, feedbackId) => {
    try {
      setLoading(true);
  
      if (!audioUrl) {
        throw new Error('Invalid audio URL');
      }
  
      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `audio-feedback-${feedbackId}.wav`; // Set suggested filename
      a.target = '_blank'; // Open in new tab as fallback
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      setLoading(false);
  
    } catch (error) {
      console.error('Error downloading audio:', error);
      setLoading(false);
      alert('Failed to download audio file. Please try again.');
    }
  };

  const analyzeSentiment = (feedbacks) => {
    const sentiments = { positive: 0, negative: 0, neutral: 0 };
    const positiveKeywords = [
      "great", "excellent", "good", "amazing", "fantastic", "love",
      "satisfied", "happy", "recommend", "nice"
    ];
    const negativeKeywords = [
      "bad", "poor", "terrible", "hate", "dissatisfied", "worst",
      "unhappy", "not good"
    ];

    feedbacks.forEach((feedback) => {
      const text = feedback.feedback.toLowerCase();
      if (feedback.reaction === "positive" || positiveKeywords.some((keyword) => text.includes(keyword))) {
        sentiments.positive++;
      } else if (feedback.reaction === "negative" || negativeKeywords.some((keyword) => text.includes(keyword))) {
        sentiments.negative++;
      } else {
        sentiments.neutral++;
      }
    });

    setSentimentData(sentiments);
  };

  const analyzeKeywords = (feedbacks) => {
    const keywords = {};
    const commonKeywords = [
      "Food", "food", "room", "noise", "Worst", "smoking", "staffs",
      "professional", "service", "product", "quality", "price", "support",
      "experience", "recommendation", "value", "delivery", "variety"
    ];

    feedbacks.forEach((feedback) => {
      const text = feedback.feedback.toLowerCase();
      commonKeywords.forEach((keyword) => {
        if (text.includes(keyword.toLowerCase())) {
          keywords[keyword] = (keywords[keyword] || 0) + 1;
        }
      });
    });
    setKeywordData(keywords);
  };

  const analyzeVenues = (feedbacks) => {
    const venues = {};
    feedbacks.forEach((feedback) => {
      if (feedback.venue) {
        venues[feedback.venue] = (venues[feedback.venue] || 0) + 1;
      }
    });
    setVenueData(venues);
  };

  const formatDateTime = (date) => {
    if (!date) return "";
    const now = new Date();
    const feedbackDate = date.toDate();
    const diffTime = now - feedbackDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let dateString;
    if (diffDays === 0 && now.getDate() === feedbackDate.getDate()) {
      dateString = "Today";
    } else if (diffDays === 1 || (diffDays === 0 && now.getDate() !== feedbackDate.getDate())) {
      dateString = "Yesterday";
    } else if (diffDays < 7) {
      dateString = `${diffDays} days ago`;
    } else {
      dateString = feedbackDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    }

    const timeString = feedbackDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
    return `${dateString} at ${timeString}`;
  };

  const formatWhatsAppMessage = (feedback) => {
    const message = `*Feedback from Hogis Group*\n\n📝 *Customer:* ${feedback.name}\n📅 *Date:* ${formatDateTime(feedback.createdAt)}\n${feedback.venue ? `📍 *Venue:* ${feedback.venue}\n` : ''}\n💭 *Feedback:* ${feedback.feedback}\n\n*Reaction:* ${feedback.reaction.charAt(0).toUpperCase() + feedback.reaction.slice(1)}${feedback.photoURL ? '\n\n📸 *Photo attached*' : ''}${feedback.audioURL ? '\n🎵 *Voice recording attached*' : ''}`;
    return encodeURIComponent(message);
  };

  const handleWhatsAppShare = (feedback) => {
    const message = formatWhatsAppMessage(feedback);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Feedback Dashboard
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Real-time insights from customer feedback
            </p>
          </div>
          <img
            src="https://res.cloudinary.com/dzrnkgvts/image/upload/v1740057260/Hogis_Group_Logo_2-removebg_iokit5.png"
            alt="Hogis Logo"
            className="h-14 w-auto"
          />
        </div>

        <Stats totalFeedback={totalFeedback} sentimentData={sentimentData} />
        <Charts
          sentimentData={sentimentData}
          keywordData={keywordData}
          venueData={venueData}
        />
        <FeedbackList
          feedbackData={feedbackData}
          audioStates={audioStates}
          handleAudioPlay={handleAudioPlay}
          handleAudioDownload={handleAudioDownload}
          handleWhatsAppShare={handleWhatsAppShare}
          formatDateTime={formatDateTime}
          loading={loading}
        />

        <div className="mt-8 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => fetchFeedback(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, index) => (
                <PaginationItem key={index + 1}>
                  <PaginationLink
                    onClick={() => fetchFeedback(index + 1)}
                    isActive={currentPage === index + 1}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => fetchFeedback(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}