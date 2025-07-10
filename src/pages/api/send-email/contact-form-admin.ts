
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Missing required fields' });
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
    from: `"Glaura Contact Form" <${process.env.SMTP_FROM_EMAIL}>`,
    to: adminEmail,
    subject: `Ново запитване от Glaura: ${subject || 'Без тема'}`,
    replyTo: email,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Получено е ново запитване от контактната форма на Glaura.</h2>
        <p><strong>Име:</strong> ${name}</p>
        <p><strong>Имейл:</strong> ${email}</p>
        ${subject ? `<p><strong>Тема:</strong> ${subject}</p>` : ''}
        <hr>
        <h3>Съобщение:</h3>
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Admin notification email sent successfully' });
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    res.status(500).json({ message: 'Failed to send admin notification email' });
  }
}
