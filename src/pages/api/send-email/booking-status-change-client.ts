
import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '@/lib/email-service';
// import 'dotenv/config'; // Removed this line as Next.js handles .env files automatically.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { clientEmail, clientName, salonName, serviceName, bookingDate, bookingTime, newStatus } = req.body;

    if (!clientEmail || !clientName || !salonName || !serviceName || !bookingDate || !bookingTime || !newStatus) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const subject = `Промяна в статуса на Вашата резервация в ${salonName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Здравейте, ${clientName},</h2>
        <p>Има промяна в статуса на Вашата резервация в салон <strong>${salonName}</strong>.</p>
        <ul>
          <li><strong>Услуга:</strong> ${serviceName}</li>
          <li><strong>Дата:</strong> ${bookingDate}</li>
          <li><strong>Час:</strong> ${bookingTime}</li>
          <li><strong>Нов статус:</strong> <span style="font-weight: bold; color: #8A2BE2;">${newStatus}</span></li>
        </ul>
        <p>Ако имате въпроси, моля, свържете се директно със салона.</p>
        <p>Поздрави,<br>Екипът на Glaura</p>
      </div>
    `;

    const result = await sendEmail({ to: clientEmail, subject, html });

    if (result.success) {
      return res.status(200).json({ success: true, message: 'Email sent successfully' });
    } else {
      // The sendEmail function now provides a more detailed message
      console.error('Email sending failed from API route:', result.message);
      return res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Unhandled error in booking-status-change-client API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return res.status(500).json({ success: false, message: errorMessage });
  }
}
