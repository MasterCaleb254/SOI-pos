import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  
  try {
    const payload = await request.json();
    console.log('M-Pesa Callback:', payload);

    // Verify the callback is valid
    if (!payload.Body.stkCallback || !payload.Body.stkCallback.CallbackMetadata) {
      console.error('Invalid M-Pesa callback:', payload);
      return NextResponse.json({ status: 'error', message: 'Invalid callback' }, { status: 400 });
    }

    const { Body: { stkCallback: callback } } = payload;
    const resultCode = callback.ResultCode;
    const checkoutRequestId = callback.CheckoutRequestID;
    
    // Get the transaction details
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('mpesa_reference', checkoutRequestId)
      .single();

    if (txError || !transaction) {
      console.error('Transaction not found:', checkoutRequestId);
      return NextResponse.json({ status: 'error', message: 'Transaction not found' }, { status: 404 });
    }

    if (resultCode === 0) {
      // Payment was successful
      const metadata = callback.CallbackMetadata.Item;
      const amount = metadata.find((item: any) => item.Name === 'Amount')?.Value || 0;
      const mpesaReceiptNumber = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value || '';
      const transactionDate = metadata.find((item: any) => item.Name === 'TransactionDate')?.Value || '';
      const phoneNumber = metadata.find((item: any) => item.Name === 'PhoneNumber')?.Value || '';

      // Update transaction status
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'completed',
          mpesa_receipt: mpesaReceiptNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Failed to update transaction:', updateError);
        throw updateError;
      }

      // Log the successful transaction
      await supabase.from('audit_logs').insert({
        user_id: transaction.user_id,
        action: 'payment_received',
        table_name: 'transactions',
        record_id: transaction.id,
        new_values: {
          status: 'completed',
          mpesa_receipt: mpesaReceiptNumber,
          amount,
        },
      });
    } else {
      // Payment failed
      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);

      // Log the failed transaction
      await supabase.from('audit_logs').insert({
        user_id: transaction.user_id,
        action: 'payment_failed',
        table_name: 'transactions',
        record_id: transaction.id,
        new_values: {
          status: 'failed',
          failure_reason: callback.ResultDesc || 'Payment failed',
        },
      });
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
