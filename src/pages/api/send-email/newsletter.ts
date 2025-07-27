
import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '@/lib/email-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { subject, message, emails } = req.body;

    if (!subject || !message || !Array.isArray(emails)) {
      return res.status(400).json({ success: false, message: 'Subject, message, and a list of emails are required.' });
    }

    if (emails.length === 0) {
        return res.status(200).json({ success: true, message: 'No subscriber emails provided.', sentCount: 0 });
    }

    const htmlBody = `
        <h2 style="color: #8c59f2; margin-top: 0;">${subject}</h2>
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            ${message.replace(/\n/g, '<br>')}
        </div>
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
                      ✨ Glaura.eu
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px; color: #333333; font-size: 16px;">
                      ${htmlBody}
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 20px; font-size: 13px; color: #888888;">
                      © ${new Date().getFullYear()} Glaura.eu. Всички права запазени.<br>
                      Можете да се отпишете по всяко време (бъдеща функционалност).
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
      </body>
      </html>
    `;

    const emailResult = await sendEmail({
      to: process.env.SMTP_FROM_EMAIL || 'noreply@glaura.eu', 
      bcc: emails.join(','), 
      subject: subject,
      html: html,
    });

    if (emailResult.success) {
      return res.status(200).json({ success: true, message: 'Newsletter sent successfully.', sentCount: emails.length });
    } else {
      console.error('Newsletter sending failed from API route:', emailResult.message);
      return res.status(500).json({ success: false, message: emailResult.message });
    }

  } catch (error) {
    console.error('Unhandled error in newsletter API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return res.status(500).json({ success: false, message: errorMessage });
  }
}
