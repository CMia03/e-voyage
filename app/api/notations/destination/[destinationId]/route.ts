import { NextRequest, NextResponse } from 'next/server';
import { NotationsService } from '@/lib/data/notations-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ destinationId: string }> }
) {
  try {
    const { destinationId } = await params;    
    const notations = await NotationsService.getNotationsByDestination(destinationId);

    return NextResponse.json({
      success: true,
      message: 'Notations retrieved successfully',
      data: notations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching notations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
