import type { NextApiRequest, NextApiResponse } from 'next';
import { createTransport } from './index'; // Assuming createTransport is exported from index.ts
import { emailTemplate } from './emailTemplate'; // Assuming emailTemplate is exported from emailTemplate.ts
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const transporter = await createTransport();

    // Define the specific content for the contact form email
    const emailBodyContent = `
      Получено е ново запитване от контактната форма:
      <br><br>
      <strong>Име:</strong> ${name}<br>
      <strong>Имейл:</strong> ${email}<br>
      <strong>Съобщение:</strong><br>
      ${message.replace(/\n/g, '<br>')}
    `;

    // Define button text and URL (can be left empty if no button is needed)
    const buttonText = ''; // Leave empty if no button
    const buttonUrl = ''; // Leave empty if no button

    // Generate the full HTML for the email using the template
    let emailHtml = emailTemplate.replace('{Текстът да е тук според вида имейл...... }', emailBodyContent);

    // Replace button placeholder - remove if buttonText is empty
    if (buttonText && buttonUrl) {
      const buttonHtml = `<a href="${buttonUrl}" class="cta-button">${buttonText}</a>`;
      emailHtml = emailHtml.replace('<a href="https://glaura.eu" class="cta-button">{ Бутон за съответната дейност ...}</a>', buttonHtml);
    } else {
       // Remove the entire button if no button is needed
       emailHtml = emailHtml.replace(/<a href="https:\/\/glaura.eu" class="cta-button">\{ Бутон за съответната дейност \.\.\.\}<\/a>/, '');
    }


    // Define the admin email address
    const adminEmail = process.env.ADMIN_EMAIL; // Make sure you have an ADMIN_EMAIL environment variable

    if (!adminEmail) {
        console.error('ADMIN_EMAIL environment variable is not set.');
        return res.status(500).json({ message: 'Server configuration error: Admin email not set.' });
    }

    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER, // Use a dedicated FROM email or SMTP_USER
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