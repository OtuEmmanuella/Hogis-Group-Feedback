import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Pause, Share2, PhoneCall, Download } from "lucide-react";

const FeedbackList = ({ 
  feedbackData, 
  audioStates, 
  handleAudioPlay,
  handleAudioDownload,
  handleWhatsAppShare, 
  formatDateTime,
  loading 
}) => {
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <Card className="bg-white/50 backdrop-blur-sm dark:bg-gray-800/50 border-0 shadow-lg">
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-6">Recent Feedback</h3>
        <div className="space-y-6">
          {feedbackData.map((feedback) => (
            <div
              key={feedback.id}
              className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${feedback.name}`} />
                    <AvatarFallback>{feedback.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {feedback.name}
                    </div>
                    {feedback.email && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {feedback.email}
                      </div>
                    )}
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
                  className={
                    feedback.reaction === "positive"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : feedback.reaction === "negative"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                  }
                >
                  {feedback.reaction}
                </Badge>
                {feedback.venue && (
                  <Badge variant="outline" className="border-gray-300 dark:border-gray-600">
                    {feedback.venue}
                  </Badge>
                )}
              </div>

              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300">
                  {expandedItems[feedback.id]
                    ? feedback.feedback
                    : feedback.feedback.slice(0, 150) + (feedback.feedback.length > 150 ? "..." : "")}
                </p>
                {feedback.feedback.length > 150 && (
                  <Button
                    variant="link"
                    className="mt-2 p-0 h-auto text-sm"
                    onClick={() => toggleExpand(feedback.id)}
                  >
                    {expandedItems[feedback.id] ? "Show less" : "Read more"}
                  </Button>
                )}
              </div>

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
                    <>
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
                      <Button
                        onClick={() => handleAudioDownload(feedback.audioURL, feedback.id)}
                        variant="outline"
                        size="sm"
                        className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download audio
                      </Button>
                    </>
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
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default FeedbackList;