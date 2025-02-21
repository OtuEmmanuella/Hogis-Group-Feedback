import { Card } from "@/components/ui/card";
import { Pie, Bar } from "react-chartjs-2";

const Charts = ({ sentimentData, keywordData, venueData }) => {
  const pieChartData = {
    labels: ["Positive", "Negative", "Neutral"],
    datasets: [
      {
        data: [sentimentData.positive, sentimentData.negative, sentimentData.neutral],
        backgroundColor: ["#22c55e", "#ef4444", "#f59e0b"],
        hoverBackgroundColor: ["#16a34a", "#dc2626", "#d97706"],
      },
    ],
  };

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
  };

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
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <Card className="p-6 bg-white/50 backdrop-blur-sm dark:bg-gray-800/50 border-0 shadow-lg hover:shadow-xl transition-shadow">
        <h3 className="text-lg font-semibold mb-4">Sentiment Analysis</h3>
        <div className="h-[300px]">
          <Pie data={pieChartData} options={chartOptions} />
        </div>
      </Card>
      <Card className="p-6 bg-white/50 backdrop-blur-sm dark:bg-gray-800/50 border-0 shadow-lg hover:shadow-xl transition-shadow">
        <h3 className="text-lg font-semibold mb-4">Keyword Analysis</h3>
        <div className="h-[300px]">
          <Bar data={barChartData} options={chartOptions} />
        </div>
      </Card>
      <Card className="p-6 bg-white/50 backdrop-blur-sm dark:bg-gray-800/50 border-0 shadow-lg hover:shadow-xl transition-shadow md:col-span-2">
        <h3 className="text-lg font-semibold mb-4">Venue Distribution</h3>
        <div className="h-[300px]">
          <Bar data={venueChartData} options={chartOptions} />
        </div>
      </Card>
    </div>
  );
};

export default Charts;