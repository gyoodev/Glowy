import type { NextApiRequest, NextApiResponse } from 'next';
import { createTransport } from './index'; // Corrected path
import { emailTemplate } from './emailTemplate';
// import { sendEmail } from './index'; // Removed import

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { salonName, serviceName, bookingDate, to } = req.body;

    if (!salonName || !bookingDate || !to) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
      const subject = `Напомняне за оценка на посещението в ${salonName}`;
      const content = `
        <p>Здравейте,</p>
        <p>Надяваме се да сте останали доволни от посещението си в ${salonName} на ${bookingDate}${serviceName ? ` за услугата ${serviceName}` : ''}.</p>
        <p>Ще се радваме да споделите мнението си, като оставите оценка за посещението.</p>
        <p>Благодарим Ви!</p>
        <p>Екипът на Glowy</p>
      `;

      const emailHtml = emailTemplate.replace('{bodyContent}', content).replace('{button}', '');

      const transporter = createTransport();

      await transporter.sendMail({
        from: process.env.EMAIL_FROM, // Replace with your sender email
        to,
        subject,
        html: emailHtml,
      });

      res.status(200).json({ message: 'Review reminder email sent successfully' });
    } catch (error) {
      console.error('Error sending review reminder email:', error);
      res.status(500).json({ message: 'Error sending review reminder email', error });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}