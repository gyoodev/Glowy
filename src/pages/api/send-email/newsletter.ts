
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendEmail } from '@/lib/email-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  if (!adminDb) {
    return res.status(503).json({ success: false, message: 'Firebase Admin SDK not initialized.' });
  }

  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required.' });
    }

    const subscribersSnapshot = await adminDb.collection('newsletterSubscribers').get();
    
    if (subscribersSnapshot.empty) {
      return res.status(200).json({ success: true, message: 'No subscribers to send to.', sentCount: 0 });
    }
    
    const subscriberEmails = subscribersSnapshot.docs.map(doc => doc.data().email).filter(Boolean);

    if (subscriberEmails.length === 0) {
        return res.status(200).json({ success: true, message: 'No valid subscriber emails found.', sentCount: 0 });
    }

    const emailResult = await sendEmail({
      to: process.env.SMTP_FROM_EMAIL || 'noreply@glaura.eu', // Send from the main account
      bcc: subscriberEmails.join(','), // Use BCC to protect subscriber privacy
      subject: subject,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>`,
    });

    if (emailResult.success) {
      return res.status(200).json({ success: true, message: 'Newsletter sent successfully.', sentCount: subscriberEmails.length });
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
