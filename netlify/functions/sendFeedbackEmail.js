import nodemailer from 'nodemailer';

// Add timestamp to logs
const log = (message, data = '') => {
  console.log(`[${new Date().toISOString()}] ${message}`, data);
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

// Verify email configuration on cold start
transporter.verify()
  .then(() => log('Email configuration verified'))
  .catch(error => log('Email configuration error:', error));

const sanitizeInput = (input) => {
  if (!input) return '';
  return String(input).replace(/[&<>"']/g, (match) => {
    const replacements = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return replacements[match];
  });
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

// Use ESM syntax for the handler export
export async function handler(event, context) {
  log('Function invoked', { httpMethod: event.httpMethod });
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  if (event.httpMethod !== 'POST') {
    log('Invalid method:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  try {
    // Validate environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      throw new Error('Missing email configuration');
    }

    log('Parsing request body');
    const feedbackData = JSON.parse(event.body);
    log('Received feedback data:', feedbackData);

    // Validate required fields
    if (!feedbackData.name || !feedbackData.email || !feedbackData.venue) {
      log('Missing required fields:', feedbackData);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          message: 'Missing required fields',
          details: 'Name, email, and venue are required'
        })
      };
    }

    // Sanitize input data
    const sanitizedData = {
      name: sanitizeInput(feedbackData.name),
      email: sanitizeInput(feedbackData.email),
      venue: sanitizeInput(feedbackData.venue),
      reaction: sanitizeInput(feedbackData.reaction),
      feedback: sanitizeInput(feedbackData.feedback),
      photoURL: feedbackData.photoURL ? sanitizeInput(feedbackData.photoURL) : '',
      audioURL: feedbackData.audioURL ? sanitizeInput(feedbackData.audioURL) : '',
      phoneNumber: feedbackData.phoneNumber ? sanitizeInput(feedbackData.phoneNumber) : '',
      feedbackId: sanitizeInput(feedbackData.feedbackId)
    };

    log('Sanitized data:', sanitizedData);

    // Get branch-specific email configuration
    const branchConfig = branchEmails[sanitizedData.venue];
    if (!branchConfig) {
      throw new Error(`Invalid venue: ${sanitizedData.venue}`);
    }

    // Create branch-specific transporter
    const branchTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: branchConfig.email,
        pass: branchConfig.password
      }
    });

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
          .button { display: block !important; text-align: center !important; }
        }
        @media screen and (max-width: 390px) {
          .container { padding: 5px !important; }
          .content { padding: 10px !important; }
          .header img { max-width: 120px !important; }
          h1 { font-size: 20px !important; }
          h2 { font-size: 18px !important; }
        }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; box-sizing: border-box; }
        .header { background-color: #000; padding: 20px; text-align: center; }
        .header img { max-width: 200px; height: auto; }
        .content { background-color: #fff; padding: 30px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        h1, h2 { color: #000; margin-bottom: 20px; }
        .feedback-details { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
        .button { display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .reaction { display: inline-block; padding: 5px 10px; border-radius: 15px; font-size: 14px; }
        .reaction.positive { background-color: #e6f4ea; color: #137333; }
        .reaction.neutral { background-color: #fef7e0; color: #b06000; }
        .reaction.negative { background-color: #fce8e6; color: #c5221f; }
      </style>
    `;

    // Prepare branch notification email
    const branchMailOptions = {
      from: branchConfig.email,
      to: branchConfig.email,
      subject: `New Feedback from ${sanitizedData.venue}`,
      html: `
        ${emailStyles}
        <div class="container">
          <div class="header">
            <img src="https://res.cloudinary.com/dzrnkgvts/image/upload/v1740057260/Hogis_Group_Logo_2-removebg_iokit5.png" alt="Hogis Group Logo">
          </div>
          <div class="content">
            <h2>New Feedback Received</h2>
            <div class="feedback-details">
              <p><strong>Name:</strong> ${sanitizedData.name}</p>
              <p><strong>Email:</strong> ${sanitizedData.email}</p>
              <p><strong>Venue:</strong> ${sanitizedData.venue}</p>
              <p><strong>Reaction:</strong> <span class="reaction ${sanitizedData.reaction}">${sanitizedData.reaction}</span></p>
              <p><strong>Feedback:</strong> ${sanitizedData.feedback}</p>
              ${sanitizedData.phoneNumber ? `<p><strong>Phone Number:</strong> ${sanitizedData.phoneNumber}</p>` : ''}
              ${sanitizedData.photoURL ? `
              <p><strong>Photo:</strong></p>
              <div style="margin: 15px 0;">
                <img src="${sanitizedData.photoURL}" alt="Feedback Photo" style="max-width: 100%; height: auto; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              </div>` : ''}
              ${sanitizedData.audioURL ? `
              <p><strong>Audio Feedback:</strong></p>
              <div style="margin: 15px 0;">
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
                  <!-- Primary audio player with multiple sources -->
                  <audio controls controlsList="nodownload" style="width: 100%; max-width: 300px; margin-bottom: 10px;">
                    <source src="${sanitizedData.audioURL}" type="audio/mpeg">
                    <source src="${sanitizedData.audioURL}" type="audio/wav">
                    <source src="${sanitizedData.audioURL}" type="audio/ogg">
                    <source src="${sanitizedData.audioURL}" type="audio/aac">
                    Your browser does not support the audio element.
                  </audio>
                  
                  <!-- Backup players for different formats -->
                  <div style="display: none;">
                    <audio controls preload="none">
                      <source src="${sanitizedData.audioURL}" type="audio/webm">
                    </audio>
                    <audio controls preload="none">
                      <source src="${sanitizedData.audioURL}" type="audio/mp4">
                    </audio>
                  </div>
                  
                  <!-- Download options -->
                  <div style="margin-top: 10px; font-size: 13px; color: #666;">
                    <p style="margin: 5px 0;">Can't play the audio? Try these options:</p>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                      <a href="${sanitizedData.audioURL}" 
                         download="feedback_audio.mp3" 
                         style="background: #000; color: #fff; padding: 8px 15px; border-radius: 4px; text-decoration: none; display: inline-block; margin: 5px 0;">
                        Download Audio
                      </a>
                      <a href="${sanitizedData.audioURL}" 
                         target="_blank" 
                         style="background: #444; color: #fff; padding: 8px 15px; border-radius: 4px; text-decoration: none; display: inline-block; margin: 5px 0;">
                        Open in New Tab
                      </a>
                    </div>
                  </div>
                </div>
              </div>` : ''}
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Hogis Group. All rights reserved.</p>
          </div>
        </div>
      `
    };

    // Prepare admin notification email
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Feedback from ${sanitizedData.venue}`,
      html: `
        ${emailStyles}
        <div class="container">
          <div class="header">
            <img src="https://res.cloudinary.com/dzrnkgvts/image/upload/v1740057260/Hogis_Group_Logo_2-removebg_iokit5.png" alt="Hogis Group Logo">
          </div>
          <div class="content">
            <h2>New Feedback Received</h2>
            <div class="feedback-details">
              <p><strong>Name:</strong> ${sanitizedData.name}</p>
              <p><strong>Email:</strong> ${sanitizedData.email}</p>
              <p><strong>Venue:</strong> ${sanitizedData.venue}</p>
              <p><strong>Reaction:</strong> <span class="reaction ${sanitizedData.reaction}">${sanitizedData.reaction}</span></p>
              <p><strong>Feedback:</strong> ${sanitizedData.feedback}</p>
              ${sanitizedData.phoneNumber ? `<p><strong>Phone Number:</strong> ${sanitizedData.phoneNumber}</p>` : ''}
              ${sanitizedData.photoURL ? `
              <p><strong>Photo:</strong></p>
              <div style="margin: 15px 0;">
                <img src="${sanitizedData.photoURL}" alt="Feedback Photo" style="max-width: 100%; height: auto; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              </div>` : ''}
              ${sanitizedData.audioURL ? `
              <p><strong>Audio Feedback:</strong></p>
              <div style="margin: 15px 0;">
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
                  <!-- Primary audio player with multiple sources -->
                  <audio controls controlsList="nodownload" style="width: 100%; max-width: 300px; margin-bottom: 10px;">
                    <source src="${sanitizedData.audioURL}" type="audio/mpeg">
                    <source src="${sanitizedData.audioURL}" type="audio/wav">
                    <source src="${sanitizedData.audioURL}" type="audio/ogg">
                    <source src="${sanitizedData.audioURL}" type="audio/aac">
                    Your browser does not support the audio element.
                  </audio>
                  
                  <!-- Backup players for different formats -->
                  <div style="display: none;">
                    <audio controls preload="none">
                      <source src="${sanitizedData.audioURL}" type="audio/webm">
                    </audio>
                    <audio controls preload="none">
                      <source src="${sanitizedData.audioURL}" type="audio/mp4">
                    </audio>
                  </div>
                  
                  <!-- Download options -->
                  <div style="margin-top: 10px; font-size: 13px; color: #666;">
                    <p style="margin: 5px 0;">Can't play the audio? Try these options:</p>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                      <a href="${sanitizedData.audioURL}" 
                         download="feedback_audio.mp3" 
                         style="background: #000; color: #fff; padding: 8px 15px; border-radius: 4px; text-decoration: none; display: inline-block; margin: 5px 0;">
                        Download Audio
                      </a>
                      <a href="${sanitizedData.audioURL}" 
                         target="_blank" 
                         style="background: #444; color: #fff; padding: 8px 15px; border-radius: 4px; text-decoration: none; display: inline-block; margin: 5px 0;">
                        Open in New Tab
                      </a>
                    </div>
                  </div>
                </div>
              </div>` : ''}
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Hogis Group. All rights reserved.</p>
          </div>
        </div>
      `
    };

    // Prepare user confirmation email
    const userMailOptions = {
      from: branchConfig.email,
      to: sanitizedData.email,
      subject: 'Thank You for Your Feedback - Hogis Group',
      html: `
        ${emailStyles}
        <div class="container">
          <div class="header">
            <img src="https://res.cloudinary.com/dzrnkgvts/image/upload/v1740057260/Hogis_Group_Logo_2-removebg_iokit5.png" alt="Hogis Group Logo">
          </div>
          <div class="content">
            <h1>Thank You for Your Feedback!</h1>
            <p>Dear ${sanitizedData.name},</p>
            <p>We greatly appreciate you taking the time to share your experience at ${sanitizedData.venue}. Your feedback is invaluable to us and helps ensure we continue to provide exceptional service to all our guests.</p>
            
            <div class="feedback-details">
              <h2>Your Feedback Details</h2>
              <p><strong>Venue:</strong> ${sanitizedData.venue}</p>
              <p><strong>Date Submitted:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Reference ID:</strong> ${sanitizedData.feedbackId}</p>
            </div>

            <p>Our management team will carefully review your feedback and take appropriate actions to enhance our services further.</p>
            
            <p>If you have any additional comments or require immediate assistance, please don't hesitate to contact us:</p>
            <ul>
              <li>Email: ${branchConfig.email}</li>
              <li>Phone: ${sanitizedData.venue === 'Hogis Royale and Apartments' ? '07073536464' : 
                     sanitizedData.venue === 'Hogis Exclusive Suites' ? '08109516906' : 
                     sanitizedData.venue === 'Hogis Luxury Suites' ? '08099903335' : ''}</li>
            </ul>

            <p>We look forward to welcoming you back to Hogis Group properties soon.</p>
            
            <p>Best regards,<br>The Hogis Group Management Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Hogis Group. All rights reserved.</p>
            <p>${sanitizedData.venue === 'Hogis Royale and Apartments' ? '6 Bishop Moynagh Avenue, State Housing Estate, Calabar.' : 
                   sanitizedData.venue === 'Hogis Luxury Suites' ? '7 Akim Close, State Housing Estate Road, Calabar.' : 
                   sanitizedData.venue === 'Hogis Exclusive Suites' ? 'E1 Estate Lemna, Calabar.' : ''}</p>
          </div>
        </div>
      `
    };

    log('Sending emails');
    await Promise.all([
      branchTransporter.sendMail(branchMailOptions),
      transporter.sendMail(adminMailOptions),
      branchTransporter.sendMail(userMailOptions)
    ]);
    log('Emails sent successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Feedback email sent successfully',
        success: true
      })
    };

  } catch (error) {
    log('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Error sending feedback email',
        error: error.message
      })
    };
  }
}
