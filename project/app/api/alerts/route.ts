import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAndCreateRestockAlerts } from '@/lib/restock-alerts';

export async function GET() {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!['admin', 'manager'].includes(profile?.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get all active alerts with product details
    const { data: alerts, error } = await supabase
      .from('restock_alerts')
      .select(`
        *,
        products(name, barcode, category)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching restock alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restock alerts' },
      { status: 500 }
    );
  }
}

export async function POST() {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check for low stock items and create alerts
    const alerts = await checkAndCreateRestockAlerts();
    
    return NextResponse.json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('Error checking restock alerts:', error);
    return NextResponse.json(
      { error: 'Failed to check restock alerts' },
      { status: 500 }
    );
  }
}
