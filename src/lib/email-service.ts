// src/lib/email-service.ts
import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config(); // Load environment variables

const requiredEnvVars: (keyof NodeJS.ProcessEnv)[] = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_EMAIL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

let transporter: nodemailer.Transporter | null = null;
let configurationError: string | null = null;

if (missingEnvVars.length > 0) {
  configurationError = `Server configuration error: The following SMTP environment variables are missing: ${missingEnvVars.join(', ')}. Please configure them in your .env.local file.`;
  console.error(configurationError);
} else {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export const sendEmail = async (options: MailOptions): Promise<{ success: boolean; message: string }> => {
  if (!transporter || configurationError) {
    console.error("Email service is not configured. Cannot send email.", configurationError);
    return { success: false, message: configurationError || 'Email service is not configured.' };
  }

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
