import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      console.log('Received a POST request to send email.');

      const transporter = initTransporter(); // ✅ renamed and fixed

      // await transporter.sendMail({...});

      res.status(200).json({ message: 'Email endpoint reached successfully.' });
    } catch (error) {
      console.error('Error in email API route:', error);
      res.status(500).json({ message: 'Error processing email request.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// ✅ Function renamed and fixed
export function initTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}
