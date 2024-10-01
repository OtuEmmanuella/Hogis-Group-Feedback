import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query, limit, startAfter, getCountFromServer } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import styles from './FeedbackDashboard.module.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const FeedbackDashboard = () => {
  const [feedbackData, setFeedbackData] = useState([]);
  const [sentimentData, setSentimentData] = useState({ positive: 0, negative: 0, neutral: 0 });
  const [keywordData, setKeywordData] = useState({});
  const [venueData, setVenueData] = useState({});
  const [loading, setLoading] = useState(false);
  const [totalFeedback, setTotalFeedback] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const FEEDBACK_PER_PAGE = 10;

  useEffect(() => {
    fetchTotalFeedbackCount();
    fetchFeedback(1);
  }, []);

  const fetchTotalFeedbackCount = async () => {
    const feedbackCollection = collection(db, 'feedback');
    const snapshot = await getCountFromServer(feedbackCollection);
    const total = snapshot.data().count;
    setTotalFeedback(total);
    setTotalPages(Math.ceil(total / FEEDBACK_PER_PAGE));
  };

  const fetchFeedback = async (page) => {
    setLoading(true);
    const feedbackQuery = query(
      collection(db, 'feedback'),
      orderBy('createdAt', 'desc'),
      limit(FEEDBACK_PER_PAGE * page)
    );

    const feedbackSnapshot = await getDocs(feedbackQuery);
    const allFeedbacks = feedbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const paginatedFeedbacks = allFeedbacks.slice((page - 1) * FEEDBACK_PER_PAGE, page * FEEDBACK_PER_PAGE);

    setFeedbackData(paginatedFeedbacks);
    setCurrentPage(page);

    analyzeSentiment(allFeedbacks);
    analyzeKeywords(allFeedbacks);
    analyzeVenues(allFeedbacks);

    setLoading(false);
  };

  const analyzeSentiment = (feedbacks) => {
    const sentiments = { positive: 0, negative: 0, neutral: 0 };
    const positiveKeywords = ['great', 'excellent', 'good', 'amazing', 'fantastic', 'love', 'satisfied', 'happy', 'recommend', 'nice'];
    const negativeKeywords = ['bad', 'poor', 'terrible', 'hate', 'dissatisfied', 'worst', 'unhappy', 'not good'];

    feedbacks.forEach(feedback => {
      const text = feedback.feedback.toLowerCase();
      if (feedback.reaction === 'positive' || positiveKeywords.some(keyword => text.includes(keyword))) {
        sentiments.positive++;
      } else if (feedback.reaction === 'negative' || negativeKeywords.some(keyword => text.includes(keyword))) {
        sentiments.negative++;
      } else {
        sentiments.neutral++;
      }
    });

    setSentimentData(sentiments);
  };

  const analyzeKeywords = (feedbacks) => {
    const keywords = {};
    const commonKeywords = ['Food', 'food', 'room', 'noise', 'Worst', 'smoking', 'staffs', 'professional', 'service', 'product', 'quality', 'price', 'support', 'experience', 'recommendation', 'value', 'delivery', 'variety'];

    feedbacks.forEach(feedback => {
      const text = feedback.feedback.toLowerCase();
      commonKeywords.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
          keywords[keyword] = (keywords[keyword] || 0) + 1;
        }
      });
    });
    setKeywordData(keywords);
  };

  const analyzeVenues = (feedbacks) => {
    const venues = {};
    feedbacks.forEach(feedback => {
      if (feedback.venue) {
        venues[feedback.venue] = (venues[feedback.venue] || 0) + 1;
      }
    });
    setVenueData(venues);
  };

  const formatDateTime = (date) => {
    const now = new Date();
    const feedbackDate = date.toDate();
    const diffTime = now - feedbackDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let dateString;
    if (diffDays === 0 && now.getDate() === feedbackDate.getDate()) {
      dateString = 'Today';
    } else if (diffDays === 1 || (diffDays === 0 && now.getDate() !== feedbackDate.getDate())) {
      dateString = 'Yesterday';
    } else if (diffDays < 7) {
      dateString = `${diffDays} days ago`;
    } else {
      dateString = feedbackDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    const timeString = feedbackDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    return `${dateString} at ${timeString}`;
  };

  const pieChartData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [
      {
        data: [sentimentData.positive, sentimentData.negative, sentimentData.neutral],
        backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56'],
        hoverBackgroundColor: ['#36A2EB', '#FF6384', '#FFCE56'],
      },
    ],
  };

  const barChartData = {
    labels: Object.keys(keywordData),
    datasets: [
      {
        label: 'Keyword Frequency',
        data: Object.values(keywordData),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const venueChartData = {
    labels: Object.keys(venueData),
    datasets: [
      {
        label: 'Feedback per Venue',
        data: Object.values(venueData),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Analysis',
      },
    },
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchFeedback(page);
    }
  };

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.title}>Feedback Dashboard</h1>
      <div className={styles.statsContainer}>
        <div className={styles.stat}>
          <h2>Total Feedback</h2>
          <p>{totalFeedback}</p>
        </div>
        <div className={styles.stat}>
          <h2>Positive Feedback</h2>
          <p>{sentimentData.positive}</p>
        </div>
        <div className={styles.stat}>
          <h2>Negative Feedback</h2>
          <p>{sentimentData.negative}</p>
        </div>
        <div className={styles.stat}>
          <h2>Neutral Feedback</h2>
          <p>{sentimentData.neutral}</p>
        </div>
      </div>
      <div className={styles.chartContainer}>
        <div className={styles.chart}>
          <h2>Sentiment Analysis</h2>
          <Pie data={pieChartData} />
        </div>
        <div className={styles.chart}>
          <h2>Keyword Analysis</h2>
          <Bar options={chartOptions} data={barChartData} />
        </div>
        <div className={styles.chart}>
          <h2>Venue Analysis</h2>
          <Bar options={chartOptions} data={venueChartData} />
        </div>
      </div>
      <div className={styles.feedbackList}>
        <h2>All Feedback</h2>
        <ul>
          {feedbackData.map((feedback) => (
            <li key={feedback.id} className={styles.feedbackItem}>
              <div className={styles.feedbackHeader}>
                <strong>{feedback.name}</strong> {feedback.email}
                <span className={styles.feedbackDate}>
                  {formatDateTime(feedback.createdAt)}
                </span>
              </div>
              <div className={styles.feedbackContent}>
                <span className={`${styles.feedbackReaction} ${styles[feedback.reaction]}`}>
                  {feedback.reaction}
                </span>
                <p><strong>Venue:</strong> {feedback.venue}</p>
                <p>{feedback.feedback}</p>
              </div>
              {feedback.photoURL && (
                <img 
                  src={feedback.photoURL} 
                  alt={`Feedback from ${feedback.name}`} 
                  className={styles.feedbackImage}
                />
              )}
            </li>
          ))}
        </ul>
        <div className={styles.pagination}>
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1 || loading}
            className={styles.paginationButton}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages || loading}
            className={styles.paginationButton}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDashboard;