import nodemailer from 'nodemailer';

/**
 * Send Email utility using Nodemailer
 * Configured with Gmail SMTP by default using EMAIL_USER and EMAIL_PASS from .env
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  const emailUser = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : 'mohdaffan338@gmail.com';
  // Strip any accidental spaces so both 'abcd efgh' and 'abcdefgh' work smoothly
  const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim().replace(/\s+/g, '') : undefined;

  console.log('\n===============================================');
  console.log(`📧 [EMAIL NOTIFICATION SYSTEM]`);
  console.log(`From: ${emailUser}`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('===============================================');

  if (emailUser && emailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass, // Google 16-character App Password
        },
      });

      const mailOptions = {
        from: `"AiKMS Support" <${emailUser}>`,
        to,
        subject,
        text,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Real email delivered to ${to}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`❌ Nodemailer Error sending to ${to}:`, err.message);
      // Return false but don't crash so OTP flow can continue
      return { success: false, error: err.message };
    }
  } else {
    console.warn(`⚠️ EMAIL_PASS not set in .env. To receive real emails in your inbox, set EMAIL_PASS in Backend/.env (Google App Password).`);
    return { success: false, reason: 'NO_CREDENTIALS' };
  }
};

export default sendEmail;
