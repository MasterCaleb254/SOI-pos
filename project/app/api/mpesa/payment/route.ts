import { NextResponse } from 'next/server';
import { getMpesaAuthToken } from '@/lib/mpesa-auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { phone, amount, accountReference, description } = await request.json();
    
    // Format phone number (strip + and leading 0, add 254)
    const formattedPhone = phone.startsWith('+')
      ? phone.substring(1)
      : phone.startsWith('0')
      ? `254${phone.substring(1)}`
      : phone;

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, -3);
    
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const token = await getMpesaAuthToken();
    
    const response = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: process.env.MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: amount,
          PartyA: formattedPhone,
          PartyB: process.env.MPESA_SHORTCODE,
          PhoneNumber: formattedPhone,
          CallBackURL: `${process.env.NEXTAUTH_URL}/api/mpesa/callback`,
          AccountReference: accountReference,
          TransactionDesc: description,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errorMessage || 'Failed to initiate M-Pesa payment');
    }

    // Save the checkout request ID to verify later
    await supabase.from('transactions').insert({
      user_id: user.id,
      amount,
      status: 'pending',
      payment_method: 'mpesa',
      mpesa_reference: data.CheckoutRequestID,
      description,
    });

    return NextResponse.json({
      success: true,
      checkoutRequestId: data.CheckoutRequestID,
      message: 'Payment initiated successfully',
    });
  } catch (error) {
    console.error('M-Pesa payment error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process payment' },
      { status: 500 }
    );
  }
}
