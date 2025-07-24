
import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '@/lib/email-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const adminEmail = process.env.ADMIN_EMAIL_RECIPIENT;
    if (!adminEmail) {
      console.error("ADMIN_EMAIL_RECIPIENT is not set in environment variables.");
      return res.status(500).json({ success: false, message: 'Server configuration error: Admin email recipient not set.' });
    }

    const emailSubject = `Ново запитване от Glaura: ${subject || 'Без тема'}`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Получено е ново запитване от контактната форма на Glaura.</h2>
          <p><strong>Име:</strong> ${name}</p>
          <p><strong>Имейл:</strong> ${email}</p>
          ${subject ? `<p><strong>Тема:</strong> ${subject}</p>` : ''}
          <hr>
          <h3>Съобщение:</h3>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `;

    const result = await sendEmail({
      to: adminEmail,
      subject: emailSubject,
      html: html,
      replyTo: email,
    });

    if (result.success) {
      return res.status(200).json({ success: true, message: 'Admin notification email sent successfully' });
    } else {
      console.error('Email sending failed from API route:', result.message);
      return res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Unhandled error in contact-form-admin API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return res.status(500).json({ success: false, message: errorMessage });
  }
}
