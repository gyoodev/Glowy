// src/lib/email-service.ts
import nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  bcc?: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export const sendEmail = async (options: MailOptions): Promise<{ success: boolean; message: string }> => {
  // Check for required environment variables at runtime
  const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_EMAIL'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    const errorMessage = `Server configuration error: The following SMTP environment variables are missing: ${missingEnvVars.join(', ')}. Please configure them in your .env.local file.`;
    console.error(errorMessage);
    return { success: false, message: errorMessage };
  }

  // Create transporter inside the function to ensure env vars are loaded
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true, // Explicitly set to true for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Glaura" <${process.env.SMTP_FROM_EMAIL}>`,
    ...options,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email sent successfully.' };
  } catch (error) {
    console.error('Error sending email:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to send email: ${errorMessage}` };
  }
};
