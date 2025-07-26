
import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '@/lib/email-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { ownerEmail, ownerName, salonName } = req.body;

    if (!ownerEmail || !ownerName || !salonName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const subject = `Вашият салон "${salonName}" е изпратен за одобрение!`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Здравейте, ${ownerName},</h2>
          <p>Благодарим Ви, че регистрирахте Вашия салон, <strong>${salonName}</strong>, в Glaura!</p>
          <p>Вашата заявка е получена и в момента се преглежда от нашия екип. Ще получите известие по имейл, веднага щом статусът на Вашия салон бъде променен.</p>
          <p>Поздрави,<br>Екипът на Glaura</p>
        </div>
      `;

    const result = await sendEmail({ to: ownerEmail, subject, html });

    if (result.success) {
      return res.status(200).json({ success: true, message: 'Owner confirmation email sent successfully' });
    } else {
      return res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return res.status(500).json({ success: false, message: errorMessage });
  }
}
