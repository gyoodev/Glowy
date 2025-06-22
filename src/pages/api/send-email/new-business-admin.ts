import type { NextApiRequest, NextApiResponse } from 'next';
import { createTransport } from './index'; // Assuming index.ts is in the same directory
import { emailTemplate } from './emailTemplate'; // Assuming emailTemplate.ts is in the same directory
import nodemailer, { type SendMailOptions } from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { businessDetails } = req.body; // Assuming business details are sent in the request body

  if (!businessDetails) {
    return res.status(400).json({ message: 'Missing businessDetails in request body' });
  }

  try {
    const transporter = await createTransport();

    const emailBodyContent = `
      <h2>Нов Бизнес Регистриран</h2>
      <p>Здравейте Администратор,</p>
      <p>В Glaura е регистриран нов бизнес. Моля, прегледайте детайлите му:</p>
      <ul>
        <li>Име на Бизнеса: ${businessDetails.name || 'Непосочено'}</li>
        <li>Имейл: ${businessDetails.email || 'Непосочен'}</li>
        <li>Телефон: ${businessDetails.phone || 'Непосочен'}</li>
        <li>Адрес: ${businessDetails.address || 'Непосочен'}</li>
        </ul>
      <p>Можете да прегледате пълните детайли в административния панел.</p>
    `;

    const buttonText = 'Прегледай Бизнеса';
    const buttonLink = 'https://glaura.eu/admin/businesses'; // Replace with the actual admin link to businesses

    const emailHtml = emailTemplate
      .replace('{Текстът да е тук според вида имейл...... }', emailBodyContent)
      .replace('{ Бутон за съответната дейност ...}', buttonText)
       .replace('href="https://glaura.eu"', `href="${buttonLink}"`); // Replace the placeholder button link

    // Replace with your admin email address(es)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@glaura.eu';

    const mailOptions: any = {
      from: process.env.SMTP_FROM || 'noreply@glaura.eu', // Replace with your sender email
      to: adminEmail,
      subject: 'Glaura: Нов Бизнес Регистриран',
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Admin notification email sent successfully' });
  } catch (error: any) {
    console.error('Error sending new business admin email:', error);
    res.status(500).json({ message: 'Error sending email', error: error.message });
  }
}