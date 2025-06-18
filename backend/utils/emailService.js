const nodemailer = require('nodemailer');

// Create a transporter object using SMTP transport
// Configuration will be pulled from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10) || 587, // Default to 587 if not specified
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Your email user
    pass: process.env.EMAIL_PASS, // Your email password
  },
  // Optional: add TLS configuration if needed, e.g., for self-signed certificates
  // tls: {
  //   rejectUnauthorized: false // Use only for development/testing with self-signed certs
  // }
});

/**
 * Sends an email.
 * @param {string} to - Recipient's email address.
 * @param {string} subject - Subject of the email.
 * @param {string} html - HTML body of the email.
 * @param {string} [text] - Optional plain text body of the email.
 */
const sendEmail = async (to, subject, html, text) => {
  try {
    const mailOptions = {
      from: `"Visitor Management System" <${process.env.EMAIL_FROM}>`, // Sender address
      to: to, // List of receivers
      subject: subject, // Subject line
      html: html, // HTML body
    };

    if (text) {
      mailOptions.text = text; // Plain text body
    }

    // Log email details for conceptual testing
    console.log('Attempting to send email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      htmlLength: html.length,
      textLength: text ? text.length : 0,
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER ? '******' : undefined // Mask user if present for logging
    });

    // In a real scenario, ensure EMAIL_HOST etc. are set.
    // For this subtask, we are not sending a real email but preparing the structure.
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.EMAIL_FROM) {
      console.warn('Email environment variables are not fully configured. Email not sent.');
      // Simulating a successful send for testing purposes when not fully configured
      // In a real app, you might throw an error or handle differently.
      return { messageId: `simulated-${Date.now()}`, info: 'Email simulated as sent.' };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully: %s', info.messageId);
    // For testing with services like Ethereal, info.getTestMessageUrl() might be available
    // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    return info;

  } catch (error) {
    console.error('Error sending email:', error);
    // In a real application, you might want to throw the error or handle it more gracefully
    // For instance, by notifying an admin or logging to a more persistent store.
    throw error; // Re-throw the error to be handled by the caller
  }
};

// Example of how to use a test account (e.g., Ethereal) for development
// This part is for documentation/example purposes and would typically not run directly
// unless explicitly called in a test script.
const createTestEmailAccount = async () => {
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_HOST) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log(`
        ***************************************************************************
        Ethereal test account created. Configure these in your .env for testing:
        EMAIL_HOST=${testAccount.smtp.host}
        EMAIL_PORT=${testAccount.smtp.port}
        EMAIL_SECURE=${testAccount.smtp.secure}
        EMAIL_USER=${testAccount.user}
        EMAIL_PASS=${testAccount.pass}
        EMAIL_FROM="Your Name <${testAccount.user}>" (or any from address)

        Then send an email using the sendEmail function.
        Preview emails at: ${nodemailer.getTestMessageUrl({ messageId: 'fake-id' })}
        (Replace fake-id with actual messageId after sending)
        ***************************************************************************
      `);
      // This is just to show how to get credentials, not to reconfigure the main transporter here.
    } catch (err) {
      console.error('Failed to create a testing account. Try again later.', err);
    }
  }
};

// Call it once, for example, at app startup in development if no email host is set
// createTestEmailAccount(); // Commented out to prevent execution during automated tasks

module.exports = { sendEmail, createTestEmailAccount };
