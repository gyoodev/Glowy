import type { NextApiRequest, NextApiResponse } from 'next';
import { initTransporter } from './index'; // Renamed for clarity
import { emailTemplate } from './emailTemplate';
import { type SendMailOptions } from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const transporter = initTransporter();

    const escapeHtml = (unsafe: string) =>
      unsafe.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

    const emailBodyContent = `
      Получено е ново запитване от контактната форма:
      <br><br>
      <strong>Име:</strong> ${escapeHtml(name)}<br>
      <strong>Имейл:</strong> ${escapeHtml(email)}<br>
      <strong>Съобщение:</strong><br>
      ${safeMessage}
    `;

    let emailHtml = emailTemplate.replace('{Текстът да е тук според вида имейл...... }', emailBodyContent);

    // Remove button if not needed
    emailHtml = emailHtml.replace(/<a href="https:\/\/glaura.eu" class="cta-button">\{ Бутон за съответната дейност \.\.\.\}<\/a>/, '');

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.error('ADMIN_EMAIL environment variable is not set.');
      return res.status(500).json({ message: 'Server configuration error: Admin email not set.' });
    }

    const mailOptions: SendMailOptions = {
      from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      to: adminEmail,
      subject: 'Ново запитване от контактната форма',
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);

    console.log(`Contact form email sent to admin: ${adminEmail}`);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Error sending contact form email:', error);
    res.status(500).json({ message: 'Error sending email', error: error.message });
  }
}
