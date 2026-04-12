import { NextRequest, NextResponse } from 'next/server';
import { NotationsService } from '@/lib/data/notations-service';

export async function GET(
  request: NextRequest
) {
  try {
    
    const notations = await NotationsService.getAllNotations();
    return NextResponse.json({
      success: true,
      message: 'All notations retrieved successfully',
      data: notations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching all notations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
