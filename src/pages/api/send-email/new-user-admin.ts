
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
    const htmlBody = `
      <h2 style="color: #8c59f2; margin-top: 0;">Нов потребител се регистрира в платформата.</h2>
      <p><strong>Име:</strong> ${newUserName}</p>
      <p><strong>Имейл:</strong> ${newUserEmail}</p>
      <p style="margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/users" style="background-color: #8c59f2; color: #ffffff; padding: 12px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">
          Виж всички потребители
        </a>
      </p>
    `;

    const html = `
      <!DOCTYPE html>
      <html lang="bg">
      <head>
          <meta charset="UTF-8">
          <title>${subject}</title>
          <style>
            body { margin: 0; padding: 0; background-color: #f8f5ff; font-family: Arial, sans-serif; }
          </style>
      </head>
      <body>
          <table width="100%" bgcolor="#f8f5ff" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <table width="600" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                  <tr>
                    <td align="center" bgcolor="#8c59f2" style="padding: 20px; color: #ffffff; font-size: 24px;">
                      ✨ Glaura.eu - Нов Потребител
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px; color: #333333; font-size: 16px;">
                      ${htmlBody}
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 20px; font-size: 13px; color: #888888;">
                      © ${new Date().getFullYear()} Glaura.eu. Всички права запазени.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
      </body>
      </html>
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
