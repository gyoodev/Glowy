
import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '@/lib/email-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { salonName, ownerName, ownerEmail } = req.body;

    if (!salonName || !ownerName || !ownerEmail) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const adminEmail = process.env.ADMIN_EMAIL_RECIPIENT;
    if (!adminEmail) {
      console.error("ADMIN_EMAIL_RECIPIENT is not set in environment variables.");
      return res.status(500).json({ success: false, message: 'Server configuration error: Admin email recipient not set.' });
    }

    const subject = `Нов салон за одобрение: ${salonName}`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Нов салон е регистриран и очаква одобрение.</h2>
          <p><strong>Име на салона:</strong> ${salonName}</p>
          <p><strong>Собственик:</strong> ${ownerName}</p>
          <p><strong>Имейл на собственика:</strong> ${ownerEmail}</p>
          <p>Моля, прегледайте и одобрете салона от <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/business">административния панел</a>.</p>
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
