
import type { NextApiRequest, NextApiResponse } from 'next';
import paypal from '@paypal/checkout-server-sdk';

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("FATAL ERROR: PayPal Client ID or Client Secret is not set for create-order API.");
}

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
  } catch (e: unknown) {
    let errorMessage = 'Failed to create PayPal order.';
    let errorDetails = null;

    if (e instanceof Error) {
        errorMessage = e.message;
        // Check for PayPal specific error structure
        const paypalError = e as any;
        if (paypalError.isAxiosError && paypalError.response && paypalError.response.data) {
            errorMessage = paypalError.response.data.message || errorMessage;
            errorDetails = paypalError.response.data.details;
            if (paypalError.response.data.details && paypalError.response.data.details.length > 0) {
                const detailsString = paypalError.response.data.details.map((d:any) => d.issue + (d.description ? ' (' + d.description + ')' : '') ).join(', ');
                errorMessage += ' Details: ' + detailsString;
            }
            console.error('PayPal Create Order Error Details:', paypalError.response.data);
        } else {
           console.error('PayPal Create Order Error:', e.message, e.stack);
        }
    } else {
        console.error('PayPal Create Order Error (unknown type):', e);
    }
    res.status(500).json({ success: false, message: errorMessage, details: errorDetails });
  }
}
