import type { NextApiRequest, NextApiResponse } from 'next';
import { createTransport } from './index'; // Assuming createTransport is exported from index.ts
import { emailTemplate } from './emailTemplate';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { clientEmail, bookingDetails, newStatus } = req.body;

  if (!clientEmail || !bookingDetails || !newStatus) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // --- Placeholder Content ---
  // TODO: Replace with actual content based on bookingDetails and newStatus
  const emailBody = `
    Вашата резервация за услуга "${bookingDetails.serviceName}" в салон "${bookingDetails.salonName}" на дата ${bookingDetails.date} е променила статуса си на "${newStatus}".
    Можете да видите детайли за вашата резервация, като натиснете бутона по-долу.
  `;

  const buttonText = 'Виж Резервацията';
  // TODO: Replace with actual link to the client's booking details page
  const buttonLink = `https://glaura.eu/account/bookings/${bookingDetails.bookingId}`;
  // --- End Placeholder Content ---

  const emailHtml = emailTemplate
    .replace('{Текстът да е тук според вида имейл...... }', emailBody)
    .replace('{ Бутон за съответната дейност ...}', buttonText)
    .replace('href="https://glaura.eu"', `href="${buttonLink}"`); // Replace default link with button link

  try {
    const transporter = await createTransport();

    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || 'noreply@glaura.eu', // Replace with your sender email env var
      to: clientEmail,
      subject: `Промяна на статуса на резервация в Glaura`, // TODO: Customize subject if needed
      html: emailHtml,
    });

    console.log(`Email sent to client ${clientEmail} for booking status change`);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Error sending booking status change email to client:', error);
    res.status(500).json({ message: 'Error sending email', error: error.message });
  }
}