import type { NextApiRequest, NextApiResponse } from 'next';
import { createTransport } from './index'; // Assuming createTransport is exported from index.ts
import { emailTemplate } from './emailTemplate';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { clientEmail, clientName, bookingDetails } = req.body; // Expecting data in the request body

  if (!clientEmail || !clientName || !bookingDetails) {
    return res.status(400).json({ message: 'Missing required fields in request body' });
  }

  try {
    const transporter = createTransport();

    // --- Define email specific content and button ---
    const emailBody = `Здравей ${clientName},<br/><br/>Твоята резервация е успешно създадена. Ето подробности:<br/><br/>${JSON.stringify(bookingDetails, null, 2).replace(/\\n/g, '<br/>')}<br/><br/>Благодарим ти, че избра Glaura!`; // Placeholder content
    const buttonText = "Преглед на резервацията"; // Placeholder button text
    const buttonUrl = "https://glaura.eu/account"; // Placeholder button URL

    // --- Generate HTML with content inserted into template ---
    const htmlContent = emailTemplate
      .replace('{Текстът да е тук според вида имейл...... }', emailBody)
      .replace('{ Бутон за съответната дейност ...}', buttonText)
      .replace('href="https://glaura.eu"', `href="${buttonUrl}"`); // Replace the general button link


    const mailOptions = {
      from: process.env.SMTP_USER, // Sender address
      to: clientEmail, // Recipient address
      subject: 'Потвърждение за твоята резервация в Glaura', // Subject line
      html: htmlContent, // HTML body
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Booking confirmation email sent to client successfully' });
  } catch (error: any) {
    console.error('Error sending booking confirmation email to client:', error);
    res.status(500).json({ message: 'Error sending email', error: error.message });
  }
}