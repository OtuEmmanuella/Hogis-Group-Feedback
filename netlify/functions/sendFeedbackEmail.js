const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD // Changed to use App Password
  }
});

const sanitizeInput = (input) => {
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

exports.handler = async (event, context) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    const feedbackData = JSON.parse(event.body);

    // Input validation
    if (!feedbackData.name || !feedbackData.email || !feedbackData.venue) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Missing required fields' })
      };
    }

    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(feedbackData.name),
      email: sanitizeInput(feedbackData.email),
      venue: sanitizeInput(feedbackData.venue),
      reaction: sanitizeInput(feedbackData.reaction || ''),
      feedback: sanitizeInput(feedbackData.feedback || ''),
      photoURL: feedbackData.photoURL || ''
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Feedback from ${sanitizedData.venue}`,
      html: `
        <h2>New Feedback Received</h2>
        <p><strong>Name:</strong> ${sanitizedData.name}</p>
        <p><strong>Email:</strong> ${sanitizedData.email}</p>
        <p><strong>Venue:</strong> ${sanitizedData.venue}</p>
        <p><strong>Reaction:</strong> ${sanitizedData.reaction}</p>
        <p><strong>Feedback:</strong> ${sanitizedData.feedback}</p>
        ${sanitizedData.photoURL ? `<p><strong>Photo:</strong> <a href="${sanitizedData.photoURL}">View attached photo</a></p>` : ''}
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Feedback email sent successfully' })
    };
  } catch (error) {
    console.error('Email sending error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Failed to send email',
        error: process.env.NODE_ENV === 'development' ? error.toString() : 'Internal server error'
      })
    };
  }
};