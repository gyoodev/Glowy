
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

    const emailResult = await sendEmail({
      to: process.env.SMTP_FROM_EMAIL || 'noreply@glaura.eu', // Send from the main account
      bcc: emails.join(','), // Use BCC to protect subscriber privacy
      subject: subject,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>`,
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
