import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(
 req: NextApiRequest,
 res: NextApiResponse
) {
  if (req.method === 'POST') {
 try {
 // This is where the email sending logic will go later
 console.log('Received a POST request to send email.');

 // Example usage of the transporter (replace with actual email sending logic)
 const transporter = createTransport();
 // await transporter.sendMail({...});

 res.status(200).json({ message: 'Email endpoint reached successfully.' });
 } catch (error) {
 console.error('Error in email API route:', error);
 res.status(500).json({ message: 'Error processing email request.' });
 }
  } else {
    // Handle any other HTTP method
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export function createTransport() {
 // Configure the transporter using environment variables
 const transporter = nodemailer.createTransport({
 host: process.env.SMTP_HOST,
 port: parseInt(process.env.SMTP_PORT || '587', 10), // Default to 587 if not set
 secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
 auth: {
 user: process.env.SMTP_USER,
 pass: process.env.SMTP_PASS,
 },
 });
 return transporter;
}
