import { createClient } from '@/lib/supabase/server';

type MpesaPaymentParams = {
  phone: string;
  amount: number;
  accountReference: string;
  description: string;
};

export async function initiateMpesaPayment(params: MpesaPaymentParams) {
  try {
    const response = await fetch('/api/mpesa/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to initiate M-Pesa payment');
    }

    return await response.json();
  } catch (error) {
    console.error('M-Pesa payment error:', error);
    throw error;
  }
}

export async function verifyMpesaPayment(checkoutRequestId: string) {
  try {
    const response = await fetch(`/api/mpesa/verify?checkoutRequestId=${checkoutRequestId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to verify M-Pesa payment');
    }

    return await response.json();
  } catch (error) {
    console.error('M-Pesa verification error:', error);
    throw error;
  }
}
