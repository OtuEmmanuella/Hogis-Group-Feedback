import { useState, useEffect, useRef } from "react"
import { collection, getDocs, orderBy, query, limit, getCountFromServer } from "firebase/firestore"
import { db } from "../../firebase/config"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js"
import { Pie, Bar } from "react-chartjs-2"
import { PhoneCall, Play, Pause, Share2, TrendingUp, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination"

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const FEEDBACK_PER_PAGE = 10

export default function FeedbackDashboard() {
  const [feedbackData, setFeedbackData] = useState([])
  const [sentimentData, setSentimentData] = useState({ positive: 0, negative: 0, neutral: 0 })
  const [keywordData, setKeywordData] = useState({})
  const [venueData, setVenueData] = useState({})
  const [loading, setLoading] = useState(false)
  const [totalFeedback, setTotalFeedback] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [audioStates, setAudioStates] = useState({})
  const audioRefs = useRef({})

  useEffect(() => {
    fetchTotalFeedbackCount()
    fetchFeedback(1)
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause()
          audio.currentTime = 0
        }
      })
    }
  }, [])

  const fetchTotalFeedbackCount = async () => {
    try {
      const feedbackCollection = collection(db, "feedback")
      const snapshot = await getCountFromServer(feedbackCollection)
      const total = snapshot.data().count
      setTotalFeedback(total)
      setTotalPages(Math.ceil(total / FEEDBACK_PER_PAGE))
    } catch (error) {
      console.error("Error fetching feedback count:", error)
    }
  }

  const fetchFeedback = async (page) => {
    setLoading(true)
    try {
      const feedbackQuery = query(
        collection(db, "feedback"),
        orderBy("createdAt", "desc"),
        limit(FEEDBACK_PER_PAGE * page),
      )

      const feedbackSnapshot = await getDocs(feedbackQuery)
      const allFeedbacks = feedbackSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      const paginatedFeedbacks = allFeedbacks.slice((page - 1) * FEEDBACK_PER_PAGE, page * FEEDBACK_PER_PAGE)

      setFeedbackData(paginatedFeedbacks)
      setCurrentPage(page)

      analyzeSentiment(allFeedbacks)
      analyzeKeywords(allFeedbacks)
      analyzeVenues(allFeedbacks)
    } catch (error) {
      console.error("Error fetching feedback:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAudioPlay = async (audioUrl, feedbackId) => {
    try {
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause()
          audio.currentTime = 0
        }
      })

      setAudioStates((prev) => {
        const newStates = { ...prev }
        Object.keys(newStates).forEach((key) => {
          if (key !== feedbackId) {
            newStates[key] = false
          }
        })
        return newStates
      })

      if (!audioStates[feedbackId]) {
        if (!audioRefs.current[feedbackId]) {
          const audio = new Audio(audioUrl)
          audio.addEventListener("ended", () => {
            setAudioStates((prev) => ({ ...prev, [feedbackId]: false }))
          })
          audio.addEventListener("error", (e) => {
            console.error("Audio playback error:", e)
            setAudioStates((prev) => ({ ...prev, [feedbackId]: false }))
          })
          audioRefs.current[feedbackId] = audio
        }

        await audioRefs.current[feedbackId].play()
        setAudioStates((prev) => ({ ...prev, [feedbackId]: true }))
      } else {
        audioRefs.current[feedbackId].pause()
        audioRefs.current[feedbackId].currentTime = 0
        setAudioStates((prev) => ({ ...prev, [feedbackId]: false }))
      }
    } catch (error) {
      console.error("Error playing audio:", error)
      setAudioStates((prev) => ({ ...prev, [feedbackId]: false }))
    }
  }

  const analyzeSentiment = (feedbacks) => {
    const sentiments = { positive: 0, negative: 0, neutral: 0 }
    const positiveKeywords = [
      "great",
      "excellent",
      "good",
      "amazing",
      "fantastic",
      "love",
      "satisfied",
      "happy",
      "recommend",
      "nice",
    ]
    const negativeKeywords = ["bad", "poor", "terrible", "hate", "dissatisfied", "worst", "unhappy", "not good"]

    feedbacks.forEach((feedback) => {
      const text = feedback.feedback.toLowerCase()
      if (feedback.reaction === "positive" || positiveKeywords.some((keyword) => text.includes(keyword))) {
        sentiments.positive++
      } else if (feedback.reaction === "negative" || negativeKeywords.some((keyword) => text.includes(keyword))) {
        sentiments.negative++
      } else {
        sentiments.neutral++
      }
    })

    setSentimentData(sentiments)
  }

  const analyzeKeywords = (feedbacks) => {
    const keywords = {}
    const commonKeywords = [
      "Food",
      "food",
      "room",
      "noise",
      "Worst",
      "smoking",
      "staffs",
      "professional",
      "service",
      "product",
      "quality",
      "price",
      "support",
      "experience",
      "recommendation",
      "value",
      "delivery",
      "variety",
    ]

    feedbacks.forEach((feedback) => {
      const text = feedback.feedback.toLowerCase()
      commonKeywords.forEach((keyword) => {
        if (text.includes(keyword.toLowerCase())) {
          keywords[keyword] = (keywords[keyword] || 0) + 1
        }
      })
    })
    setKeywordData(keywords)
  }

  const analyzeVenues = (feedbacks) => {
    const venues = {}
    feedbacks.forEach((feedback) => {
      if (feedback.venue) {
        venues[feedback.venue] = (venues[feedback.venue] || 0) + 1
      }
    })
    setVenueData(venues)
  }

  const formatDateTime = (date) => {
    if (!date) return ""
    const now = new Date()
    const feedbackDate = date.toDate()
    const diffTime = now - feedbackDate
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    let dateString
    if (diffDays === 0 && now.getDate() === feedbackDate.getDate()) {
      dateString = "Today"
    } else if (diffDays === 1 || (diffDays === 0 && now.getDate() !== feedbackDate.getDate())) {
      dateString = "Yesterday"
    } else if (diffDays < 7) {
      dateString = `${diffDays} days ago`
    } else {
      dateString = feedbackDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    }

    const timeString = feedbackDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    return `${dateString} at ${timeString}`
  }

  const formatWhatsAppMessage = (feedback) => {
    const message = `*Feedback from Hogis Group*\n\n📝 *Customer:* ${feedback.name}\n📅 *Date:* ${formatDateTime(feedback.createdAt)}\n${feedback.venue ? `📍 *Venue:* ${feedback.venue}\n` : ''}\n💭 *Feedback:* ${feedback.feedback}\n\n*Reaction:* ${feedback.reaction.charAt(0).toUpperCase() + feedback.reaction.slice(1)}${feedback.photoURL ? '\n\n📸 *Photo attached*' : ''}${feedback.audioURL ? '\n🎵 *Voice recording attached*' : ''}`
    return encodeURIComponent(message)
  }

  const handleWhatsAppShare = (feedback) => {
    const message = formatWhatsAppMessage(feedback)
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  const pieChartData = {
    labels: ["Positive", "Negative", "Neutral"],
    datasets: [
      {
        data: [sentimentData.positive, sentimentData.negative, sentimentData.neutral],
        backgroundColor: ["#22c55e", "#ef4444", "#f59e0b"],
        hoverBackgroundColor: ["#16a34a", "#dc2626", "#d97706"],
      },
    ],
  }

  const barChartData = {
    labels: Object.keys(keywordData),
    datasets: [
      {
        label: "Keyword Frequency",
        data: Object.values(keywordData),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(123, 239, 178, 0.7)',
          'rgba(238, 130, 238, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(123, 239, 178, 1)',
          'rgba(238, 130, 238, 1)',
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  }

  const venueChartData = {
    labels: Object.keys(venueData),
    datasets: [
      {
        label: "Feedback per Venue",
        data: Object.values(venueData),
        backgroundColor: [
          'rgba(116, 185, 255, 0.7)',
          'rgba(162, 155, 254, 0.7)',
          'rgba(248, 165, 194, 0.7)',
          'rgba(144, 247, 236, 0.7)',
          'rgba(255, 204, 145, 0.7)',
          'rgba(134, 252, 167, 0.7)',
        ],
        borderColor: [
          'rgba(116, 185, 255, 1)',
          'rgba(162, 155, 254, 1)',
          'rgba(248, 165, 194, 1)',
          'rgba(144, 247, 236, 1)',
          'rgba(255, 204, 145, 1)',
          'rgba(134, 252, 167, 1)',
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          padding: 20,
          font: {
            size: 12,
            weight: 500,
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: true,
        text: "Analysis",
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        cornerRadius: 6,
        displayColors: true,
      },
    },
  }

  const barChartOptions = {
    ...chartOptions,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          padding: 8,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        display: false,
      },
    },
  }

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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/50 backdrop-blur-sm dark:bg-gray-800/50 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
              <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFeedback}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">All time responses</p>
            </CardContent>
          </Card>
          <Card className="bg-white/50 backdrop-blur-sm dark:bg-gray-800/50 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Positive</CardTitle>
              <ThumbsUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{sentimentData.positive}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Happy customers</p>
            </CardContent>
          </Card>
          <Card className="bg-white/50 backdrop-blur-sm dark:bg-gray-800/50 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Negative</CardTitle>
              <ThumbsDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{sentimentData.negative}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Areas to improve</p>
            </CardContent>
          </Card>
          <Card className="bg-white/50 backdrop-blur-sm dark:bg-gray-800/50 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Neutral</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{sentimentData.neutral}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Balanced feedback</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/50 backdrop-blur-sm dark:bg-gray-800/50 border-0 shadow-lg h-[400px] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Sentiment Analysis</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex items-center justify-center h-[300px]">
              <div className="w-full h-full max-w-[300px]">
                <Pie data={pieChartData} options={{
                  ...chartOptions,
                  maintainAspectRatio: false,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      ...chartOptions.plugins.legend,
                      position: 'bottom',
                      labels: {
                        padding: 20,
                        boxWidth: 12,
                        font: {
                          size: 11
                        }
                      }
                    }
                  }
                }} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 backdrop-blur-sm dark:bg-gray-800/50 border-0 shadow-lg h-[400px] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Keyword Analysis</CardTitle>
            </CardHeader>
            <CardContent className="p-4 h-[320px]">
              <Bar 
                options={barChartOptions} 
                data={barChartData}
                className="h-full"
              />
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 backdrop-blur-sm dark:bg-gray-800/50 border-0 shadow-lg h-[400px] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Venue Analysis</CardTitle>
            </CardHeader>
            <CardContent className="p-4 h-[320px]">
              <Bar 
                options={barChartOptions} 
                data={venueChartData}
                className="h-full"
              />
            </CardContent>
          </Card>
        </div>

        {/* Feedback List */}
        <Card className="bg-white/50 backdrop-blur-sm dark:bg-gray-800/50 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              </div>
            ) : (
              <ul className="space-y-6">
                {feedbackData.map((feedback) => (
                  <li key={feedback.id} className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${feedback.name}`} />
                          <AvatarFallback>{feedback.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{feedback.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{feedback.email}</div>
                          {feedback.phone && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <PhoneCall className="h-3 w-3 mr-1" />
                              {feedback.phone}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDateTime(feedback.createdAt)}
                      </div>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      <Badge
                        className={`${
                          feedback.reaction === "positive"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : feedback.reaction === "negative"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        }`}
                      >
                        {feedback.reaction}
                      </Badge>
                      {feedback.venue && (
                        <Badge variant="outline" className="border-gray-300 dark:border-gray-600">
                          {feedback.venue}
                        </Badge>
                      )}
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm sm:text-base">
                      {feedback.feedback}
                    </p>

                    <div className="flex flex-wrap gap-4">
                      {feedback.photoURL && (
                        <div className="relative group">
                          <img
                            src={feedback.photoURL}
                            alt={`Feedback from ${feedback.name}`}
                            className="w-32 sm:w-48 h-32 sm:h-48 object-cover rounded-lg transition-transform group-hover:scale-105"
                          />
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {feedback.audioURL && (
                          <Button
                            onClick={() => handleAudioPlay(feedback.audioURL, feedback.id)}
                            variant="outline"
                            size="sm"
                            className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            {audioStates[feedback.id] ? (
                              <Pause className="h-4 w-4 mr-2" />
                            ) : (
                              <Play className="h-4 w-4 mr-2" />
                            )}
                            Voice Recording
                          </Button>
                        )}
                        <Button
                          onClick={() => handleWhatsAppShare(feedback)}
                          variant="outline"
                          size="sm"
                          className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
  {/* Pagination */}
  <div className="flex justify-center mt-6">
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
  )
}