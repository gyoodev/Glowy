
import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '@/lib/email-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { newUserEmail, newUserName } = req.body;

    if (!newUserEmail || !newUserName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const adminEmail = process.env.ADMIN_EMAIL_RECIPIENT;
    if (!adminEmail) {
      console.error("ADMIN_EMAIL_RECIPIENT is not set in environment variables.");
      return res.status(500).json({ success: false, message: 'Server configuration error: Admin email recipient not set.' });
    }

    const subject = `Нов потребител се регистрира в Glaura: ${newUserName}`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Нов потребител се регистрира в платформата.</h2>
          <p><strong>Име:</strong> ${newUserName}</p>
          <p><strong>Имейл:</strong> ${newUserEmail}</p>
          <p>Можете да видите всички потребители в <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/users">административния панел</a>.</p>
        </div>
      `;

    const result = await sendEmail({ to: adminEmail, subject, html });

    if (result.success) {
      return res.status(200).json({ success: true, message: 'Admin notification email sent successfully' });
    } else {
      return res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return res.status(500).json({ success: false, message: errorMessage });
  }
}
