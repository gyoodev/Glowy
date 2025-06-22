import nodemailer, { Transporter } from 'nodemailer';
import type { NextApiRequest, NextApiResponse } from 'next';
import { emailTemplate } from './emailTemplate';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { paymentDetails } = req.body;

  if (!paymentDetails) {
    return res.status(400).json({ message: 'Missing payment details in request body' });
  }

  try {
    const transporter: Transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // emailContent, buttonText, etc. – everything remains the same...

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

    const buttonText = 'Виж плащанията в админ панела';
    const buttonUrl = 'https://glaura.eu/admin/payments';

    let emailHtml = emailTemplate.replace(
      '{Текстът да е тук според вида имейл...... }',
      emailContent
    );

    const buttonHtml = `<a href="${buttonUrl}" class="cta-button">${buttonText}</a>`;
    emailHtml = emailHtml.replace(
      '<a href="https://glaura.eu" class="cta-button">{ Бутон за съответната дейност ...}</a>',
      buttonHtml
    );

    const adminEmail = process.env.ADMIN_EMAIL_RECIPIENT;
    if (!adminEmail) {
      console.error('ADMIN_EMAIL_RECIPIENT is not set.');
      return res.status(500).json({ message: 'Admin email not configured.' });
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || '"Glaura Notifications" <noreply@glaura.eu>',
      to: adminEmail,
      subject: 'Ново плащане в Glaura',
      html: emailHtml,
    });

    res.status(200).json({ message: 'New payment email sent to admin successfully' });
  } catch (error: any) {
    console.error('Error sending new payment email:', error);
    res.status(500).json({ message: 'Failed to send new payment email', error: error.message });
  }
}
