
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config(); // Load environment variables from .env file

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { packageName, price, salonName, businessId, transactionId } = req.body;

  if (!packageName || price === undefined || !salonName || !businessId || !transactionId) {
    return res.status(400).json({ message: 'Missing required fields for payment notification.' });
  }

  const adminEmail = process.env.ADMIN_EMAIL_RECIPIENT;
  if (!adminEmail) {
    console.error("ADMIN_EMAIL_RECIPIENT is not set in environment variables.");
    return res.status(500).json({ message: 'Server configuration error: Admin email not set.' });
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
    from: `"Glaura Payments" <${process.env.SMTP_FROM_EMAIL}>`,
    to: adminEmail,
    subject: `✅ Ново плащане за промоция в Glaura!`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Получено е ново плащане за промоция.</h2>
        <p><strong>Салон:</strong> ${salonName} (ID: ${businessId})</p>
        <p><strong>Закупен пакет:</strong> ${packageName}</p>
        <p><strong>Сума:</strong> ${price} EUR</p>
        <p><strong>Трансакция ID:</strong> ${transactionId}</p>
        <p>Плащането е успешно обработено и промоцията е активирана.</p>
        <p>Можете да прегледате всички плащания в <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/payments">административния панел</a>.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Admin payment notification sent successfully' });
  } catch (error) {
    console.error('Error sending admin payment notification:', error);
    res.status(500).json({ message: 'Failed to send admin payment notification' });
  }
}
