import { NextApiRequest, NextApiResponse } from 'next';

// This file is no longer used for Stripe webhooks.

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // This endpoint is now a placeholder or can be removed if no longer needed.
  res.status(200).json({ message: 'Stripe webhooks are disabled.' });
}
}