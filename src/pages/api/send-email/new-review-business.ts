import type { NextApiRequest, NextApiResponse } from 'next';
import { createTransport } from './index'; // Assuming createTransport is exported from index.ts
import { emailTemplate } from './emailTemplate'; // Assuming emailTemplate is exported from emailTemplate.ts
import type { Transporter } from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { businessEmail, reviewDetails } = req.body; // Expect business email and review details in the request body

  if (!businessEmail || !reviewDetails) {
    return res.status(400).json({ message: 'Missing businessEmail or reviewDetails in request body' });
  }

  try {
    const transporter: Transporter = createTransport();

    // Define your email content here, using the reviewDetails
    const emailBody = `
      <p>Поздравления!</p>
      <p>Вашият салон получи нова оценка:</p>
      <div style="background-color: #f0eaff; padding: 20px; border-left: 4px solid #8c59f2; margin: 20px 0; border-radius: 8px;">
        <p><strong>Оценка:</strong> ${reviewDetails.rating}/5</p>
        <p><strong>Коментар:</strong> ${reviewDetails.comment || 'Няма коментар'}</p>
        <p><strong>От:</strong> ${reviewDetails.clientName || 'Анонимен клиент'}</p>
      </div>
      <p>Вижте всички оценки и отговорете на тази директно във Вашия профил.</p>
    `;

    const buttonText = "Вижте оценките";
    const buttonUrl = `https://glaura.eu/business/manage/reviews`; // Replace with the actual URL to the business reviews page

    const htmlContent = emailTemplate
      .replace('{Текстът да е тук според вида имейл...... }', emailBody)
      .replace('{ Бутон за съответната дейност ...}', buttonText)
      .replace('href="https://glaura.eu"', `href="${buttonUrl}"`); // Replace the default button link

    await transporter.sendMail({
      from: process.env.SMTP_USER, // Sender address from environment variables
      to: businessEmail, // Business email address
      subject: 'Получихте нова оценка за Вашия салон', // Email subject
      html: htmlContent,
    });

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Error sending new review email:', error);
    res.status(500).json({ message: 'Error sending email', error: error.message });
  }
}