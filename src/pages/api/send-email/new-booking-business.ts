
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config(); // Load environment variables from .env file

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const {
    ownerEmail,
    salonName,
    serviceName,
    bookingDate,
    bookingTime,
    clientName,
    clientPhoneNumber,
  } = req.body;

  // --- Start of Fix: Add environment variable check ---
  const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_EMAIL'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    const errorMessage = `Server configuration error: The following SMTP environment variables are missing: ${missingEnvVars.join(', ')}. Please configure them in your .env.local file.`;
    console.error(errorMessage);
    // Return a specific server error indicating a configuration issue
    return res.status(503).json({ message: 'Service Unavailable: Email service is not configured.' });
  }
  // --- End of Fix ---

  if (!ownerEmail || !salonName || !serviceName || !bookingDate || !bookingTime || !clientName) {
    return res.status(400).json({ message: 'Missing required fields for new booking notification.' });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Glaura" <${process.env.SMTP_FROM_EMAIL}>`,
    to: ownerEmail,
    subject: `🎉 Нова резервация в ${salonName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Имате нова резервация за Вашия салон, ${salonName}!</h2>
        <p>По-долу са детайлите за резервацията:</p>
        <ul>
          <li><strong>Клиент:</strong> ${clientName}</li>
          <li><strong>Телефон:</strong> ${clientPhoneNumber || 'Няма предоставен'}</li>
          <li><strong>Услуга:</strong> ${serviceName}</li>
          <li><strong>Дата:</strong> ${bookingDate}</li>
          <li><strong>Час:</strong> ${bookingTime}</li>
        </ul>
        <p>Моля, прегледайте и потвърдете резервацията от Вашия бизнес панел в Glaura.</p>
        <p>Поздрави,<br>Екипът на Glaura</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Business notification email sent successfully' });
  } catch (error) {
    console.error('Error sending business notification email:', error);
    res.status(500).json({ message: 'Failed to send business notification email' });
  }
}
