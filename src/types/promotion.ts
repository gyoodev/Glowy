
export interface Promotion {
  isActive: boolean;
  packageId: string;
  packageName: string;
  purchasedAt: any; // To accommodate FieldValue.serverTimestamp() on write and string/Timestamp on read
  expiresAt: string; // ISO string date
  paymentMethod: 'paypal' | 'stripe' | 'revolut' | 'other';
  transactionId?: string;
}
