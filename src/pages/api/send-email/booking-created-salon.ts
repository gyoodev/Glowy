import type { NextApiRequest, NextApiResponse } from 'next';
import { createTransport } from './index'; // Assuming createTransport is exported from index.ts
import { emailTemplate } from './emailTemplate';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { salonEmail, salonName, bookingDetails } = req.body; // Expecting salon email and booking details in the request body

  if (!salonEmail || !bookingDetails) {
    return res.status(400).json({ message: 'Missing required fields: salonEmail, bookingDetails' });
  }

  try {
    const transporter = await createTransport();

    // Define the specific content for the salon booking confirmation email
    const emailBody = `
      Имате нова резервация в салон ${salonName || 'Вашия салон'}!
      <br><br>
      <strong>Детайли на резервацията:</strong>
      <br>
      ${Object.entries(bookingDetails).map(([key, value]) => `<strong>${key}:</strong> ${value}`).join('<br>')}
      <br><br>
      Моля, влезте в административния панел, за да видите пълните детайли.
    `;

    const buttonText = 'Виж Резервацията';
    const buttonLink = 'https://glaura.eu/admin/bookings'; // Placeholder URL, update with actual link to booking details

    // Generate the full HTML content by inserting into the template
    const htmlContent = emailTemplate
      .replace('{Текстът да е тук според вида имейл...... }', emailBody)
      .replace('{ Бутон за съответната дейност ...}', buttonText)
      .replace('href="https://glaura.eu"', `href="${buttonLink}"`); // Update the button link

    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || 'noreply@glaura.eu', // Use environment variable for from email
      to: salonEmail,
      subject: `Нова Резервация във ${salonName || 'Вашия салон'}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    console.log(`Booking confirmation email sent to salon owner: ${salonEmail}`);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending booking confirmation email to salon owner:', error);
    res.status(500).json({ message: 'Error sending email', error });
  }
}