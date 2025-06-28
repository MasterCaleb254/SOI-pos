import { NextResponse } from 'next/server';
import { getMpesaAuthToken } from '@/lib/mpesa-auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkoutRequestId = searchParams.get('checkoutRequestId');

  if (!checkoutRequestId) {
    return NextResponse.json(
      { error: 'Missing checkoutRequestId' },
      { status: 400 }
    );
  }

  const supabase = createClient();
  
  try {
    // First check our database
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('mpesa_reference', checkoutRequestId)
      .single();

    if (error || !transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // If transaction is already completed or failed, return the status
    if (['completed', 'failed'].includes(transaction.status)) {
      return NextResponse.json({
        status: transaction.status,
        transaction
      });
    }

    // If still pending, check with M-Pesa
    const token = await getMpesaAuthToken();
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, -3);
    
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const response = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
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
          CheckoutRequestID: checkoutRequestId,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.errorMessage || 'Failed to verify payment' },
        { status: 400 }
      );
    }

    // Update transaction status based on M-Pesa response
    let status = 'pending';
    if (data.ResultCode === '0') {
      status = 'completed';
    } else if (data.ResultCode !== '0') {
      status = 'failed';
    }

    if (status !== transaction.status) {
      await supabase
        .from('transactions')
        .update({ status })
        .eq('id', transaction.id);
      
      // Log the status update
      await supabase.from('audit_logs').insert({
        user_id: transaction.user_id,
        action: `payment_${status}`,
        table_name: 'transactions',
        record_id: transaction.id,
        new_values: { status },
      });
    }

    return NextResponse.json({
      status,
      transaction: {
        ...transaction,
        status,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
