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
      feedbackId: sanitizeInput(feedbackData.feedbackId)
    };

    log('Sanitized data:', sanitizedData);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Feedback from ${sanitizedData.venue}`,
      html: `
        <h2>New Feedback Received</h2>
        <p><strong>Feedback ID:</strong> ${sanitizedData.feedbackId}</p>
        <p><strong>Name:</strong> ${sanitizedData.name}</p>
        <p><strong>Email:</strong> ${sanitizedData.email}</p>
        <p><strong>Venue:</strong> ${sanitizedData.venue}</p>
        <p><strong>Reaction:</strong> ${sanitizedData.reaction}</p>
        <p><strong>Feedback:</strong> ${sanitizedData.feedback}</p>
        ${sanitizedData.photoURL ? `<p><strong>Photo:</strong> <a href="${sanitizedData.photoURL}">View attached photo</a></p>` : ''}
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      `
    };

    log('Sending email');
    await transporter.sendMail(mailOptions);
    log('Email sent successfully');

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

    // Specific error handling
    if (error.code === 'EAUTH') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          message: 'Email authentication failed',
          success: false
        })
      };
    }

    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'Invalid request format',
          success: false
        })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Failed to process feedback',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        success: false
      })
    };
  }
}
