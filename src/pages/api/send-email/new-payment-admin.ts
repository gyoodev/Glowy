
import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '@/lib/email-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { packageName, price, salonName, businessId, transactionId } = req.body;

    if (!packageName || price === undefined || !salonName || !businessId || !transactionId) {
      return res.status(400).json({ success: false, message: 'Missing required fields for payment notification.' });
    }

    const adminEmail = process.env.ADMIN_EMAIL_RECIPIENT;
    if (!adminEmail) {
      console.error("ADMIN_EMAIL_RECIPIENT is not set in environment variables.");
      return res.status(500).json({ success: false, message: 'Server configuration error: Admin email recipient not set.' });
    }

    const subject = `✅ Ново плащане за промоция в Glaura!`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Получено е ново плащане за промоция.</h2>
          <p><strong>Салон:</strong> ${salonName} (ID: ${businessId})</p>
          <p><strong>Закупен пакет:</strong> ${packageName}</p>
          <p><strong>Сума:</strong> ${price} EUR</p>
          <p><strong>Трансакция ID:</strong> ${transactionId}</p>
          <p>Плащането е успешно обработено и промоцията е активирана.</p>
          <p>Можете да прегледате всички плащания в <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/payments">административния панел</a>.</p>
        </div>
      `;

    const result = await sendEmail({ to: adminEmail, subject, html });
    
    if (result.success) {
      return res.status(200).json({ success: true, message: 'Admin payment notification sent successfully' });
    } else {
      console.error('Email sending failed from API route:', result.message);
      return res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Unhandled error in new-payment-admin API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return res.status(500).json({ success: false, message: errorMessage });
  }
}
