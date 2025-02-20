import nodemailer from 'nodemailer';

// Add timestamp to logs
const log = (message, data = '') => {
  console.log(`[${new Date().toISOString()}] ${message}`, data);
};

// Branch-specific email configuration
const branchEmails = {
  'Hogis Royale and Apartments': {
    email: 'hogisroyaleandapartment@gmail.com',
    password: 'nfdqntfmnbmyzhnn'
  },
  'Hogis Luxury Suites': {
    email: 'hogisgrouphotels@gmail.com',
    password: 'qkhnrmslvuhpxqyl'
  },
  'Hogis Exclusive Suites': {
    email: 'hogisgrouphotels@gmail.com',
    password: 'qkhnrmslvuhpxqyl'
  }
};

// Common email styles
const emailStyles = `
  <style>
    @media screen and (max-width: 600px) {
      .container { padding: 10px !important; }
      .content { padding: 15px !important; }
      .header img { max-width: 150px !important; }
      h1 { font-size: 24px !important; }
      h2 { font-size: 20px !important; }
      .feedback-details { padding: 15px !important; }
    }
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; box-sizing: border-box; }
    .header { background-color: #000; padding: 20px; text-align: center; }
    .header img { max-width: 200px; height: auto; }
    .content { background-color: #fff; padding: 30px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    h1, h2 { color: #000; margin-bottom: 20px; }
    .feedback-summary { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
    .stat-box { background: #fff; padding: 15px; border-radius: 5px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-number { font-size: 24px; font-weight: bold; color: #000; }
    .stat-label { font-size: 14px; color: #666; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
  </style>
`;

// Function to generate monthly digest email content
const generateDigestEmail = (venue, monthStats) => {
  const {
    totalFeedback,
    positiveCount,
    neutralCount,
    negativeCount,
    photoCount,
    audioCount
  } = monthStats;

  const positivePercentage = ((positiveCount / totalFeedback) * 100).toFixed(1);
  const neutralPercentage = ((neutralCount / totalFeedback) * 100).toFixed(1);
  const negativePercentage = ((negativeCount / totalFeedback) * 100).toFixed(1);

  return `
    ${emailStyles}
    <div class="container">
      <div class="header">
        <img src="https://res.cloudinary.com/dzrnkgvts/image/upload/v1740057260/Hogis_Group_Logo_2-removebg_iokit5.png" alt="Hogis Group Logo">
      </div>
      <div class="content">
        <h1>Monthly Feedback Digest - ${venue}</h1>
        <p>Here's your feedback summary for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}:</p>
        
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-number">${totalFeedback}</div>
            <div class="stat-label">Total Feedback</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${positivePercentage}%</div>
            <div class="stat-label">Positive</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${neutralPercentage}%</div>
            <div class="stat-label">Neutral</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${negativePercentage}%</div>
            <div class="stat-label">Negative</div>
          </div>
        </div>

        <div class="feedback-summary">
          <h2>Feedback Breakdown</h2>
          <p><strong>Positive Feedback:</strong> ${positiveCount} responses</p>
          <p><strong>Neutral Feedback:</strong> ${neutralCount} responses</p>
          <p><strong>Negative Feedback:</strong> ${negativeCount} responses</p>
          <p><strong>Media Attachments:</strong></p>
          <ul>
            <li>Photos: ${photoCount} submissions</li>
            <li>Audio Messages: ${audioCount} recordings</li>
          </ul>
        </div>

        <p>Thank you for your continued commitment to improving our guest experience. This data helps us identify areas of excellence and opportunities for enhancement.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Hogis Group. All rights reserved.</p>
        <p>${venue === 'Hogis Royale and Apartments' ? '6 Bishop Moynagh Avenue, State Housing Estate, Calabar.' : 
             venue === 'Hogis Luxury Suites' ? '7 Akim Close, State Housing Estate Road, Calabar.' : 
             venue === 'Hogis Exclusive Suites' ? 'E1 Estate Lemna, Calabar.' : ''}</p>
      </div>
    </div>
  `;
};

// Handler for the scheduled function
export async function handler(event, context) {
  try {
    // This function should be triggered by a scheduled event (e.g., Netlify cron job)
    log('Monthly digest function invoked');

    // In a real implementation, you would:
    // 1. Query your database for the last month's feedback data
    // 2. Aggregate the statistics for each venue
    // 3. Send digest emails to each venue

    // Example monthly stats (replace with actual data from your database)
    const monthlyStats = {
      'Hogis Royale and Apartments': {
        totalFeedback: 45,
        positiveCount: 35,
        neutralCount: 8,
        negativeCount: 2,
        photoCount: 15,
        audioCount: 5
      },
      'Hogis Luxury Suites': {
        totalFeedback: 38,
        positiveCount: 30,
        neutralCount: 6,
        negativeCount: 2,
        photoCount: 12,
        audioCount: 4
      },
      'Hogis Exclusive Suites': {
        totalFeedback: 42,
        positiveCount: 33,
        neutralCount: 7,
        negativeCount: 2,
        photoCount: 14,
        audioCount: 6
      }
    };

    // Send digest emails to each branch
    for (const [venue, stats] of Object.entries(monthlyStats)) {
      const branchConfig = branchEmails[venue];
      if (!branchConfig) continue;

      const branchTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: branchConfig.email,
          pass: branchConfig.password
        }
      });

      const mailOptions = {
        from: branchConfig.email,
        to: branchConfig.email,
        subject: `Monthly Feedback Digest - ${venue} - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        html: generateDigestEmail(venue, stats)
      };

      await branchTransporter.sendMail(mailOptions);
      log(`Digest email sent to ${venue}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Monthly digest emails sent successfully' })
    };

  } catch (error) {
    log('Error sending monthly digest:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Error sending monthly digest emails',
        error: error.message
      })
    };
  }
}