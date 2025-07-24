
import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '@/lib/email-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { clientEmail, clientName, salonName, serviceName, bookingDate, bookingTime, newStatus } = req.body;

  if (!clientEmail || !clientName || !salonName || !serviceName || !bookingDate || !bookingTime || !newStatus) {
    return res.status(400).json({ message: 'Missing required fields' });
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
    res.status(200).json({ message: 'Email sent successfully' });
  } else {
    res.status(500).json({ message: result.message });
  }
}
