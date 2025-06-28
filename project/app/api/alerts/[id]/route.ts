import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { acknowledgeRestockAlert, completeRestockAlert } from '@/lib/restock-alerts';

type Params = {
  params: {
    id: string;
  };
};

export async function PATCH(
  request: Request,
  { params }: Params
) {
  const supabase = createClient();
  
  try {
    const { id: alertId } = params;
    const { action, quantity } = await request.json();
    
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

    let result;
    
    if (action === 'acknowledge') {
      result = await acknowledgeRestockAlert(alertId, user.id);
    } else if (action === 'complete' && quantity) {
      result = await completeRestockAlert(alertId, user.id, quantity);
    } else {
      return NextResponse.json(
        { error: 'Invalid action or missing quantity' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error updating restock alert:', error);
    return NextResponse.json(
      { error: 'Failed to update restock alert' },
      { status: 500 }
    );
  }
}
