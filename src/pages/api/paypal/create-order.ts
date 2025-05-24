
interface CreateOrderPayload {
  price: number;
  businessId: string;
  // Add any other expected fields here
}

interface CreateOrderResponse {
  id: string;
  // Add other response properties if needed
}

export async function createOrder(data: CreateOrderPayload): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/paypal/create-order`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to create order: ${response.statusText}`);
    }

    const order: CreateOrderResponse = await response.json();
    return order.id;
  }
    console.error("Error in createOrder:", error);
    throw error;
  }
}
