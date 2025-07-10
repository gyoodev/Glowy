
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const {
    clientEmail,
    clientName,
    salonName,
    serviceName,
    bookingDate,
    bookingTime,
    salonAddress,
    salonPhoneNumber,
  } = req.body;

  const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_EMAIL'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    const errorMessage = `Server configuration error: The following SMTP environment variables are missing: ${missingEnvVars.join(', ')}. Please configure them in your .env.local file.`;
    console.error(errorMessage);
    return res.status(503).json({ message: 'Service Unavailable: Email service is not configured.' });
  }

  if (!clientEmail || !clientName || !salonName || !serviceName || !bookingDate || !bookingTime) {
    return res.status(400).json({ message: 'Missing required fields for new booking confirmation.' });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Glaura" <${process.env.SMTP_FROM_EMAIL}>`,
    to: clientEmail,
    subject: `✅ Вашата резервация в ${salonName} е потвърдена!`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #8A2BE2;">Здравейте, ${clientName}!</h2>
        <p>Вашата резервация беше успешно направена. Благодарим Ви, че използвате Glaura!</p>
        <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px;">Детайли на резервацията:</h3>
        <ul style="list-style-type: none; padding: 0;">
          <li><strong>Салон:</strong> ${salonName}</li>
          ${salonAddress ? `<li><strong>Адрес:</strong> ${salonAddress}</li>` : ''}
          ${salonPhoneNumber ? `<li><strong>Телефон на салона:</strong> ${salonPhoneNumber}</li>` : ''}
          <li><strong>Услуга:</strong> ${serviceName}</li>
          <li><strong>Дата:</strong> ${bookingDate}</li>
          <li><strong>Час:</strong> ${bookingTime}</li>
        </ul>
        <p>Моля, имайте предвид, че статусът на резервацията е <strong>"Чакаща"</strong>, докато не бъде потвърдена от салона. Ще получите ново известие при промяна на статуса.</p>
        <p>Можете да прегледате всички Ваши резервации във Вашия <a href="${process.env.NEXT_PUBLIC_APP_URL}/account" style="color: #8A2BE2; text-decoration: none;">профил в Glaura</a>.</p>
        <p>Поздрави,<br>Екипът на Glaura</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Client confirmation email sent successfully' });
  } catch (error) {
    console.error('Error sending client confirmation email:', error);
    res.status(500).json({ message: 'Failed to send client confirmation email' });
  }
}
