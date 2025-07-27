
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
    const htmlBody = `
        <h2 style="color: #8c59f2; margin-top: 0;">Имате нова резервация!</h2>
        <p>Поздравления! Имате нова резервация за Вашия салон, <strong>${salonName}</strong>.</p>
        <p>По-долу са детайлите за резервацията:</p>
        <ul style="padding-left: 20px; list-style-type: disc;">
          <li><strong>Клиент:</strong> ${clientName}</li>
          <li><strong>Телефон:</strong> ${clientPhoneNumber || 'Няма предоставен'}</li>
          <li><strong>Услуга:</strong> ${serviceName}</li>
          <li><strong>Дата:</strong> ${bookingDate}</li>
          <li><strong>Час:</strong> ${bookingTime}</li>
        </ul>
        <p>Моля, прегледайте и потвърдете резервацията от Вашия бизнес панел в Glaura.</p>
        <p style="margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/business/manage" style="background-color: #8c59f2; color: #ffffff; padding: 12px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">
                Към Бизнес Панела
            </a>
        </p>
    `;

     const html = `
      <!DOCTYPE html>
      <html lang="bg">
      <head>
          <meta charset="UTF-8">
          <title>${subject}</title>
          <style>
            body { margin: 0; padding: 0; background-color: #f8f5ff; font-family: Arial, sans-serif; }
          </style>
      </head>
      <body>
          <table width="100%" bgcolor="#f8f5ff" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <table width="600" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                  <tr>
                    <td align="center" bgcolor="#8c59f2" style="padding: 20px; color: #ffffff; font-size: 24px;">
                      ✨ Glaura.eu - Нова Резервация
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px; color: #333333; font-size: 16px;">
                      ${htmlBody}
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 20px; font-size: 13px; color: #888888;">
                      © ${new Date().getFullYear()} Glaura.eu. Всички права запазени.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
      </body>
      </html>
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
