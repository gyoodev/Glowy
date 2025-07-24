
import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '@/lib/email-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
  
  try {
    const {
      ownerEmail,
      salonName,
      serviceName,
      bookingDate,
      bookingTime,
      clientName,
      clientPhoneNumber,
    } = req.body;

    if (!ownerEmail || !salonName || !serviceName || !bookingDate || !bookingTime || !clientName) {
      return res.status(400).json({ success: false, message: 'Missing required fields for new booking notification.' });
    }

    const subject = `🎉 Нова резервация в ${salonName}!`;
    const html = `
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
      `;

    const result = await sendEmail({ to: ownerEmail, subject, html });

    if (result.success) {
      return res.status(200).json({ success: true, message: 'Business notification email sent successfully' });
    } else {
      console.error('Email sending failed from API route:', result.message);
      return res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Unhandled error in new-booking-business API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return res.status(500).json({ success: false, message: errorMessage });
  }
}
