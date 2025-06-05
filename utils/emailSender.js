const nodemailer = require('nodemailer');

// Create a nodemailer transport
const transporter = nodemailer.createTransport({
  service: 'mahi.sahai@aayaninfotech.com', // or use your email service
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASSWORD, // Your password
  },
});

// Function to send email with PDF attachment
const sendEmailWithPDF = async (to, subject, text, pdfPath) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: subject,
    text: text,
    attachments: [
      {
        filename: 'DamageReport.pdf',
        path: pdfPath,
      },
    ],
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmailWithPDF;
