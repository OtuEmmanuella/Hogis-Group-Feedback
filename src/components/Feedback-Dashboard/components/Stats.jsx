import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ThumbsUp, ThumbsDown, TrendingUp } from "lucide-react";

const Stats = ({ totalFeedback, sentimentData }) => {
  return (
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
  );
};

export default Stats;