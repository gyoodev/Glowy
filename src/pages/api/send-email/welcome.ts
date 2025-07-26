
import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '@/lib/email-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { userEmail, userName } = req.body;

    if (!userEmail || !userName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const subject = `Добре дошли в Glaura, ${userName}!`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #8A2BE2;">Здравейте, ${userName}!</h2>
          <p>Добре дошли в Glaura! Радваме се, че се присъединихте към нашата общност.</p>
          <p>Вече можете да започнете да откривате най-добрите салони за красота, да четете отзиви и лесно да резервирате следващия си час.</p>
          <div style="margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/salons" style="background-color: #8A2BE2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Разгледай салоните</a>
          </div>
          <p>Ако имате въпроси, не се колебайте да се свържете с нас.</p>
          <p>Поздрави,<br>Екипът на Glaura</p>
        </div>
      `;

    const result = await sendEmail({ to: userEmail, subject, html });
    
    if (result.success) {
      return res.status(200).json({ success: true, message: 'Welcome email sent successfully' });
    } else {
      return res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return res.status(500).json({ success: false, message: errorMessage });
  }
}
