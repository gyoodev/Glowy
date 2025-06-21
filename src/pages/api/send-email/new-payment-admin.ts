import type { NextApiRequest, NextApiResponse } from 'next';
import { createTransport } from './index'; // Assuming createTransport is exported from index.ts
import { emailTemplate } from './emailTemplate'; // Assuming emailTemplate is exported from emailTemplate.ts
import nodemailer from 'nodemailer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { paymentDetails } = req.body; // Expect payment details in the request body

  if (!paymentDetails) {
    return res.status(400).json({ message: 'Missing payment details in request body' });
  }

  try {
    const transporter = await createTransport();

    // Define the specific content for the new payment email (for admins)
    const emailContent = `
      <p>Получено е ново плащане.</p>
      <p>Детайли за плащането:</p>
      <ul>
        <li>Сума: ${paymentDetails.amount || 'N/A'}</li>
        <li>Свързана услуга/резервация: ${paymentDetails.relatedService || 'N/A'}</li>
        <li>Клиент: ${paymentDetails.clientName || 'N/A'}</li>
        <li>ID на плащането: ${paymentDetails.paymentId || 'N/A'}</li>
        ${paymentDetails.otherDetails ? `<li>Други детайли: ${paymentDetails.otherDetails}</li>` : ''}
      </ul>
      <p>Моля, проверете административния панел за повече информация.</p>
    `;

    // Define button details (optional for this email type)
    const buttonText = 'Виж плащанията в админ панела'; // Placeholder button text
    const buttonUrl = 'https://glaura.eu/admin/payments'; // Placeholder button URL

    // Replace placeholders in the HTML template
    let emailHtml = emailTemplate.replace(
      '{Текстът да е тук според вида имейл...... }',
      emailContent
    );

    // Optionally include the button HTML if a button is desired
    if (buttonText && buttonUrl) {
      const buttonHtml = `<a href="${buttonUrl}" class="cta-button">${buttonText}</a>`;
       emailHtml = emailHtml.replace(
         '<a href="https://glaura.eu" class="cta-button">{ Бутон за съответната дейност ...}</a>',
         buttonHtml
       );
    } else {
       // Remove the button placeholder if no button is needed
       emailHtml = emailHtml.replace(
         '<a href="https://glaura.eu" class="cta-button">{ Бутон за съответната дейност ...}</a>',
         ''
       );
    }


    // Define admin email recipient (replace with your actual admin email address/es)
    const adminEmail = process.env.ADMIN_EMAIL_RECIPIENT; // Use environment variable for admin email

    if (!adminEmail) {
         console.error("ADMIN_EMAIL_RECIPIENT environment variable is not set.");
         return res.status(500).json({ message: 'Admin recipient email not configured.' });
    }


    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || '"Glaura Notifications" <noreply@glaura.eu>', // Replace with your desired sender email
      to: adminEmail, // Send to the admin email address
      subject: 'Ново плащане в Glaura', // Email subject
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'New payment email sent to admin successfully' });
  } catch (error: any) {
    console.error('Error sending new payment email to admin:', error);
    res.status(500).json({ message: 'Failed to send new payment email to admin', error: error.message });
  }
}