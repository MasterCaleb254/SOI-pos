import { NextResponse } from 'next/server';
import { checkAndCreateRestockAlerts } from '@/lib/restock-alerts';

// This endpoint should be protected with a secret key in production
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // Verify the request is coming from our cron job
  if (process.env.NODE_ENV === 'production' && 
      (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const alerts = await checkAndCreateRestockAlerts();
    
    // Here you could add code to send email/SMS notifications
    // to admins/managers about the restock alerts
    
    return NextResponse.json({
      success: true,
      alerts_checked: alerts.length,
      alerts_created: alerts.filter((alert: { status: string }) => alert.status === 'pending').length
    });
  } catch (error) {
    console.error('Error in restock check cron job:', error);
    return NextResponse.json(
      { error: 'Failed to check restock alerts' },
      { status: 500 }
    );
  }
}
