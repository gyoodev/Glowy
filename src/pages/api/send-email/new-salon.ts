import type { NextApiRequest, NextApiResponse } from 'next';
import { createTransport } from './index'; // Assuming createTransport is exported from index.ts
import { emailTemplate } from './emailTemplate'; // Assuming emailTemplate is exported from emailTemplate.ts

// This is a placeholder type for the data you'll receive in the request body
// Replace this with your actual data structure for a new salon email
interface NewSalonEmailData {
  to: string; // Salon owner's email
  salonName: string;
  ownerName: string;
  // Add other relevant data here, e.g., salon ID for a link
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const data: NewSalonEmailData = req.body;

  // Basic validation (you'll want more robust validation)
  if (!data.to || !data.salonName || !data.ownerName) {
    return res.status(400).json({ message: 'Missing required fields (to, salonName, ownerName)' });
  }

  try {
    const transporter = await createTransport();

    // --- Customize Email Content ---
    const emailBody = `
      <p>Здравей, ${data.ownerName}!</p>
      <p>Поздравления! Твоят салон <strong>"${data.salonName}"</strong> беше успешно създаден в Glaura.</p>
      <p>Вече можеш да управляваш информацията за салона си, да добавяш услуги и да приемаш резервации.</p>
      <p>Натисни бутона по-долу, за да отидеш до панела за управление на твоя салон:</p>
    `;

    const buttonText = 'Управление на салона';
    // Replace with the actual URL to the salon management page, possibly using data.salonId
    const buttonLink = 'https://glaura.eu/business/manage'; // Placeholder URL

    // Replace placeholders in the HTML template
    const htmlContent = emailTemplate
      .replace('{Текстът да е тук според вида имейл...... }', emailBody)
      .replace('{ Бутон за съответната дейност ...}', `<a href="${buttonLink}" class="cta-button">${buttonText}</a>`);
    // --- End Customize Email Content ---


    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@glaura.eu', // Use environment variable or a default sender
      to: data.to,
      subject: `Поздравления! Твоят салон "${data.salonName}" е създаден в Glaura`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    console.log(`[API/send-email/new-salon] Email sent to ${data.to} for salon ${data.salonName}`);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('[API/send-email/new-salon] Error sending email:', error);
    res.status(500).json({ message: 'Error sending email', error: error.message });
  }
}