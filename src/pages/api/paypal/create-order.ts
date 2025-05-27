
import type { NextApiRequest, NextApiResponse } from 'next';
import paypal from '@paypal/checkout-server-sdk';

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("FATAL ERROR: PayPal Client ID or Client Secret is not set for create-order API.");
}

// Always use LiveEnvironment
const environment = new paypal.core.LiveEnvironment(clientId!, clientSecret!);
const client = new paypal.core.PayPalHttpClient(environment);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method ' + req.method + ' Not Allowed');
  }

  if (!clientId || !clientSecret) {
    console.error("PayPal API credentials not configured on the server for create-order.");
    return res.status(500).json({ success: false, message: 'PayPal API credentials not configured on the server.' });
  }

  const { amount, currency, packageId, businessId, description } = req.body;

  if (!amount || !currency || !packageId || !businessId) {
      return res.status(400).json({ success: false, message: 'Missing required fields (amount, currency, packageId, businessId).' });
  }

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: currency,
        value: amount,
      },
      custom_id: packageId,
      reference_id: businessId,
      description: description || ('Promotion: ' + packageId + ' for business ' + businessId),
    }],
  });

  try {
    const order = await client.execute(request);
    res.status(200).json({ success: true, orderID: order.result.id });
  } catch (error: any) {
    console.error('PayPal Create Order Error:', JSON.stringify(error, null, 2));
    let errorMessage = 'Failed to create PayPal order.';
    let errorDetails = null;

    if (error.isAxiosError && error.response && error.response.data) { // PayPal SDK v1.x uses Axios-like errors
        errorMessage = error.response.data.message || errorMessage;
        errorDetails = error.response.data.details;
        if (error.response.data.details && error.response.data.details.length > 0) {
            const detailsString = error.response.data.details.map((d:any) => d.issue + (d.description ? ' (' + d.description + ')' : '') ).join(', ');
            errorMessage += ' Details: ' + detailsString;
        }
        console.error('PayPal Create Order Error Details:', error.response.data);
    } else if (error.message) { // Fallback for other error types
        errorMessage = error.message;
    }
    res.status(500).json({ success: false, message: errorMessage, details: errorDetails });
  }
}
